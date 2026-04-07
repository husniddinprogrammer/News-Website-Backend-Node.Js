const { eq, ilike, or, count } = require('drizzle-orm');
const { db } = require('../../db');
const { users } = require('../../db/schema');

const USER_SELECT = {
  id: users.id, username: users.username, email: users.email,
  role: users.role, name: users.name, surname: users.surname,
  isBlocked: users.isBlocked, createdAt: users.createdAt,
};

async function findAll({ skip, take, search }) {
  const where = search
    ? or(
        ilike(users.username, `%${search}%`),
        ilike(users.email,    `%${search}%`),
        ilike(users.name,     `%${search}%`),
      )
    : undefined;

  const [data, [{ total }]] = await Promise.all([
    db.select(USER_SELECT).from(users).where(where)
      .orderBy(users.createdAt).limit(take).offset(skip),
    db.select({ total: count() }).from(users).where(where),
  ]);

  return { data, total: Number(total) };
}

async function findById(id) {
  const [row] = await db.select(USER_SELECT).from(users).where(eq(users.id, id)).limit(1);
  return row || null;
}

async function updateRole(id, role) {
  const [row] = await db.update(users).set({ role }).where(eq(users.id, id)).returning(USER_SELECT);
  return row;
}

async function updateBlocked(id, isBlocked) {
  const [row] = await db.update(users).set({ isBlocked }).where(eq(users.id, id)).returning(USER_SELECT);
  return row;
}

module.exports = { findAll, findById, updateRole, updateBlocked };
