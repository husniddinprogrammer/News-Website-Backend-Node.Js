const { eq } = require('drizzle-orm');
const { db } = require('../../db');
const { news } = require('../../db/schema');
const { AppError } = require('../../middleware/error.middleware');
const { parsePagination } = require('../../utils/pagination.util');
const repo = require('./comments.repository');

async function getAll(query, user) {
  const { page, limit, skip } = parsePagination(query);
  const orderBy = query.sort === 'id_asc' ? { createdAt: 'asc' } : { createdAt: 'desc' };
  // BOSS/ADMIN see all comments; others only see comments on PUBLISHED news
  const onlyPublished = !user || (user.role !== 'BOSS' && user.role !== 'ADMIN');
  const result = await repo.findAll(skip, limit, orderBy, onlyPublished);
  return { ...result, page, limit };
}

async function getByNews(newsId, query) {
  const [item] = await db.select({ id: news.id, status: news.status }).from(news).where(eq(news.id, newsId)).limit(1);
  if (!item || item.status === 'DELETED') throw new AppError('News not found', 404);

  const { page, limit, skip } = parsePagination(query);
  const result = await repo.findByNews(newsId, skip, limit);
  return { ...result, page, limit };
}

async function create(dto, user) {
  const [item] = await db.select({ id: news.id, status: news.status }).from(news).where(eq(news.id, dto.newsId)).limit(1);
  if (!item || item.status !== 'PUBLISHED') throw new AppError('News not found', 404);

  return repo.create({
    newsId: dto.newsId,
    userId: user.id,
    content: dto.content,
    username: user.username,
  });
}

async function remove(id, user) {
  const comment = await repo.findById(id);
  if (!comment || comment.isDeleted) throw new AppError('Comment not found', 404);

  // BOSS can delete any; ADMIN only own
  if (user.role === 'ADMIN' && comment.userId !== user.id) {
    throw new AppError('You can only delete your own comments', 403);
  }

  await repo.softDelete(id);
}

module.exports = { getAll, getByNews, create, remove };
