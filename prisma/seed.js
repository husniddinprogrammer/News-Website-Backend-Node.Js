const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create BOSS user
  const hashedPassword = await bcrypt.hash('Boss@123456', 12);
  const boss = await prisma.user.upsert({
    where: { email: 'boss@newsportal.com' },
    update: {},
    create: {
      username: 'boss',
      email: 'boss@newsportal.com',
      password: hashedPassword,
      role: 'BOSS',
      name: 'Super',
      surname: 'Boss',
    },
  });

  // Create ADMIN user
  const adminPassword = await bcrypt.hash('Admin@123456', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@newsportal.com' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@newsportal.com',
      password: adminPassword,
      role: 'ADMIN',
      name: 'Admin',
      surname: 'User',
    },
  });

  // Create sample user
  const husniddinPassword = await bcrypt.hash('husniddin2003', 12);
  await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: {},
    create: {
      username: 'husniddin',
      email: 'admin@gmail.com',
      password: husniddinPassword,
      role: 'ADMIN',
      name: 'Husniddin',
      surname: 'Programmer',
    },
  });

  // Create categories
  const tech = await prisma.category.upsert({
    where: { slug: 'technology' },
    update: {},
    create: { name: 'Technology', slug: 'technology' },
  });

  const sports = await prisma.category.upsert({
    where: { slug: 'sports' },
    update: {},
    create: { name: 'Sports', slug: 'sports' },
  });

  // Create hashtags
  const hashtag1 = await prisma.hashtag.upsert({
    where: { slug: 'breaking' },
    update: {},
    create: { name: 'Breaking', slug: 'breaking' },
  });

  // Create sample news
  await prisma.news.upsert({
    where: { slug: 'sample-tech-news' },
    update: {},
    create: {
      title: 'Sample Tech News',
      slug: 'sample-tech-news',
      content: 'This is full content of the sample tech news article.',
      shortDescription: 'A brief description of the tech news.',
      categoryId: tech.id,
      authorId: admin.id,
      status: 'PUBLISHED',
    },
  });

  console.log('Seed complete.');
  console.log('Boss credentials:     boss@newsportal.com / Boss@123456');
  console.log('Admin credentials:    admin@newsportal.com / Admin@123456');
  console.log('Sample credentials:   admin@gmail.com / husniddin2003');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
