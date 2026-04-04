const prisma = require('../../config/database');

const USER_SELECT = {
  id: true,
  username: true,
  email: true,
  role: true,
  name: true,
  surname: true,
  isBlocked: true,
  createdAt: true,
};

async function findAll({ skip, take, search }) {
  const where = search
    ? {
        OR: [
          { username: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};

  const [data, total] = await prisma.$transaction([
    prisma.user.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, select: USER_SELECT }),
    prisma.user.count({ where }),
  ]);
  return { data, total };
}

async function findById(id) {
  return prisma.user.findUnique({ where: { id }, select: USER_SELECT });
}

async function updateRole(id, role) {
  return prisma.user.update({ where: { id }, data: { role }, select: USER_SELECT });
}

async function updateBlocked(id, isBlocked) {
  return prisma.user.update({ where: { id }, data: { isBlocked }, select: USER_SELECT });
}

module.exports = { findAll, findById, updateRole, updateBlocked };
