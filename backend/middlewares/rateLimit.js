import rateLimit from 'express-rate-limit';

export const registrationLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Bạn đã gửi quá nhiều yêu cầu đăng ký. Vui lòng thử lại sau 1 phút.',
  },
  handler: (req, res, next, options) => {
    return res.status(options.statusCode).json(options.message);
  },

  skip: (req) => {
    const bypassSecret = process.env.LOAD_TEST_BYPASS_KEY || 'unihub-super-secret-bypass';
    return req.headers['x-load-test-bypass'] === bypassSecret;
  }
});