import express from 'express';
import {
  getRegistration,
  initiateRegistrationPayment,
  handlePaymentCallback,
  getRegistrationQRCode,
  cancelRegistration,
} from '../controllers/registrationController.js';
import { paymentRateLimiter } from '../middleware/rateLimiter.js';
import { idempotencyMiddleware } from '../middleware/idempotency.js';

const router = express.Router();

/**
 * Registration Routes
 */

// GET /api/registrations/:registrationId - Get registration details
router.get('/registrations/:registrationId', getRegistration);

// POST /api/registrations/:registrationId/payment - Initiate payment
// Rate limited and requires idempotency key
router.post(
  '/registrations/:registrationId/payment',
  paymentRateLimiter,
  idempotencyMiddleware,
  initiateRegistrationPayment
);

// POST /api/registrations/payment/webhook - Payment gateway webhook
router.post('/registrations/payment/webhook', handlePaymentCallback);

// GET /api/registrations/:registrationId/qr - Get QR code
router.get('/registrations/:registrationId/qr', getRegistrationQRCode);

// DELETE /api/registrations/:registrationId - Cancel registration
router.delete('/registrations/:registrationId', cancelRegistration);

export default router;
