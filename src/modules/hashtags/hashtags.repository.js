const prisma = require('../../config/database');

async function findAll({ skip, take, search }) {
  const where = search ? { name: { contains: search, mode: 'insensitive' } } : {};
  const [data, total] = await prisma.$transaction([
    prisma.hashtag.findMany({ where, skip, take, orderBy: { name: 'asc' } }),
    prisma.hashtag.count({ where }),
  ]);
  return { data, total };
}

async function findById(id) {
  return prisma.hashtag.findUnique({ where: { id } });
}

async function findBySlug(slug) {
  return prisma.hashtag.findUnique({ where: { slug } });
}

async function create(data) {
  return prisma.hashtag.create({ data });
}

async function remove(id) {
  return prisma.hashtag.delete({ where: { id } });
}

module.exports = { findAll, findById, findBySlug, create, remove };
