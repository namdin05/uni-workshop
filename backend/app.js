import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.route.js';
import userRoutes from './routes/user.route.js';
import workshopRoutes from './routes/workshop.route.js';
import publicWorkshopRoutes from './routes/public.workshop.route.js';
import paymentRoutes from './routes/payment.route.js';
import checkinRoutes from './routes/checkin.route.js';
import aiRoutes from './routes/ai.route.js';
import roomRoutes from './routes/room.route.js';

import { verifyToken, authorizeRole } from './middlewares/auth.middlewares.js';
import { startNightlySync } from './utils/nightlySync.js';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Public Routes
app.use('/api/auth', authRoutes);

app.use('/api/user', userRoutes);

// Public workshop endpoints (catalog, details, public registration)
app.use('/api/workshops', publicWorkshopRoutes);

// Demo payment gateway endpoints
app.use('/api/payments', paymentRoutes);

// AI Summary endpoints
app.use('/api/ai', aiRoutes);

// Rooms endpoints
app.use('/api/rooms', roomRoutes);

// Check-in endpoints for organizer mobile app
app.use('/api/checkin', verifyToken, authorizeRole(['organizer']), checkinRoutes);

// Protected Routes - Ví dụ trang Admin chỉ dành cho Ban tổ chức
app.use('/api/admin/workshops', 
    verifyToken, 
    authorizeRole(['organizer']), 
    workshopRoutes
);

startNightlySync();

app.listen(PORT, () => {
    console.log(`🚀 UniHub Backend đang chạy tại http://127.0.0.1:${PORT}`);
});