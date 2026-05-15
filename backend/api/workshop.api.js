import QRCode from 'qrcode';

import { supabase, supabaseAdmin } from '../utils/supabase.js';
import { redis, workshopSeatKey } from '../utils/redis.js';
import { mailTransport, mailFrom, isMailConfigured } from '../utils/mailer.js';

const ACTIVE_WORKSHOP_STATUS = 'published';

const generateQRCode = async (registrationData) => {
  try {
    const qrString = JSON.stringify(registrationData);
    return await QRCode.toDataURL(qrString);
  } catch (error) {
    throw new Error(`Failed to generate QR code: ${error.message}`);
  }
};

const parseSeatValue = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = typeof value === 'string' ? Number(value) : value;
  return Number.isFinite(normalized) ? normalized : null;
};

const fetchSeatsFromDatabase = async (workshopId) => {
  const { data, error } = await supabaseAdmin
    .from('workshops')
    .select('id, available_seats, status')
    .eq('id', workshopId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
};

const sanitizeCsvFileName = (fileName) => {
  const baseName = String(fileName || 'student-upload.csv')
    .split(/[\\/]/)
    .pop()
    .replace(/[^a-zA-Z0-9._-]/g, '_');

  return baseName.toLowerCase().endsWith('.csv') ? baseName : `${baseName}.csv`;
};

const loadAuthenticatedUserId = async (authId) => {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('auth_id', authId)
    .single();

  if (error || !data) {
    throw new Error('User not found');
  }

  return data.id;
};

export const prewarmWorkshopCache = async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('workshops')
      .select('id, available_seats, status')
      .eq('status', ACTIVE_WORKSHOP_STATUS)
      .order('id', { ascending: true });

    if (error) {
      throw error;
    }

    const workshops = data ?? [];
    const pipeline = redis.pipeline();

    for (const workshop of workshops) {
      const seats = parseSeatValue(workshop.available_seats) ?? 0;
      pipeline.set(workshopSeatKey(workshop.id), String(seats));
    }

    if (workshops.length > 0) {
      await pipeline.exec();
    }

    return res.status(200).json({
      message: 'Đã làm nóng Redis cache số ghế workshop',
      cachedWorkshops: workshops.length,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const prewarmSingleWorkshop = async (workshopId) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('workshops')
      .select('id, available_seats')
      .eq('id', workshopId)
      .single();

    if (error || !data) {
      throw error || new Error('Workshop not found');
    }

    const seats = parseSeatValue(data.available_seats) ?? 0;
    await redis.set(workshopSeatKey(workshopId), String(seats));

    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
};

export const registerWorkshop = async (req, res) => {
  const userId = req.user?.id ? await loadAuthenticatedUserId(req.user.id) : Number(req.body.userId);
  const workshopId = Number(req.body.workshopId);

  if (!userId) {
    return res.status(401).json({ message: 'Vui lòng đăng nhập' });
  }

  if (!Number.isFinite(workshopId)) {
    return res.status(400).json({ message: 'Workshop không hợp lệ' });
  }

  try {
    const cacheKey = workshopSeatKey(workshopId);
    const cachedSeats = parseSeatValue(await redis.get(cacheKey));
    let seats = cachedSeats;

    if (seats === null) {
      const workshopRow = await fetchSeatsFromDatabase(workshopId);

      if (!workshopRow) {
        return res.status(404).json({ message: 'Workshop không tồn tại' });
      }

      seats = parseSeatValue(workshopRow.available_seats) ?? 0;
      await redis.set(cacheKey, String(seats));
    }

    if (seats <= 0) {
      const workshopRow = await fetchSeatsFromDatabase(workshopId);
      const databaseSeats = parseSeatValue(workshopRow?.available_seats) ?? 0;

      if (databaseSeats > 0) {
        seats = databaseSeats;
        await redis.set(cacheKey, String(databaseSeats));
      } else {
        await redis.set(cacheKey, '0');
        return res.status(400).json({ success: false, message: 'Workshop đã hết chỗ' });
      }
    }

    const qrString = `TKT-${Date.now()}-${userId}-${workshopId}`;
    const workshopData = await supabase
      .from('workshops')
      .select('id, title, start_time')
      .eq('id', workshopId)
      .single();

    if (workshopData.error || !workshopData.data) {
      return res.status(404).json({ success: false, message: 'Workshop không tồn tại' });
    }

    const userData = await supabase
      .from('users')
      .select('id, full_name, email')
      .eq('id', userId)
      .single();

    if (userData.error || !userData.data) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const qrDataUrl = await generateQRCode({
      ticketId: qrString,
      userId,
      workshopId,
      userName: userData.data.full_name,
      workshopTitle: workshopData.data.title,
      timestamp: new Date().toISOString(),
    });

    const { data, error } = await supabase.rpc('register_workshop', {
      p_user_id: userId,
      p_workshop_id: workshopId,
      p_qr_code: qrString,
    });

    if (error) {
      await redis.set(cacheKey, '0');
      return res.status(400).json({ success: false, message: error.message });
    }

    const nextSeats =
      parseSeatValue(data?.available_seats) ??
      parseSeatValue(data?.remaining_seats) ??
      parseSeatValue(data?.new_available_seats) ??
      Math.max(seats - 1, 0);

    await redis.set(cacheKey, String(nextSeats));

    // send notification to the student (web + email) - non-fatal if fails
    try {
      if (userData?.data) {
        const userFull = userData.data;
        const title = `Registration confirmed: ${workshopData.data.title}`;
        const body = `You have successfully registered for ${workshopData.data.title} on ${new Date(
          workshopData.data.start_time,
        ).toLocaleString()}.\n\nTicket: ${qrString}`;

          const subject = `Registration confirmed: ${workshopData.data.title}`;
          const text = `You have successfully registered for ${workshopData.data.title} on ${new Date(
            workshopData.data.start_time,
          ).toLocaleString()}.\nTicket: ${qrString}`;
          const html = `<p>You have successfully registered for <strong>${workshopData.data.title}</strong> on <em>${new Date(
            workshopData.data.start_time,
          ).toLocaleString()}</em>.</p><p>Ticket: <strong>${qrString}</strong></p><p><img src="${qrDataUrl}" alt="QR code"/></p>`;
      }
          await mailTransport.sendMail({
            from: mailFrom,
            to: userFull.email,
            subject,
            text,
            html,
          });
    } catch (notifyErr) {
      console.warn('Notification dispatch failed:', String(notifyErr?.message || notifyErr));
    }

    return res.status(200).json({
      success: true,
      registrationId: data?.registration_id ?? data?.id ?? null,
      qrCode: qrString,
      qrDataUrl,
      status: data?.status ?? 'confirmed',
      availableSeats: nextSeats,
    });
  } catch (error) {
    if (error?.message?.toLowerCase().includes('duplicate')) {
      try {
        const workshopRow = await fetchSeatsFromDatabase(workshopId);
        const databaseSeats = parseSeatValue(workshopRow?.available_seats) ?? 0;
        await redis.set(workshopSeatKey(workshopId), String(databaseSeats));
      } catch {
        // leave cache as-is if we cannot refresh it
      }
    }

    return res.status(400).json({ success: false, message: error.message });
  }
};

export const listWorkshops = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('workshops')
      .select(`
                *,
                rooms!inner(
                    id,
                    name,
                    layout_image_url,
                    capacity
                )
            `)
      .order('start_time', { ascending: true });

    if (error) throw error;
    return res.status(200).json({ workshops: data });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const listPublishedWorkshops = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('workshops')
      .select(`
                *,
                rooms!inner(
                    id,
                    name,
                    layout_image_url,
                    capacity
                )
            `)
      .eq('status', ACTIVE_WORKSHOP_STATUS)
      .order('start_time', { ascending: true });

    if (error) throw error;
    return res.status(200).json({ workshops: data });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const getWorkshopById = async (req, res) => {
  try {
    const id = req.params.id;
    const { data, error } = await supabase
      .from('workshops')
      .select(`
                *,
                rooms!inner(
                    id,
                    name,
                    layout_image_url,
                    capacity
                )
            `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return res.status(200).json({ workshop: data });
  } catch (err) {
    return res.status(404).json({ message: err.message });
  }
};

export const createWorkshop = async (req, res) => {
  try {
    const payload = req.body;
    const { data, error } = await supabaseAdmin
      .from('workshops')
      .insert([payload]);

    if (error) throw error;
    return res.status(201).json({ workshop: data[0] });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

export const updateWorkshop = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: 'Invalid workshop id' });

    const payload = req.body || {};

    // Prevent changing status here; use status endpoint for explicit transitions
    const { status, id: _id, ...allowed } = payload;

    const { data, error } = await supabaseAdmin
      .from('workshops')
      .update(allowed)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return res.status(200).json({ workshop: data });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
};

export const uploadCsv = async (req, res) => {
  try {
    const csv = req.body.csv;
    const fileName = sanitizeCsvFileName(req.body.fileName);

    if (!csv) {
      return res.status(400).json({ message: 'Missing csv content' });
    }

    const storagePath = `${Date.now()}-${fileName}`;
    const { data, error } = await supabaseAdmin.storage
      .from('csv_student')
      .upload(storagePath, Buffer.from(csv, 'utf8'), {
        contentType: 'text/csv; charset=utf-8',
        upsert: false,
      });

    if (error) {
      throw error;
    }

    return res.status(201).json({
      message: 'CSV uploaded to Supabase Storage',
      bucket: 'csv_student',
      path: data?.path ?? storagePath,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export const updateWorkshopStatus = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status: nextStatus } = req.body;

    if (!Number.isFinite(id)) return res.status(400).json({ message: 'Invalid workshop id' });
    if (!['published', 'cancelled'].includes(String(nextStatus))) return res.status(400).json({ message: 'Invalid status' });

    const { data: existing, error: getErr } = await supabaseAdmin
      .from('workshops')
      .select('id, status')
      .eq('id', id)
      .single();

    if (getErr || !existing) return res.status(404).json({ message: 'Workshop not found' });

    const prevStatus = existing.status;

    if (prevStatus === nextStatus) {
      return res.status(200).json({ message: 'No change', status: prevStatus });
    }

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from('workshops')
      .update({ status: nextStatus })
      .eq('id', id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    if (prevStatus === 'draft' && nextStatus === 'published') {
      await prewarmSingleWorkshop(id);
    }

    return res.status(200).json({ message: 'Workshop status updated', workshop: updated });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// NotificationDispatcher removed; emails are sent directly via mailTransport

export const getWorkshopRegistrations = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isFinite(id)) return res.status(400).json({ message: 'Invalid workshop id' });

    const { data: registrations, error } = await supabaseAdmin
      .from('registrations')
      .select(`
        id,
        user_id,
        workshop_id,
        status,
        qr_code,
        checked_in_at,
        created_at,
        users(id, student_id, full_name, email)
      `)
      .eq('workshop_id', id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return res.status(200).json({ registrations: registrations ?? [] });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};