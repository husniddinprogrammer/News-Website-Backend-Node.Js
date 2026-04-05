const svc = require('./comments.service');
const { success, created, noContent, paginated } = require('../../utils/response.util');

async function getAll(req, res, next) {
  try {
    const result = await svc.getAll(req.query);
    paginated(res, result);
  } catch (err) { next(err); }
}

async function getByNews(req, res, next) {
  try {
    const result = await svc.getByNews(req.params.newsId, req.query);
    paginated(res, result);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const data = await svc.create(req.body, req.user);
    created(res, data, 'Comment added');
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    await svc.remove(req.params.id, req.user);
    noContent(res);
  } catch (err) { next(err); }
}

module.exports = { getAll, getByNews, create, remove };
