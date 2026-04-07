const { eq, and, count, desc, asc } = require('drizzle-orm');
const { db } = require('../../db');
const { comments, news } = require('../../db/schema');

const COMMENT_COLS = {
  id: comments.id, content: comments.content, username: comments.username,
  createdAt: comments.createdAt, userId: comments.userId, newsId: comments.newsId,
};

async function findByNews(newsId, skip, take) {
  const where = and(eq(comments.newsId, newsId), eq(comments.isDeleted, false));

  const [data, [{ total }]] = await Promise.all([
    db.select(COMMENT_COLS).from(comments).where(where)
      .orderBy(desc(comments.createdAt)).limit(take).offset(skip),
    db.select({ total: count() }).from(comments).where(where),
  ]);

  return { data, total: Number(total) };
}

async function findById(id) {
  const [row] = await db.select().from(comments).where(eq(comments.id, id)).limit(1);
  return row || null;
}

async function create(data) {
  const [row] = await db.insert(comments).values(data).returning({
    id: comments.id, content: comments.content, username: comments.username,
    createdAt: comments.createdAt, newsId: comments.newsId,
  });
  return row;
}

async function softDelete(id) {
  return db.update(comments).set({ isDeleted: true }).where(eq(comments.id, id));
}

async function findAll(skip, take, orderBy, onlyPublished = true) {
  const baseWhere = eq(comments.isDeleted, false);

  // For count and data we need to optionally join news
  if (onlyPublished) {
    const where = and(baseWhere, eq(news.status, 'PUBLISHED'));
    const [data, [{ total }]] = await Promise.all([
      db.select(COMMENT_COLS).from(comments)
        .innerJoin(news, eq(comments.newsId, news.id))
        .where(where)
        .orderBy(orderBy === 'asc' ? asc(comments.createdAt) : desc(comments.createdAt))
        .limit(take).offset(skip),
      db.select({ total: count() }).from(comments)
        .innerJoin(news, eq(comments.newsId, news.id))
        .where(where),
    ]);
    return { data, total: Number(total) };
  }

  const [data, [{ total }]] = await Promise.all([
    db.select(COMMENT_COLS).from(comments).where(baseWhere)
      .orderBy(orderBy === 'asc' ? asc(comments.createdAt) : desc(comments.createdAt))
      .limit(take).offset(skip),
    db.select({ total: count() }).from(comments).where(baseWhere),
  ]);
  return { data, total: Number(total) };
}

module.exports = { findByNews, findById, create, softDelete, findAll };
