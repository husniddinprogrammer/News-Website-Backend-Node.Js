const { eq, lt } = require('drizzle-orm');
const { db } = require('../../db');
const { users, refreshTokens } = require('../../db/schema');

const USER_SAFE = {
  id: users.id, username: users.username, email: users.email,
  role: users.role, name: users.name, surname: users.surname,
  isBlocked: users.isBlocked, createdAt: users.createdAt,
};

async function findUserByEmail(email) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return user || null;
}

async function findUserByUsername(username) {
  const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return user || null;
}

async function findUserById(id) {
  const [user] = await db.select(USER_SAFE).from(users).where(eq(users.id, id)).limit(1);
  return user || null;
}

async function createUser(data) {
  const [user] = await db.insert(users).values(data).returning({
    id: users.id, username: users.username, email: users.email,
    role: users.role, name: users.name, surname: users.surname, createdAt: users.createdAt,
  });
  return user;
}

async function saveRefreshToken(userId, token, expiresAt) {
  const [row] = await db
    .insert(refreshTokens)
    .values({ userId, token, expiresAt })
    .onConflictDoUpdate({ target: refreshTokens.token, set: { userId, expiresAt } })
    .returning();
  return row;
}

async function findRefreshToken(token) {
  const [row] = await db
    .select({
      id: refreshTokens.id, token: refreshTokens.token,
      userId: refreshTokens.userId, expiresAt: refreshTokens.expiresAt,
      user: {
        id: users.id, username: users.username, email: users.email,
        role: users.role, name: users.name, surname: users.surname,
        isBlocked: users.isBlocked, createdAt: users.createdAt,
      },
    })
    .from(refreshTokens)
    .innerJoin(users, eq(refreshTokens.userId, users.id))
    .where(eq(refreshTokens.token, token))
    .limit(1);
  return row || null;
}

async function deleteRefreshToken(token) {
  return db.delete(refreshTokens).where(eq(refreshTokens.token, token));
}

async function deleteAllUserRefreshTokens(userId) {
  return db.delete(refreshTokens).where(eq(refreshTokens.userId, userId));
}

async function deleteExpiredTokens() {
  return db.delete(refreshTokens).where(lt(refreshTokens.expiresAt, new Date()));
}

module.exports = {
  findUserByEmail, findUserByUsername, findUserById, createUser,
  saveRefreshToken, findRefreshToken, deleteRefreshToken,
  deleteAllUserRefreshTokens, deleteExpiredTokens,
};
