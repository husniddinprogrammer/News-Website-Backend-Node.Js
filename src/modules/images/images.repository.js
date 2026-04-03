const prisma = require('../../config/database');

async function createMany(records) {
  return prisma.image.createMany({ data: records });
}

async function findByNews(newsId) {
  return prisma.image.findMany({
    where: { newsId, isDeleted: false },
    orderBy: { id: 'asc' },
  });
}

async function findById(id) {
  return prisma.image.findUnique({ where: { id } });
}

async function softDelete(id) {
  return prisma.image.update({ where: { id }, data: { isDeleted: true } });
}

module.exports = { createMany, findByNews, findById, softDelete };
