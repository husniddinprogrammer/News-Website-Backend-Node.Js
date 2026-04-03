const logger = require('../utils/logger');

/**
 * 404 handler — must be registered after all routes.
 */
function notFound(req, res, _next) {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

/**
 * Global error handler — must be the last middleware (4 args).
 */
// eslint-disable-next-line no-unused-vars
function globalErrorHandler(err, req, res, _next) {
  // Prisma known errors
  if (err.code === 'P2002') {
    const field = err.meta?.target?.join(', ') || 'field';
    return res.status(409).json({
      success: false,
      statusCode: 409,
      message: `Duplicate value for unique ${field}`,
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      statusCode: 404,
      message: err.meta?.cause || 'Record not found',
    });
  }

  if (err.code === 'P2003') {
    return res.status(400).json({
      success: false,
      statusCode: 400,
      message: 'Related record not found (foreign key constraint)',
    });
  }

  // Validation errors (Joi)
  if (err.isJoi) {
    return res.status(422).json({
      success: false,
      statusCode: 422,
      message: 'Validation error',
      errors: err.details.map((d) => ({ field: d.path.join('.'), message: d.message })),
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, statusCode: 401, message: err.message });
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ success: false, statusCode: 413, message: 'File too large' });
  }

  // AppError (custom)
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      message: err.message,
    });
  }

  // Unknown errors — log and hide details in production
  logger.error({ err, url: req.originalUrl, method: req.method }, 'Unhandled error');

  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message || 'Internal server error';

  return res.status(statusCode).json({ success: false, statusCode, message });
}

/**
 * Operational (expected) error class.
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { notFound, globalErrorHandler, AppError };
