const prisma = require('../../config/database');

async function findByNews(newsId, skip, take) {
  const [data, total] = await prisma.$transaction([
    prisma.comment.findMany({
      where: { newsId, isDeleted: false },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      select: { id: true, content: true, username: true, createdAt: true, userId: true },
    }),
    prisma.comment.count({ where: { newsId, isDeleted: false } }),
  ]);
  return { data, total };
}

async function findById(id) {
  return prisma.comment.findUnique({ where: { id } });
}

async function create(data) {
  return prisma.comment.create({
    data,
    select: { id: true, content: true, username: true, createdAt: true, newsId: true },
  });
}

async function softDelete(id) {
  return prisma.comment.update({ where: { id }, data: { isDeleted: true } });
}

async function findAll(skip, take, orderBy) {
  const [data, total] = await prisma.$transaction([
    prisma.comment.findMany({
      where: { isDeleted: false },
      orderBy,
      skip,
      take,
      select: {
        id: true,
        content: true,
        username: true,
        createdAt: true,
        userId: true,
        newsId: true,
      },
    }),
    prisma.comment.count({ where: { isDeleted: false } }),
  ]);
  return { data, total };
}

module.exports = { findAll, findByNews, findById, create, softDelete };
