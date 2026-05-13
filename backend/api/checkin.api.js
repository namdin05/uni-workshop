import { supabaseAdmin } from '../utils/supabase.js';

const loadStaffUserId = async (authId) => {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('auth_id', authId)
    .single();

  if (error || !data) {
    throw new Error('Không tìm thấy hồ sơ nhân sự');
  }

  return data.id;
};

export const getWorkshopManifest = async (req, res) => {
  try {
    const workshopId = Number(req.params.workshopId);

    if (!Number.isFinite(workshopId)) {
      return res.status(400).json({ message: 'Workshop không hợp lệ' });
    }

    const { data: workshop, error: workshopError } = await supabaseAdmin
      .from('workshops')
      .select('id, title, description, speaker_name, start_time, end_time, is_free, price, available_seats, total_seats, status, rooms(id, name, capacity)')
      .eq('id', workshopId)
      .single();

    if (workshopError || !workshop) {
      return res.status(404).json({ message: 'Không tìm thấy workshop' });
    }

    const { data: registrations, error } = await supabaseAdmin
      .from('registrations')
      .select(`
        id,
        user_id,
        workshop_id,
        status,
        qr_code,
        checked_in_at,
        offline_synced,
        created_at,
        users(id, student_id, full_name, email)
      `)
      .eq('workshop_id', workshopId)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return res.status(200).json({
      workshop,
      registrations: registrations ?? [],
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const syncCheckins = async (req, res) => {
  try {
    const workshopId = Number(req.body?.workshopId);
    const scans = Array.isArray(req.body?.scans) ? req.body.scans : [];

    if (!Number.isFinite(workshopId)) {
      return res.status(400).json({ message: 'Workshop không hợp lệ' });
    }

    if (!scans.length) {
      return res.status(400).json({ message: 'Không có dữ liệu để đồng bộ' });
    }

    const staffId = await loadStaffUserId(req.user.id);
    const normalizedScans = scans
      .map((scan) => ({
        registrationId: Number(scan.registrationId ?? scan.registration_id),
        qrCode: scan.qrCode ?? scan.qr_code,
        scannedAt: scan.scannedAt ?? scan.scanned_at ?? new Date().toISOString(),
        deviceId: scan.deviceId ?? scan.device_id ?? null,
      }))
      .sort((left, right) => new Date(left.scannedAt) - new Date(right.scannedAt));

    const results = [];

    for (const scan of normalizedScans) {
      if (!Number.isFinite(scan.registrationId) || !scan.qrCode) {
        results.push({
          registrationId: scan.registrationId ?? null,
          qrCode: scan.qrCode ?? null,
          status: 'invalid',
          message: 'Dữ liệu quét không hợp lệ',
        });
        continue;
      }

      const { data: registration, error: registrationError } = await supabaseAdmin
        .from('registrations')
        .select('id, workshop_id, status, qr_code, checked_in_at, offline_synced')
        .eq('id', scan.registrationId)
        .single();

      if (registrationError || !registration) {
        results.push({
          registrationId: scan.registrationId,
          qrCode: scan.qrCode,
          status: 'not_found',
          message: 'Không tìm thấy đăng ký',
        });
        continue;
      }

      if (Number(registration.workshop_id) !== workshopId || registration.qr_code !== scan.qrCode) {
        results.push({
          registrationId: registration.id,
          qrCode: scan.qrCode,
          status: 'mismatch',
          message: 'QR code không khớp workshop đang đồng bộ',
        });
        continue;
      }

      const incomingTime = new Date(scan.scannedAt).getTime();
      const existingTime = registration.checked_in_at ? new Date(registration.checked_in_at).getTime() : null;
      const shouldUpdate =
        registration.status !== 'checked_in' ||
        existingTime === null ||
        incomingTime < existingTime;

      if (!shouldUpdate) {
        results.push({
          registrationId: registration.id,
          qrCode: scan.qrCode,
          status: 'duplicate',
          checkedInAt: registration.checked_in_at,
          message: 'Bản ghi đã được check-in sớm hơn ở thiết bị khác',
        });
        continue;
      }

      const { error: updateError } = await supabaseAdmin
        .from('registrations')
        .update({
          status: 'checked_in',
          checked_in_at: scan.scannedAt,
          offline_synced: true,
        })
        .eq('id', registration.id);

      if (updateError) {
        results.push({
          registrationId: registration.id,
          qrCode: scan.qrCode,
          status: 'error',
          message: updateError.message,
        });
        continue;
      }

      const { error: logError } = await supabaseAdmin.from('offline_sync_logs').insert({
        registration_id: registration.id,
        staff_id: staffId,
        scanned_at: scan.scannedAt,
        synced_at: new Date().toISOString(),
      });

      if (logError) {
        results.push({
          registrationId: registration.id,
          qrCode: scan.qrCode,
          status: 'synced_with_warning',
          checkedInAt: scan.scannedAt,
          message: `Đăng ký đã cập nhật nhưng ghi log đồng bộ thất bại: ${logError.message}`,
        });
        continue;
      }

      results.push({
        registrationId: registration.id,
        qrCode: scan.qrCode,
        status: 'checked_in',
        checkedInAt: scan.scannedAt,
        offlineSynced: true,
        deviceId: scan.deviceId,
      });
    }

    return res.status(200).json({
      message: 'Đồng bộ check-in hoàn tất',
      workshopId,
      results,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};