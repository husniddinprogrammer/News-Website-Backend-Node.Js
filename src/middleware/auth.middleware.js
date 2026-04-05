const { verifyAccessToken } = require('../utils/jwt.util');
const prisma = require('../config/database');
const { error } = require('../utils/response.util');

/**
 * Verify JWT access token and attach user to req.user.
 */
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'Authentication required', 401);
  }

  const token = authHeader.slice(7);
  try {
    const decoded = verifyAccessToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { id: true, username: true, email: true, role: true, isBlocked: true },
    });

    if (!user) return error(res, 'User not found', 401);
    if (user.isBlocked) return error(res, 'Account is blocked', 403);

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return error(res, 'Access token expired', 401);
    }
    return error(res, 'Invalid access token', 401);
  }
}

/**
 * Authorize by one or more roles.
 * Usage: authorize('BOSS') or authorize('BOSS', 'ADMIN')
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return error(res, 'Authentication required', 401);
    if (!roles.includes(req.user.role)) {
      return error(res, 'Insufficient permissions', 403);
    }
    next();
  };
}

/**
 * Optional auth — sets req.user if valid token present, does not reject.
 */
async function optionalAuth(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return next();

  try {
    const token = authHeader.slice(7);
    const decoded = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { id: true, username: true, email: true, role: true, isBlocked: true },
    });
    if (user && !user.isBlocked) req.user = user;
  } catch {
    // intentionally ignored
  }
  next();
}

/**
 * Block VIEWER role from non-GET requests.
 * Apply globally after authenticate.
 */
function viewerReadOnly(req, res, next) {
  if (req.user?.role === 'VIEWER' && req.method !== 'GET') {
    return error(res, 'VIEWER role is read-only. Only GET requests are allowed.', 403);
  }
  next();
}

module.exports = { authenticate, authorize, optionalAuth, viewerReadOnly };
