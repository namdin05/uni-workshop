import { supabaseAdmin } from '../utils/supabase.js';
import {
  completeGatewayAttemptFailure,
  completeGatewayAttemptSuccess,
  getGatewayStatus,
  reserveGatewayAttempt,
  setGatewayMode,
} from '../utils/paymentGateway.js';

async function loadAuthenticatedUserId(authId) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('auth_id', authId)
    .single();

  if (error || !data) {
    throw new Error('User not found');
  }

  return data.id;
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
        workshops(id, title, price, is_free)
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

    reserveGatewayAttempt();
    gatewayReserved = true;

    const amount = Number(registration.workshops?.price ?? 0);

    const { data: existingPayment, error: paymentLookupError } = await supabaseAdmin
      .from('payments')
      .select('id, registration_id, amount, status, idempotency_key, created_at')
      .eq('registration_id', registrationId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (paymentLookupError) {
      throw paymentLookupError;
    }

    const paymentRecord = existingPayment?.[0] || null;

    if (!paymentRecord) {
      const { data: insertedPayment, error: insertError } = await supabaseAdmin
        .from('payments')
        .insert([
          {
            registration_id: registrationId,
            amount,
            status: 'success',
            idempotency_key: idempotencyKey,
          },
        ])
        .select('id, registration_id, amount, status, idempotency_key, created_at')
        .single();

      if (insertError) {
        throw insertError;
      }

      const { error: registrationUpdateError } = await supabaseAdmin
        .from('registrations')
        .update({ status: 'confirmed' })
        .eq('id', registrationId);

      if (registrationUpdateError) {
        throw registrationUpdateError;
      }

      completeGatewayAttemptSuccess();

      return res.status(200).json({
        message: 'Payment completed in demo mode',
        registrationId,
        payment: insertedPayment,
        gateway: getGatewayStatus(),
      });
    }

    const { error: registrationUpdateError } = await supabaseAdmin
      .from('registrations')
      .update({ status: 'confirmed' })
      .eq('id', registrationId);

    if (registrationUpdateError) {
      throw registrationUpdateError;
    }

    completeGatewayAttemptSuccess();

    return res.status(200).json({
      message: 'Payment already existed, returned existing record',
      registrationId,
      payment: paymentRecord,
      gateway: getGatewayStatus(),
    });
  } catch (error) {
    if (gatewayReserved) {
      completeGatewayAttemptFailure();
    }
    return res.status(503).json({ message: error.message, gateway: getGatewayStatus() });
  }
};
