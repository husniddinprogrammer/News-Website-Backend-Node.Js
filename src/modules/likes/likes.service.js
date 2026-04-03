const prisma = require('../../config/database');
const { AppError } = require('../../middleware/error.middleware');
const repo = require('./likes.repository');

async function toggle(newsId, user, ipAddress) {
  const news = await prisma.news.findUnique({
    where: { id: newsId },
    select: { id: true, status: true },
  });
  if (!news || news.status !== 'PUBLISHED') throw new AppError('News not found', 404);

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
