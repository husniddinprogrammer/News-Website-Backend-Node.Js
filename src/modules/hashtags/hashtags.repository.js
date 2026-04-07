const { eq, ilike, count } = require('drizzle-orm');
const { db } = require('../../db');
const { hashtags } = require('../../db/schema');

async function findAll({ skip, take, search }) {
  const where = search ? ilike(hashtags.name, `%${search}%`) : undefined;

  const [data, [{ total }]] = await Promise.all([
    db.select().from(hashtags)
      .where(where)
      .orderBy(hashtags.name)
      .limit(take)
      .offset(skip),
    db.select({ total: count() }).from(hashtags).where(where),
  ]);

  return { data, total: Number(total) };
}

async function findById(id) {
  const [row] = await db.select().from(hashtags).where(eq(hashtags.id, id)).limit(1);
  return row || null;
}

async function findBySlug(slug) {
  const [row] = await db.select().from(hashtags).where(eq(hashtags.slug, slug)).limit(1);
  return row || null;
}

async function create(data) {
  const [row] = await db.insert(hashtags).values(data).returning();
  return row;
}

async function remove(id) {
  return db.delete(hashtags).where(eq(hashtags.id, id));
}

module.exports = { findAll, findById, findBySlug, create, remove };
