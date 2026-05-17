import express from 'express';
import { prewarmWorkshopCache, registerWorkshop, listWorkshops, getWorkshopById, createWorkshop, uploadCsv, updateWorkshop, updateWorkshopStatus, getWorkshopRegistrations } from '../api/workshop.api.js';
import { verifyToken, authorizeRole } from '../middlewares/auth.middlewares.js';
import { registrationLimiter } from '../middlewares/rateLimit.js';

const router = express.Router();

// Protected Routes - Authenticated Users
router.post('/register', verifyToken, registrationLimiter, registerWorkshop);
router.get('/', listWorkshops);
router.get('/:id', getWorkshopById);

router.post('/cache/prewarm', verifyToken, authorizeRole(['organizer']), prewarmWorkshopCache);

// Admin: fetch registrations for a workshop
router.get('/:id/registrations', verifyToken, authorizeRole(['organizer']), getWorkshopRegistrations);

// Admin/Organizer Routes
router.post('/', verifyToken, authorizeRole(['organizer']), createWorkshop);
router.post('/sync/csv', verifyToken, authorizeRole(['staff']), uploadCsv);
router.patch('/:id', verifyToken, authorizeRole(['organizer']), updateWorkshop);

// admin: update status (published / cancelled)
router.patch('/:id/status', verifyToken, authorizeRole(['organizer']), updateWorkshopStatus);

export default router;