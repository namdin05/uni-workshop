/**
 * Error handler middleware
 * Standardizes error responses across the API
 */
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Validation errors
  if (err.statusCode === 400) {
    return res.status(400).json({
      success: false,
      message: err.message,
      errors: err.errors || [],
    });
  }

  // Authentication errors
  if (err.statusCode === 401) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
    });
  }

  // Not found errors
  if (err.statusCode === 404) {
    return res.status(404).json({
      success: false,
      message: 'Not found',
    });
  }

  // Conflict errors (e.g., already registered)
  if (err.statusCode === 409) {
    return res.status(409).json({
      success: false,
      message: err.message,
    });
  }

  // Business logic errors
  if (err.statusCode >= 400 && err.statusCode < 500) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Default server error
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
};

/**
 * Custom error class for business logic errors
 */
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}
