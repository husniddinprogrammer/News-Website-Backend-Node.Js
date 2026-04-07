const { eq } = require('drizzle-orm');
const { db } = require('../../db');
const { categories } = require('../../db/schema');

async function findAll() {
  return db.select().from(categories)
    .where(eq(categories.isDeleted, false))
    .orderBy(categories.name);
}

async function findById(id) {
  const [row] = await db.select().from(categories)
    .where(eq(categories.id, id))
    .limit(1);
  return row?.isDeleted ? null : (row || null);
}

async function findBySlug(slug) {
  const [row] = await db.select().from(categories)
    .where(eq(categories.slug, slug))
    .limit(1);
  return row?.isDeleted ? null : (row || null);
}

async function create(data) {
  const [row] = await db.insert(categories).values(data).returning();
  return row;
}

async function update(id, data) {
  const [row] = await db.update(categories).set(data).where(eq(categories.id, id)).returning();
  return row;
}

async function softDelete(id) {
  return db.update(categories).set({ isDeleted: true }).where(eq(categories.id, id));
}

module.exports = { findAll, findById, findBySlug, create, update, softDelete };
