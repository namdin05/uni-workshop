import express from 'express';
import { prewarmWorkshopCache, registerWorkshop, listWorkshops, getWorkshopById, createWorkshop, uploadCsv, updateWorkshop, updateWorkshopStatus } from '../api/workshop.api.js';
import { verifyToken, authorizeRole } from '../middlewares/auth.middlewares.js';
import { registrationLimiter } from '../middlewares/rateLimit.js';

const router = express.Router();

// Protected Routes - Authenticated Users
router.post('/register', verifyToken, registrationLimiter, registerWorkshop);
router.get('/', listWorkshops);
router.get('/:id', getWorkshopById);

router.post('/cache/prewarm', verifyToken, authorizeRole(['organizer', 'admin']), prewarmWorkshopCache);

// Admin/Organizer Routes
router.post('/', verifyToken, authorizeRole(['organizer', 'admin']), createWorkshop);
router.post('/sync/csv', verifyToken, authorizeRole(['staff', 'admin']), uploadCsv);
router.patch('/:id', verifyToken, authorizeRole(['organizer', 'admin']), updateWorkshop);

// admin: update status (published / cancelled)
router.patch('/:id/status', verifyToken, authorizeRole(['organizer', 'admin']), updateWorkshopStatus);

export default router;