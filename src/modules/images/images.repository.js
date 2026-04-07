const { eq } = require('drizzle-orm');
const { db } = require('../../db');
const { images } = require('../../db/schema');

async function createMany(records) {
  return db.insert(images).values(records);
}

async function findByNews(newsId) {
  return db.select().from(images)
    .where(eq(images.newsId, newsId) && eq(images.isDeleted, false))
    .orderBy(images.id);
}

async function findById(id) {
  const [row] = await db.select().from(images).where(eq(images.id, id)).limit(1);
  return row || null;
}

async function softDelete(id) {
  return db.update(images).set({ isDeleted: true }).where(eq(images.id, id));
}

module.exports = { createMany, findByNews, findById, softDelete };
