const svc = require('./users.service');
const { success, paginated } = require('../../utils/response.util');

async function getAll(req, res, next) {
  try {
    const result = await svc.getAll(req.query);
    paginated(res, result);
  } catch (err) { next(err); }
}

async function updateRole(req, res, next) {
  try {
    const data = await svc.updateRole(req.params.id, req.body.role, req.user);
    success(res, data, 'Role updated');
  } catch (err) { next(err); }
}

async function updateBlocked(req, res, next) {
  try {
    const data = await svc.updateBlocked(req.params.id, req.body.isBlocked, req.user);
    success(res, data, req.body.isBlocked ? 'User blocked' : 'User unblocked');
  } catch (err) { next(err); }
}

module.exports = { getAll, updateRole, updateBlocked };
