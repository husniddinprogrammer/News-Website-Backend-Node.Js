const prisma = require('../../config/database');

async function findAll() {
  return prisma.category.findMany({
    where: { isDeleted: false },
    orderBy: { name: 'asc' },
  });
}

async function findById(id) {
  return prisma.category.findFirst({ where: { id, isDeleted: false } });
}

async function findBySlug(slug) {
  return prisma.category.findFirst({ where: { slug, isDeleted: false } });
}

async function create(data) {
  return prisma.category.create({ data });
}

async function update(id, data) {
  return prisma.category.update({ where: { id }, data });
}

async function softDelete(id) {
  return prisma.category.update({ where: { id }, data: { isDeleted: true } });
}

module.exports = { findAll, findById, findBySlug, create, update, softDelete };
