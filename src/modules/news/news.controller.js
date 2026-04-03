const svc = require('./news.service');
const { success, created, noContent, paginated } = require('../../utils/response.util');

function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.socket.remoteAddress ||
    '0.0.0.0'
  );
}

async function getAll(req, res, next) {
  try {
    const result = await svc.getAll(req.query, req.user);
    paginated(res, result);
  } catch (err) { next(err); }
}

async function getBySlug(req, res, next) {
  try {
    const data = await svc.getBySlug(req.params.slug, getClientIp(req));
    success(res, data);
  } catch (err) { next(err); }
}

async function getById(req, res, next) {
  try {
    const data = await svc.getByIdAdmin(req.params.id);
    success(res, data);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const data = await svc.create(req.body, req.user.id);
    created(res, data, 'News created');
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const data = await svc.update(req.params.id, req.body, req.user);
    success(res, data, 'News updated');
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    await svc.remove(req.params.id, req.user);
    noContent(res);
  } catch (err) { next(err); }
}

module.exports = { getAll, getBySlug, getById, create, update, remove };
