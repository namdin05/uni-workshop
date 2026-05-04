import db from '../config/database.js';
import redis from '../config/redis.js';
import { releaseSeat, removeSeatLock } from '../services/seatService.js';
import { generateQRCode } from '../services/qrCodeService.js';
import { initiatePayment, handlePaymentWebhook } from '../services/paymentService.js';
import { AppError } from '../middleware/errorHandler.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Get registration details
 */
export async function getRegistration(req, res, next) {
  try {
    const { registrationId } = req.params;

    const registration = await db('registrations')
      .join('workshops', 'registrations.workshop_id', 'workshops.id')
      .join('users', 'registrations.user_id', 'users.id')
      .where('registrations.id', registrationId)
      .select(
        'registrations.id',
        'registrations.user_id',
        'registrations.workshop_id',
        'registrations.status',
        'registrations.qr_code',
        'registrations.checked_in_at',
        'registrations.created_at',
        'workshops.title as workshopTitle',
        'workshops.start_time',
        'workshops.end_time',
        'workshops.price',
        'users.full_name',
        'users.email',
        'users.student_id'
      )
      .first();

    if (!registration) {
      throw new AppError('Registration not found', 404);
    }

    res.json({
      success: true,
      data: registration,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Initiate payment for a registration
 */
export async function initiateRegistrationPayment(req, res, next) {
  try {
    const { registrationId } = req.params;
    const { redirectUrl } = req.body;
    const idempotencyKey = req.idempotencyKey;

    const registration = await db('registrations')
      .where('id', registrationId)
      .first();

    if (!registration) {
      throw new AppError('Registration not found', 404);
    }

    if (registration.status === 'confirmed') {
      throw new AppError('This registration has already been paid', 409);
    }

    if (registration.status === 'cancelled') {
      throw new AppError('This registration has been cancelled', 409);
    }

    const workshop = await db('workshops')
      .where('id', registration.workshop_id)
      .first();

    // Get user info for payment
    const user = await db('users')
      .where('id', registration.user_id)
      .first();

    const orderId = `ORD_${registrationId}_${Date.now()}`;

    // Initiate payment with payment gateway
    const paymentResponse = await initiatePayment({
      orderId,
      amount: workshop.price,
      description: `Workshop: ${workshop.title}`,
      customerEmail: user.email,
      customerPhone: user.student_id, // Using student_id as phone alternative
      redirectUrl,
    });

    // Store payment intent in database
    await db('payments')
      .insert({
        registration_id: registrationId,
        amount: workshop.price,
        status: 'pending',
        idempotency_key: idempotencyKey,
        gateway_transaction_id: paymentResponse.transactionId,
        created_at: new Date(),
        updated_at: new Date(),
      });
    
    // ==========================================
    // BYPASS TEST UI: Tự động đánh dấu đã thanh toán
    await db('registrations')
      .where('id', registrationId)
      .update({ status: 'confirmed' });
    // ==========================================

    console.log('[PAYMENT] Initiated payment:', {
      registrationId,
      orderId,
      amount: workshop.price,
    });

    const responseData = {
      success: true,
      paymentUrl: paymentResponse.paymentUrl,
      orderId,
      transactionId: paymentResponse.transactionId,
    };

    if (req.cacheResult) {
      await req.cacheResult(200, responseData);
    }

    res.json(responseData);
  } catch (error) {
    next(error);
  }
}

/**
 * Handle payment webhook from payment gateway
 * Updates registration status to confirmed upon successful payment
 */
export async function handlePaymentCallback(req, res, next) {
  try {
    const { transactionId, status } = req.body;

    // Find payment record by transaction ID
    const payment = await db('payments')
      .where('gateway_transaction_id', transactionId)
      .first();

    if (!payment) {
      console.warn('[PAYMENT] Payment record not found:', transactionId);
      return res.status(404).json({
        success: false,
        message: 'Payment record not found',
      });
    }

    // Update payment status
    await db('payments')
      .where('id', payment.id)
      .update({
        status,
        updated_at: new Date(),
      });

    if (status === 'completed') {
      // Update registration status
      const registration = await db('registrations')
        .where('id', payment.registration_id)
        .first();

      if (registration) {
        await db('registrations')
          .where('id', payment.registration_id)
          .update({
            status: 'confirmed',
          });

        // Remove seat lock (seat is now permanently taken)
        await removeSeatLock(registration.workshop_id, payment.registration_id);

        console.log('[PAYMENT] Completed payment:', {
          registrationId: payment.registration_id,
          transactionId,
          status: 'confirmed',
        });
      }
    } else if (status === 'failed' || status === 'cancelled') {
      // Release seat if payment failed
      const registration = await db('registrations')
        .where('id', payment.registration_id)
        .first();

      if (registration && registration.status !== 'confirmed') {
        await db('registrations')
          .where('id', payment.registration_id)
          .update({ status: 'cancelled' });

        await releaseSeat(registration.workshop_id);
        await removeSeatLock(registration.workshop_id, payment.registration_id);

        console.log('[PAYMENT] Released seat after payment failure:', {
          registrationId: payment.registration_id,
          status,
        });
      }
    }

    // Handle webhook
    const webhookResult = await handlePaymentWebhook(req.body);

    res.json({
      success: true,
      message: 'Payment notification received',
      data: webhookResult,
    });
  } catch (error) {
    console.error('Payment callback error:', error);
    next(error);
  }
}

/**
 * Get QR code for registration
 */
export async function getRegistrationQRCode(req, res, next) {
  try {
    const { registrationId } = req.params;

    const registration = await db('registrations')
      .where('id', registrationId)
      .first();

    if (!registration) {
      throw new AppError('Registration not found', 404);
    }

    if (registration.status !== 'confirmed') {
      throw new AppError('QR code is only available for confirmed registrations', 409);
    }

    // Check if QR code already exists in cache
    const cacheKey = `qr:${registrationId}`;
    const cachedQR = await redis.get(cacheKey);
    if (cachedQR) {
      return res.json({
        success: true,
        data: JSON.parse(cachedQR),
      });
    }

    // Generate QR code
    const qrCode = await generateQRCode(registrationId, registration.workshop_id);

    // Cache QR code for 24 hours
    await redis.setEx(cacheKey, 86400, JSON.stringify(qrCode));

    res.json({
      success: true,
      data: qrCode,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Cancel registration and release seat
 */
export async function cancelRegistration(req, res, next) {
  try {
    const { registrationId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError('User authentication required', 401);
    }

    const registration = await db('registrations')
      .where('id', registrationId)
      .first();

    if (!registration) {
      throw new AppError('Registration not found', 404);
    }

    // Check ownership
    if (registration.user_id !== userId) {
      throw new AppError('You do not have permission to cancel this registration', 403);
    }

    if (registration.status === 'cancelled') {
      throw new AppError('This registration is already cancelled', 409);
    }

    // Cancel registration
    await db('registrations')
      .where('id', registrationId)
      .update({
        status: 'cancelled',
      });

    // Release seat if not already paid
    if (registration.status !== 'confirmed') {
      await releaseSeat(registration.workshop_id);
      await removeSeatLock(registration.workshop_id, registrationId);
    }

    console.log('[REGISTRATION] Cancelled registration:', registrationId);

    res.json({
      success: true,
      message: 'Registration cancelled successfully',
    });
  } catch (error) {
    next(error);
  }
}
