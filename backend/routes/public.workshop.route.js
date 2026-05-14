import express from 'express';
import * as workshopApi from '../api/workshop.api.js';
import { verifyToken } from '../middlewares/auth.middlewares.js';
import { registrationLimiter } from '../middlewares/rateLimit.js';

const router = express.Router();

// Public: list published workshops only
router.get('/', workshopApi.listPublishedWorkshops);

// Public: get workshop detail
router.get('/:id', workshopApi.getWorkshopById);

// Public: register for workshop (calls RPC)
router.post('/register', verifyToken, registrationLimiter, workshopApi.registerWorkshop);

// Public: upload CSV for data sync
router.post('/sync/csv', workshopApi.uploadCsv);

export default router;
