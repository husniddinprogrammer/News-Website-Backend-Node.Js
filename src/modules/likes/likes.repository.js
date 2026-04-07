const { eq, and, count, isNull } = require('drizzle-orm');
const { db } = require('../../db');
const { likes } = require('../../db/schema');

async function findLike(newsId, userId, ipAddress) {
  const where = userId
    ? and(eq(likes.newsId, newsId), eq(likes.userId, userId))
    : and(eq(likes.newsId, newsId), isNull(likes.userId), eq(likes.ipAddress, ipAddress));

  const [row] = await db.select().from(likes).where(where).limit(1);
  return row || null;
}

async function create(data) {
  const [row] = await db.insert(likes).values(data).returning();
  return row;
}

async function remove(id) {
  return db.delete(likes).where(eq(likes.id, id));
}

async function countByNews(newsId) {
  const [{ total }] = await db.select({ total: count() }).from(likes).where(eq(likes.newsId, newsId));
  return Number(total);
}

module.exports = { findLike, create, remove, countByNews };
