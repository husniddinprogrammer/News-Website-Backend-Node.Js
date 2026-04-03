const svc = require('./hashtags.service');
const { success, created, noContent, paginated } = require('../../utils/response.util');

async function getAll(req, res, next) {
  try {
    const result = await svc.getAll(req.query);
    paginated(res, result);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const data = await svc.create(req.body);
    created(res, data, 'Hashtag created');
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    await svc.remove(req.params.id);
    noContent(res);
  } catch (err) { next(err); }
}

module.exports = { getAll, create, remove };
