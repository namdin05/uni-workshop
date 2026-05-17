import express from 'express';
import { confirmDemoPayment, getGatewayState, updateGatewayState, createPaymentOrder, getPaymentTimeout, setPaymentTimeout, cancelRegistration } from '../api/payment.api.js';
import { processMockPayment, toggleGatewayStatus } from '../api/mockGateway.api.js';
import { verifyToken, authorizeRole } from '../middlewares/auth.middlewares.js';

const router = express.Router();

router.get('/gateway/status', getGatewayState);
router.post('/gateway/state', updateGatewayState);
router.post('/demo/confirm', verifyToken, confirmDemoPayment);
// Internal mock gateway endpoint
router.post('/mock-gateway/pay', processMockPayment);

// Public endpoint for students to create payment (requires auth)
router.post('/create', verifyToken, createPaymentOrder);

// Payment timeout configuration
router.get('/timeout', getPaymentTimeout);
router.post('/timeout', verifyToken, authorizeRole(['organizer']), setPaymentTimeout);

// Cancel pending payment registration (rollback slot)
router.post('/cancel', verifyToken, cancelRegistration);

// Admin toggle for gateway (protected)
router.post('/admin/payment-gateway/toggle', verifyToken, authorizeRole(['organizer']), toggleGatewayStatus);

export default router;
