import redis from '../config/redis.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Middleware for handling idempotency keys
 * Prevents duplicate requests from being processed multiple times
 * Especially important for payment operations
 */
export const idempotencyMiddleware = async (req, res, next) => {
  // Idempotency is only relevant for POST requests
  if (req.method !== 'POST') {
    return next();
  }

  const idempotencyKey = req.headers['idempotency-key'];

  if (!idempotencyKey) {
    return res.status(400).json({
      success: false,
      message: 'Idempotency-Key header is required for POST requests',
    });
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(idempotencyKey)) {
    return res.status(400).json({
      success: false,
      message: 'Idempotency-Key must be a valid UUID',
    });
  }

  try {
    const redisKey = `idempotency:${idempotencyKey}`;

    // Check if this request was already processed
    const cachedResult = await redis.get(redisKey);
    if (cachedResult) {
      const result = JSON.parse(cachedResult);
      console.log(`[IDEMPOTENCY] Found cached result for key ${idempotencyKey}`);
      return res.status(result.statusCode).json(result.response);
    }

    // Mark request as processing
    await redis.setEx(
      redisKey,
      3600, // 1 hour TTL
      JSON.stringify({
        status: 'processing',
        timestamp: new Date().toISOString(),
      })
    );

    // Store idempotency key in request for later use
    req.idempotencyKey = idempotencyKey;
    req.cacheResult = async (statusCode, response) => {
      // Cache the result for future requests with same idempotency key
      await redis.setEx(
        redisKey,
        3600,
        JSON.stringify({
          statusCode,
          response,
          timestamp: new Date().toISOString(),
        })
      );
    };

    next();
  } catch (error) {
    console.error('Idempotency middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Verify idempotency key format (for client-side validation hints)
 */
export function generateIdempotencyKey() {
  return uuidv4();
}
