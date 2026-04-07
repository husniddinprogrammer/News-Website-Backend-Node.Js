require('dotenv').config();
const bcrypt = require('bcryptjs');
const { eq } = require('drizzle-orm');
const { db, disconnectDb } = require('./index');
const { users, categories, hashtags, news } = require('./schema');

async function upsertUser(data) {
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, data.email)).limit(1);
  if (existing) return existing;
  const [row] = await db.insert(users).values(data).returning({ id: users.id });
  return row;
}

async function upsertCategory(data) {
  const [existing] = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, data.slug)).limit(1);
  if (existing) return existing;
  const [row] = await db.insert(categories).values(data).returning({ id: categories.id });
  return row;
}

async function upsertHashtag(data) {
  const [existing] = await db.select({ id: hashtags.id }).from(hashtags).where(eq(hashtags.slug, data.slug)).limit(1);
  if (existing) return existing;
  const [row] = await db.insert(hashtags).values(data).returning({ id: hashtags.id });
  return row;
}

async function upsertNews(data) {
  const [existing] = await db.select({ id: news.id }).from(news).where(eq(news.slug, data.slug)).limit(1);
  if (existing) return existing;
  const [row] = await db.insert(news).values(data).returning({ id: news.id });
  return row;
}

async function main() {
  console.log('Seeding database...');

  const boss = await upsertUser({
    username: 'boss',
    email: 'boss@newsportal.com',
    password: await bcrypt.hash('Boss@123456', 12),
    role: 'BOSS',
    name: 'Super',
    surname: 'Boss',
  });

  const admin = await upsertUser({
    username: 'admin',
    email: 'admin@newsportal.com',
    password: await bcrypt.hash('Admin@123456', 12),
    role: 'ADMIN',
    name: 'Admin',
    surname: 'User',
  });

  await upsertUser({
    username: 'husniddin',
    email: 'admin@gmail.com',
    password: await bcrypt.hash('husniddin2003', 12),
    role: 'ADMIN',
    name: 'Husniddin',
    surname: 'Programmer',
  });

  await upsertUser({
    username: 'viewer',
    email: 'viewer@newsportal.com',
    password: await bcrypt.hash('Viewer@123456', 12),
    role: 'VIEWER',
    name: 'Viewer',
    surname: 'User',
  });

  const tech = await upsertCategory({ name: 'Technology', slug: 'technology' });
  await upsertCategory({ name: 'Sports', slug: 'sports' });

  await upsertHashtag({ name: 'Breaking', slug: 'breaking' });

  await upsertNews({
    title: 'Sample Tech News',
    slug: 'sample-tech-news',
    content: 'This is full content of the sample tech news article.',
    shortDescription: 'A brief description of the tech news.',
    categoryId: tech.id,
    authorId: admin.id,
    status: 'PUBLISHED',
  });

  console.log('Seed complete.');
  console.log('Boss credentials:     boss@newsportal.com / Boss@123456');
  console.log('Admin credentials:    admin@newsportal.com / Admin@123456');
  console.log('Sample credentials:   admin@gmail.com / husniddin2003');
  console.log('Viewer credentials:   viewer@newsportal.com / Viewer@123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => disconnectDb());
