const prisma = require('../../config/database');

const NEWS_SELECT = {
  id: true,
  title: true,
  slug: true,
  shortDescription: true,
  status: true,
  viewCount: true,
  rank: true,
  createdAt: true,
  updatedAt: true,
  category: { select: { id: true, name: true, slug: true } },
  author: { select: { id: true, username: true, name: true, surname: true } },
  images: { where: { isDeleted: false }, select: { id: true, url: true } },
  hashtags: {
    where: { isDeleted: false },
    select: { hashtag: { select: { id: true, name: true, slug: true } } },
  },
  _count: { select: { likes: true, comments: { where: { isDeleted: false } } } },
};

const NEWS_DETAIL_SELECT = {
  ...NEWS_SELECT,
  content: true,
};

async function findMany({ where, orderBy, skip, take }) {
  const [data, total] = await prisma.$transaction([
    prisma.news.findMany({ where, orderBy, skip, take, select: NEWS_SELECT }),
    prisma.news.count({ where }),
  ]);
  return { data, total };
}

async function findBySlug(slug) {
  return prisma.news.findUnique({ where: { slug }, select: NEWS_DETAIL_SELECT });
}

async function findById(id) {
  return prisma.news.findUnique({ where: { id }, select: NEWS_DETAIL_SELECT });
}

async function create(data) {
  return prisma.news.create({ data, select: NEWS_DETAIL_SELECT });
}

async function update(id, data) {
  return prisma.news.update({ where: { id }, data, select: NEWS_DETAIL_SELECT });
}

async function incrementViewCount(id) {
  return prisma.news.update({ where: { id }, data: { viewCount: { increment: 1 } } });
}

async function findManyByIds(ids) {
  return prisma.news.findMany({
    where: { id: { in: ids }, status: 'PUBLISHED' },
    select: NEWS_SELECT,
  });
}

module.exports = { findMany, findBySlug, findById, create, update, incrementViewCount, findManyByIds };
