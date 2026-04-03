const { AppError } = require('../../middleware/error.middleware');
const prisma = require('../../config/database');
const { parsePagination } = require('../../utils/pagination.util');
const repo = require('./comments.repository');

async function getByNews(newsId, query) {
  const news = await prisma.news.findUnique({ where: { id: newsId }, select: { id: true, status: true } });
  if (!news || news.status === 'DELETED') throw new AppError('News not found', 404);

  const { page, limit, skip } = parsePagination(query);
  const result = await repo.findByNews(newsId, skip, limit);
  return { ...result, page, limit };
}

async function create(dto, user) {
  const news = await prisma.news.findUnique({
    where: { id: dto.newsId },
    select: { id: true, status: true },
  });
  if (!news || news.status !== 'PUBLISHED') throw new AppError('News not found', 404);

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

module.exports = { getByNews, create, remove };
