const prisma = require('../../config/database');

async function findUserByEmail(email) {
  return prisma.user.findUnique({ where: { email } });
}

async function findUserByUsername(username) {
  return prisma.user.findUnique({ where: { username } });
}

async function findUserById(id) {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, username: true, email: true, role: true, name: true, surname: true, isBlocked: true, createdAt: true },
  });
}

async function createUser(data) {
  return prisma.user.create({
    data,
    select: { id: true, username: true, email: true, role: true, name: true, surname: true, createdAt: true },
  });
}

async function saveRefreshToken(userId, token, expiresAt) {
  return prisma.refreshToken.upsert({
    where: { token },
    update: { userId, expiresAt },
    create: { userId, token, expiresAt },
  });
}

async function findRefreshToken(token) {
  return prisma.refreshToken.findUnique({ where: { token }, include: { user: true } });
}

async function deleteRefreshToken(token) {
  return prisma.refreshToken.deleteMany({ where: { token } });
}

async function deleteAllUserRefreshTokens(userId) {
  return prisma.refreshToken.deleteMany({ where: { userId } });
}

async function deleteExpiredTokens() {
  return prisma.refreshToken.deleteMany({ where: { expiresAt: { lt: new Date() } } });
}

module.exports = {
  findUserByEmail,
  findUserByUsername,
  findUserById,
  createUser,
  saveRefreshToken,
  findRefreshToken,
  deleteRefreshToken,
  deleteAllUserRefreshTokens,
  deleteExpiredTokens,
};
