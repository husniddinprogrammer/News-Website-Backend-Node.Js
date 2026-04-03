const svc = require('./likes.service');
const { success } = require('../../utils/response.util');

function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.socket.remoteAddress ||
    '0.0.0.0'
  );
}

async function toggle(req, res, next) {
  try {
    const result = await svc.toggle(req.body.newsId, req.user, getClientIp(req));
    success(res, result, result.liked ? 'Liked' : 'Like removed');
  } catch (err) { next(err); }
}

module.exports = { toggle };
