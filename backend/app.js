import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import workshopRoutes from './routes/workshopRoutes.js';
import registrationRoutes from './routes/registrationRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api', apiRateLimiter, workshopRoutes);
app.use('/api', apiRateLimiter, registrationRoutes);

// Mock payment success page (for testing)
app.get('/mock-payment', (req, res) => {
  const { orderId, amount } = req.query;
  res.json({
    success: true,
    message: 'Payment gateway mock',
    orderId,
    amount,
    paymentUrl: `http://localhost:${process.env.PORT || 5000}/mock-payment-callback?orderId=${orderId}`,
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', function() {
    console.log(`Server is running at ${process.env.BASE_URL || 'http://localhost:' + PORT}`);
});