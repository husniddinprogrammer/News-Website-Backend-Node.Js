const svc = require('./categories.service');
const { success, created, noContent } = require('../../utils/response.util');

async function getAll(req, res, next) {
  try {
    const data = await svc.getAll();
    success(res, data);
  } catch (err) { next(err); }
}

async function getById(req, res, next) {
  try {
    const data = await svc.getById(req.params.id);
    success(res, data);
  } catch (err) { next(err); }
}

async function create(req, res, next) {
  try {
    const data = await svc.create(req.body);
    created(res, data, 'Category created');
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const data = await svc.update(req.params.id, req.body);
    success(res, data, 'Category updated');
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    await svc.remove(req.params.id);
    noContent(res);
  } catch (err) { next(err); }
}

module.exports = { getAll, getById, create, update, remove };
