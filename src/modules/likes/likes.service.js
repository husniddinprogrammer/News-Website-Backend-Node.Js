const { eq } = require('drizzle-orm');
const { db } = require('../../db');
const { news } = require('../../db/schema');
const { AppError } = require('../../middleware/error.middleware');
const repo = require('./likes.repository');

async function toggle(newsId, user, ipAddress) {
  const [item] = await db.select({ id: news.id, status: news.status }).from(news).where(eq(news.id, newsId)).limit(1);
  if (!item || item.status !== 'PUBLISHED') throw new AppError('News not found', 404);

  const userId = user?.id || null;
  const existing = await repo.findLike(newsId, userId, ipAddress);

  if (existing) {
    await repo.remove(existing.id);
    const likeCount = await repo.countByNews(newsId);
    return { liked: false, likeCount };
  }

  await repo.create({ newsId, userId, ipAddress });
  const likeCount = await repo.countByNews(newsId);
  return { liked: true, likeCount };
}

async function getLikeCount(newsId) {
  return repo.countByNews(newsId);
}

module.exports = { toggle, getLikeCount };
