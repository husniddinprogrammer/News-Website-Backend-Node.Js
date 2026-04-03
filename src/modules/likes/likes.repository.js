const prisma = require('../../config/database');

async function findLike(newsId, userId, ipAddress) {
  return prisma.like.findFirst({
    where: {
      newsId,
      OR: [
        ...(userId ? [{ userId }] : []),
        { ipAddress },
      ],
    },
  });
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
