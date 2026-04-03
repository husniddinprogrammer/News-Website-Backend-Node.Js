const bcrypt = require('bcryptjs');
const { AppError } = require('../../middleware/error.middleware');
const { signAccessToken, signRefreshToken, verifyRefreshToken, expiryToDate } = require('../../utils/jwt.util');
const config = require('../../config');
const repo = require('./auth.repository');

const SALT_ROUNDS = 12;

async function register(dto) {
  const [emailExists, usernameExists] = await Promise.all([
    repo.findUserByEmail(dto.email),
    repo.findUserByUsername(dto.username),
  ]);

  if (emailExists) throw new AppError('Email already in use', 409);
  if (usernameExists) throw new AppError('Username already taken', 409);

  const hashed = await bcrypt.hash(dto.password, SALT_ROUNDS);

  const user = await repo.createUser({
    username: dto.username,
    email: dto.email,
    password: hashed,
    name: dto.name,
    surname: dto.surname,
    role: dto.role || 'ADMIN',
  });

  const tokens = await _issueTokens(user);
  return { user, ...tokens };
}

async function login(dto) {
  const user = await repo.findUserByEmail(dto.email);
  if (!user) throw new AppError('Invalid credentials', 401);
  if (user.isBlocked) throw new AppError('Account is blocked', 403);

  const valid = await bcrypt.compare(dto.password, user.password);
  if (!valid) throw new AppError('Invalid credentials', 401);

  const { password: _, ...safeUser } = user;
  const tokens = await _issueTokens(safeUser);
  return { user: safeUser, ...tokens };
}

async function refreshTokens(rawToken) {
  let payload;
  try {
    payload = verifyRefreshToken(rawToken);
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const stored = await repo.findRefreshToken(rawToken);
  if (!stored) throw new AppError('Refresh token not found or already used', 401);
  if (stored.expiresAt < new Date()) {
    await repo.deleteRefreshToken(rawToken);
    throw new AppError('Refresh token expired', 401);
  }
  if (stored.user.isBlocked) throw new AppError('Account is blocked', 403);

  // Rotate: delete old, issue new
  await repo.deleteRefreshToken(rawToken);
  const { password: _, ...safeUser } = stored.user;
  const tokens = await _issueTokens(safeUser);
  return { user: safeUser, ...tokens };
}

async function logout(rawToken) {
  try {
    await repo.deleteRefreshToken(rawToken);
  } catch {
    // token may already be deleted
  }
}

// ── Private ──────────────────────────────────────────────────────────────────

async function _issueTokens(user) {
  const jwtPayload = { sub: user.id, role: user.role };
  const accessToken = signAccessToken(jwtPayload);
  const refreshToken = signRefreshToken(jwtPayload);

  const expiresAt = expiryToDate(config.jwt.refreshExpiresIn);
  await repo.saveRefreshToken(user.id, refreshToken, expiresAt);

  return { accessToken, refreshToken };
}

module.exports = { register, login, refreshTokens, logout };
