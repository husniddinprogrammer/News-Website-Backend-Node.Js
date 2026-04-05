const { AppError } = require('../../middleware/error.middleware');
const { parsePagination } = require('../../utils/pagination.util');
const repo = require('./users.repository');

async function getAll(query) {
  const { page, limit, skip } = parsePagination(query);
  const result = await repo.findAll({ skip, take: limit, search: query.search });
  return { ...result, page, limit };
}

async function updateRole(id, role, currentUser) {
  if (id === currentUser.id) throw new AppError('You cannot change your own role', 400);

  const user = await repo.findById(id);
  if (!user) throw new AppError('User not found', 404);

  return repo.updateRole(id, role);
}

async function updateBlocked(id, isBlocked, currentUser) {
  if (id === currentUser.id) throw new AppError('You cannot block yourself', 400);

  const user = await repo.findById(id);
  if (!user) throw new AppError('User not found', 404);
  if (user.role === 'BOSS') throw new AppError('Cannot block a BOSS user', 403);

  return repo.updateBlocked(id, isBlocked);
}

module.exports = { getAll, updateRole, updateBlocked };
