import express from 'express';
import { confirmDemoPayment, getGatewayState, updateGatewayState } from '../api/payment.api.js';
import { verifyToken } from '../middlewares/auth.middlewares.js';

const router = express.Router();

router.get('/gateway/status', getGatewayState);
router.post('/gateway/state', updateGatewayState);
router.post('/demo/confirm', verifyToken, confirmDemoPayment);

export default router;
