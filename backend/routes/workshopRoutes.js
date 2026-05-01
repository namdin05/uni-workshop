import express from 'express';
import {
  getWorkshops,
  getWorkshopById,
  getWorkshopSeats,
  registerWorkshop,
} from '../controllers/workshopController.js';
import { registrationRateLimiter } from '../middleware/rateLimiter.js';
import { idempotencyMiddleware } from '../middleware/idempotency.js';

const router = express.Router();

/**
 * Workshop Routes
 */

// GET /api/workshops - List all workshops
router.get('/workshops', getWorkshops);

// GET /api/workshops/:workshopId - Get workshop details
router.get('/workshops/:workshopId', getWorkshopById);

// GET /api/workshops/:workshopId/seats - Get seat availability
router.get('/workshops/:workshopId/seats', getWorkshopSeats);

// POST /api/workshops/:workshopId/register - Register for workshop
// Rate limited and requires idempotency key
router.post(
  '/workshops/:workshopId/register',
  registrationRateLimiter,
  idempotencyMiddleware,
  registerWorkshop
);

export default router;
