import express from 'express';
import { registerWorkshop, listWorkshops, getWorkshopById, createWorkshop, uploadCsv } from '../api/workshop.api.js';
import { verifyToken, authorizeRole } from '../middlewares/auth.middlewares.js';

const router = express.Router();

// Protected Routes - Authenticated Users
router.post('/register', verifyToken, registerWorkshop);
router.get('/', listWorkshops);
router.get('/:id', getWorkshopById);

// Admin/Organizer Routes
router.post('/', verifyToken, authorizeRole(['organizer', 'admin']), createWorkshop);
router.post('/sync/csv', verifyToken, authorizeRole(['staff', 'admin']), uploadCsv);

export default router;