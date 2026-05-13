import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.route.js';
import userRoutes from './routes/user.route.js';
import workshopRoutes from './routes/workshop.route.js';
import publicWorkshopRoutes from './routes/public.workshop.route.js';
import paymentRoutes from './routes/payment.route.js';
import checkinRoutes from './routes/checkin.route.js';

import { verifyToken, authorizeRole } from './middlewares/auth.middlewares.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '60mb' }));

const PORT = process.env.PORT || 3000;

// Public Routes
app.use('/api/auth', authRoutes);

app.use('/api/user', userRoutes);

// Public workshop endpoints (catalog, details, public registration)
app.use('/api/workshops', publicWorkshopRoutes);

// Demo payment gateway endpoints
app.use('/api/payments', paymentRoutes);

// No notification routes (email sending handled inline on registration)

// Check-in endpoints for staff mobile app
app.use('/api/checkin', verifyToken, authorizeRole(['staff']), checkinRoutes);

// Protected Routes - Ví dụ trang Admin chỉ dành cho Ban tổ chức
app.use('/api/admin/workshops', 
    verifyToken, 
    authorizeRole(['organizer']), 
    workshopRoutes
);

app.listen(PORT, () => {
    console.log(`🚀 UniHub Backend đang chạy tại http://localhost:${PORT}`);
});