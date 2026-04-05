const prisma = require('../../config/database');

async function findLike(newsId, userId, ipAddress) {
  // Authenticated user: match by userId only (one like per user per news)
  // Anonymous user: match by ipAddress only (one like per IP per news)
  const where = userId
    ? { newsId, userId }
    : { newsId, userId: null, ipAddress };

  return prisma.like.findFirst({ where });
}

async function create(data) {
  return prisma.like.create({ data });
}

async function remove(id) {
  return prisma.like.delete({ where: { id } });
}

async function countByNews(newsId) {
  return prisma.like.count({ where: { newsId } });
}

module.exports = { findLike, create, remove, countByNews };
