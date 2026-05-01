import rateLimit from 'express-rate-limit';

// Rate limiter for workshop registration (strict limits)
export const registrationRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Quá nhiều yêu cầu từ địa chỉ IP này, vui lòng thử lại sau 1 phút.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    // Use user ID if available, otherwise use IP
    return req.user?.id || req.ip;
  },
});

// General API rate limiter
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict limiter for payment endpoints
export const paymentRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 3, // Only 3 payment attempts per minute
  message: 'Quá nhiều yêu cầu thanh toán, vui lòng thử lại sau 1 phút.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    return req.user?.id || req.ip;
  },
});
