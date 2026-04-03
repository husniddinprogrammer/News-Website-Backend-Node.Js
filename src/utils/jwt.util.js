const jwt = require('jsonwebtoken');
const config = require('../config');

function signAccessToken(payload) {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
    issuer: 'news-portal',
  });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
    issuer: 'news-portal',
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, config.jwt.accessSecret, { issuer: 'news-portal' });
}

function verifyRefreshToken(token) {
  return jwt.verify(token, config.jwt.refreshSecret, { issuer: 'news-portal' });
}

function decodeToken(token) {
  return jwt.decode(token);
}

/**
 * Parse JWT expiry string (e.g. "7d", "15m") to a future Date.
 */
function expiryToDate(expiresIn) {
  const units = { s: 1, m: 60, h: 3600, d: 86400 };
  const match = String(expiresIn).match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid expiresIn format: ${expiresIn}`);
  const seconds = parseInt(match[1], 10) * units[match[2]];
  return new Date(Date.now() + seconds * 1000);
}

module.exports = { signAccessToken, signRefreshToken, verifyAccessToken, verifyRefreshToken, decodeToken, expiryToDate };
