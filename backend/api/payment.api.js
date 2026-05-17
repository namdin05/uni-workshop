import { pgPool, supabaseAdmin } from '../utils/supabase.js';
import { redis, workshopSeatKey } from '../utils/redis.js';
import axios from 'axios';
import CircuitBreaker from 'opossum';
import { enqueueTicketEmail } from '../utils/queueHelper.js';
import {
  completeGatewayAttemptFailure,
  completeGatewayAttemptSuccess,
  getGatewayStatus,
  reserveGatewayAttempt,
  setGatewayMode,
} from '../utils/paymentGateway.js';

// Memory config for payment timeout (default 10 minutes = 600 seconds)
let paymentTimeoutSeconds = 60;

async function loadAuthenticatedUserId(authId) {
  const { rows } = await pgPool.query('SELECT id FROM users WHERE auth_id = $1 LIMIT 1', [authId]);

  if (!rows.length) {
    throw new Error('User not found');
  }

  return Number(rows[0].id);
}

export const getGatewayState = async (req, res) => {
  return res.status(200).json({ gateway: getGatewayStatus() });
};

export const updateGatewayState = async (req, res) => {
  try {
    const { state } = req.body;
    const gateway = setGatewayMode(state);
    return res.status(200).json({ message: 'Gateway state updated', gateway });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

export const confirmDemoPayment = async (req, res) => {
  const registrationId = Number(req.body.registrationId);
  const idempotencyKey = String(req.body.idempotencyKey || `DEMO-PAY-${registrationId || 'unknown'}`);
  let gatewayReserved = false;
  let client;

  if (!Number.isFinite(registrationId)) {
    return res.status(400).json({ message: 'Missing registrationId' });
  }

  try {
    client = await pgPool.connect();
    const userId = await loadAuthenticatedUserId(req.user.id);

    await client.query('BEGIN');

    const { rows: registrationRows } = await client.query(
      `
        SELECT
          r.id,
          r.user_id,
          r.status,
          r.qr_code,
          r.workshop_id,
          w.title,
          w.price,
          w.is_free
        FROM registrations r
        INNER JOIN workshops w ON w.id = r.workshop_id
        WHERE r.id = $1
        FOR UPDATE OF r
      `,
      [registrationId],
    );

    const registration = registrationRows[0] || null;

    if (!registration) {
      throw new Error('Registration not found');
    }

    if (registration.user_id !== userId) {
      await client.query('ROLLBACK');
      return res.status(403).json({ message: 'Bạn không có quyền thanh toán cho đăng ký này' });
    }

    if (registration.status === 'confirmed' || registration.status === 'checked_in') {
      await client.query('ROLLBACK');
      return res.status(200).json({
        message: 'Registration already confirmed',
        registrationId: registration.id,
        status: registration.status,
        gateway: getGatewayStatus(),
      });
    }

    reserveGatewayAttempt();
    gatewayReserved = true;

    const amount = Number(registration.price ?? 0);
    const { rows: paymentRows } = await client.query(
      `
        SELECT id, registration_id, amount, status, idempotency_key, created_at
        FROM payments
        WHERE registration_id = $1
        ORDER BY created_at DESC, id DESC
        LIMIT 1
      `,
      [registrationId],
    );

    const paymentRecord = paymentRows[0] || null;

    if (!paymentRecord) {
      const { rows: insertedRows } = await client.query(
        `
          INSERT INTO payments (registration_id, amount, status, idempotency_key)
          VALUES ($1, $2, 'success', $3)
          RETURNING id, registration_id, amount, status, idempotency_key, created_at
        `,
        [registrationId, amount, idempotencyKey],
      );

      const insertedPayment = insertedRows[0];

      await client.query('UPDATE registrations SET status = \'confirmed\' WHERE id = $1', [registrationId]);
      await client.query('COMMIT');

      completeGatewayAttemptSuccess();

      try {
        const { data: userRecord } = await supabaseAdmin
            .from('users')
            .select('email, full_name')
            .eq('id', userId)
            .single();

        if (userRecord) {
            await enqueueTicketEmail(
                userRecord.email,
                userRecord.full_name,
                registration.workshops?.title,
                registration.workshops?.start_time,
                registration.workshops?.rooms?.name,
                registration.qr_code
            );
        }
      } catch (queueError) {
        console.error('❌ Lỗi khi đưa job vào Queue:', queueError.message);
      }

      return res.status(200).json({
        message: 'Payment completed in demo mode',
        registrationId,
        payment: insertedPayment,
        gateway: getGatewayStatus(),
      });
    }

    await client.query('UPDATE registrations SET status = \'confirmed\' WHERE id = $1', [registrationId]);
    await client.query('COMMIT');

    completeGatewayAttemptSuccess();

    try {
        const { data: userRecord } = await supabaseAdmin
            .from('users')
            .select('email, full_name')
            .eq('id', userId)
            .single();

        if (userRecord) {
            await enqueueTicketEmail(
                userRecord.email,
                userRecord.full_name,
                registration.workshops?.title,
                registration.workshops?.start_time,
                registration.workshops?.rooms?.name,
                registration.qr_code
            );
        }
    } catch (queueError) {
        console.error('❌ Lỗi khi đưa job vào Queue:', queueError.message);
    }

    return res.status(200).json({
      message: 'Payment already existed, returned existing record',
      registrationId,
      payment: paymentRecord,
      gateway: getGatewayStatus(),
    });
  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch {
        // ignore rollback failures so the original error can be returned
      }
    }

    if (gatewayReserved) {
      completeGatewayAttemptFailure();
    }
    return res.status(503).json({ message: error.message, gateway: getGatewayStatus() });
  } finally {
    if (client) {
      client.release();
    }
  }
};

// Circuit breaker setup for calling the internal mock gateway
const gatewayCall = async ({ registrationId, amount, idempotencyKey }) => {
  const port = process.env.PORT || 3000;
  const url = `http://localhost:${port}/api/payments/mock-gateway/pay`;
  const response = await axios.post(url, { registrationId, amount, idempotencyKey }, { timeout: 5000 });
  return response.data;
};

const breakerOptions = {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 10000,
};

const paymentBreaker = new CircuitBreaker(gatewayCall, breakerOptions);
paymentBreaker.fallback(() => ({ status: 'error', message: 'Cổng thanh toán đang bảo trì. Vui lòng thử lại sau.' }));

export const createPaymentOrder = async (req, res) => {
  const registrationId = Number(req.body.registrationId);
  const idempotencyKey = String(req.body.idempotencyKey || `PAY-${registrationId || 'unknown'}`);
  let gatewayReserved = false;

  if (!Number.isFinite(registrationId)) {
    return res.status(400).json({ message: 'Missing registrationId' });
  }

  try {
    const userId = await loadAuthenticatedUserId(req.user.id);

    const { data: registration, error: registrationError } = await supabaseAdmin
      .from('registrations')
      .select(`
        id,
        user_id,
        status,
        qr_code,
        workshop_id,
        workshops(id, title, price, is_free, start_time, rooms(name))
      `)
      .eq('id', registrationId)
      .single();

    if (registrationError || !registration) {
      throw new Error('Registration not found');
    }

    if (registration.user_id !== userId) {
      return res.status(403).json({ message: 'Bạn không có quyền thanh toán cho đăng ký này' });
    }

    if (registration.status === 'confirmed' || registration.status === 'checked_in') {
      return res.status(200).json({
        message: 'Registration already confirmed',
        registrationId: registration.id,
        status: registration.status,
        gateway: getGatewayStatus(),
      });
    }

    // insert pending payment record for idempotency
    const amount = Number(registration.workshops?.price ?? 0);

    const { data: insertedPayment, error: insertError } = await supabaseAdmin
      .from('payments')
      .insert([
        {
          registration_id: registrationId,
          amount,
          status: 'pending',
          idempotency_key: idempotencyKey,
        },
      ])
      .select('id, registration_id, amount, status, idempotency_key, created_at')
      .single();

    if (insertError) {
      throw insertError;
    }

    reserveGatewayAttempt();
    gatewayReserved = true;

    // Fire the circuit breaker which calls the mock gateway
    const result = await paymentBreaker.fire({ registrationId, amount, idempotencyKey });

    if (result?.status === 'error') {
      // update payment to failed
      await supabaseAdmin.from('payments').update({ status: 'failed' }).eq('id', insertedPayment.id);
      completeGatewayAttemptFailure();
      return res.status(503).json({ success: false, message: result.message || 'Payment failed', gateway: getGatewayStatus() });
    }

    // Success path
    await supabaseAdmin.from('payments').update({ status: 'success' }).eq('id', insertedPayment.id);
    const { error: registrationUpdateError } = await supabaseAdmin
      .from('registrations')
      .update({ status: 'confirmed' })
      .eq('id', registrationId);

    if (registrationUpdateError) {
      throw registrationUpdateError;
    }

    completeGatewayAttemptSuccess();

    try {
        const { data: userRecord } = await supabaseAdmin
            .from('users')
            .select('email, full_name')
            .eq('id', userId)
            .single();

        if (userRecord) {
            await enqueueTicketEmail(
                userRecord.email,
                userRecord.full_name,
                registration.workshops?.title,
                registration.workshops?.start_time,
                registration.workshops?.rooms?.name,
                registration.qr_code
            );
        }
    } catch (queueError) {
        console.error('❌ Lỗi khi đưa job vào Queue:', queueError.message);
    }

    return res.status(200).json({ success: true, message: 'Thanh toán thành công', registrationId, transaction: result, gateway: getGatewayStatus() });
  } catch (error) {
    if (gatewayReserved) {
      completeGatewayAttemptFailure();
    }
    return res.status(503).json({ message: error.message, gateway: getGatewayStatus() });
  }
};

// Get payment timeout configuration
export const getPaymentTimeout = async (req, res) => {
  return res.status(200).json({ timeoutSeconds: paymentTimeoutSeconds });
};

// Set payment timeout configuration (admin only)
export const setPaymentTimeout = async (req, res) => {
  try {
    const { timeoutSeconds } = req.body;

    if (!Number.isFinite(timeoutSeconds) || timeoutSeconds < 60) {
      return res.status(400).json({ message: 'Timeout must be at least 60 seconds' });
    }

    paymentTimeoutSeconds = timeoutSeconds;
    return res.status(200).json({ message: 'Payment timeout updated', timeoutSeconds: paymentTimeoutSeconds });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
};

// Cancel a pending payment registration (rollback slot)
export const cancelRegistration = async (req, res) => {
  const { registrationId, workshopId } = req.body;

  if (!Number.isFinite(registrationId) || !Number.isFinite(workshopId)) {
    return res.status(400).json({ message: 'Missing registrationId or workshopId' });
  }

  try {
    const userId = await loadAuthenticatedUserId(req.user.id);

    // 1. Fetch and validate registration
    const { data: registration, error: regError } = await supabaseAdmin
      .from('registrations')
      .select('id, user_id, workshop_id, status')
      .eq('id', registrationId)
      .single();

    if (regError || !registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    // Verify ownership and status
    if (registration.user_id !== userId) {
      return res.status(403).json({ message: 'Unauthorized to cancel this registration' });
    }

    if (registration.status !== 'pending_payment') {
      return res.status(400).json({ message: 'Only pending_payment registrations can be cancelled' });
    }

    // 2. Fetch workshop to update available_seats
    const { data: workshop, error: workshopError } = await supabaseAdmin
      .from('workshops')
      .select('id, available_seats, total_seats')
      .eq('id', workshopId)
      .single();

    if (workshopError || !workshop) {
      return res.status(404).json({ message: 'Workshop not found' });
    }

    // 3. Increment available_seats in database
    const newSeats = Math.min(workshop.available_seats + 1, workshop.total_seats);
    await supabaseAdmin
      .from('workshops')
      .update({ available_seats: newSeats })
      .eq('id', workshopId);

    // 4. Update Redis cache
    await redis.set(workshopSeatKey(workshopId), String(newSeats));

    // 5. Cancel registration
    await supabaseAdmin
      .from('registrations')
      .update({ status: 'cancelled' })
      .eq('id', registrationId);

    // 6. Cancel associated payment if exists
    await supabaseAdmin
      .from('payments')
      .update({ status: 'cancelled' })
      .eq('registration_id', registrationId)
      .eq('status', 'pending');

    return res.status(200).json({ 
      message: 'Registration cancelled and seat released',
      registrationId,
      workshopId,
      availableSeats: newSeats 
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
