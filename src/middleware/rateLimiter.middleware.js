const rateLimit = require('express-rate-limit');

/**
 * General API rate limiter.
 */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many requests, please try again later.',
  },
  keyGenerator: (req) => req.ip,
});

/**
 * Strict limiter for auth endpoints.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many authentication attempts. Please wait 15 minutes.',
  },
  keyGenerator: (req) => req.ip,
  skipSuccessfulRequests: true,
});

/**
 * Limiter for public content endpoints (news list, search).
 */
const publicLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: 'Rate limit exceeded. Please slow down.',
  },
  keyGenerator: (req) => req.ip,
});

module.exports = { apiLimiter, authLimiter, publicLimiter };
