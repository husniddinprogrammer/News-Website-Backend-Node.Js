const svc = require('./images.service');
const { success, created, noContent } = require('../../utils/response.util');

async function upload(req, res, next) {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, statusCode: 400, message: 'No files uploaded' });
    }
    const data = await svc.upload(req.params.newsId, req.files, req.user);
    created(res, data, 'Images uploaded');
  } catch (err) { next(err); }
}

async function getByNews(req, res, next) {
  try {
    const data = await svc.getByNews(req.params.newsId);
    success(res, data);
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    await svc.remove(req.params.id, req.user);
    noContent(res);
  } catch (err) { next(err); }
}

module.exports = { upload, getByNews, remove };
