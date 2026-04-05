const prisma = require('../../config/database');
const { AppError } = require('../../middleware/error.middleware');
const { generateUniqueSlug, generateSlug } = require('../../utils/slug.util');
const { parsePagination } = require('../../utils/pagination.util');
const { buildNewsFilter } = require('../../utils/newsFilter.util');
const { indexNewsDocument, deleteNewsDocument, searchNews } = require('../../config/elasticsearch');
const config = require('../../config');
const repo = require('./news.repository');

async function getAll(query, user) {
  const { page, limit, skip } = parsePagination(query);

  // Full-text search via Elasticsearch
  if (query.search) {
    return _searchViaEs(query.search, page, limit, skip);
  }

  const { where, orderBy } = buildNewsFilter(query, user);

  const result = await repo.findMany({ where, orderBy, skip, take: limit });
  return { data: _formatMany(result.data), total: result.total, page, limit };
}

async function getBySlug(slug, ipAddress) {
  const news = await repo.findBySlug(slug);
  if (!news || news.status !== 'PUBLISHED') throw new AppError('News not found', 404);

  // Track view (dedup by IP within window)
  _trackView(news.id, ipAddress).catch(() => {});

  return _formatOne(news);
}

async function getByIdAdmin(id) {
  const news = await repo.findById(id);
  if (!news) throw new AppError('News not found', 404);
  return _formatOne(news);
}

async function create(dto, authorId) {
  const slug = await generateUniqueSlug(dto.title);

  const hashtags = dto.hashtags || [];

  const news = await prisma.$transaction(async (tx) => {
    const created = await tx.news.create({
      data: {
        title: dto.title,
        slug,
        content: dto.content,
        shortDescription: dto.shortDescription,
        categoryId: dto.categoryId,
        authorId,
        status: dto.status || 'DRAFT',
        rank: dto.rank ?? 0,
      },
    });

    // Attach hashtags
    if (hashtags.length > 0) {
      await _upsertHashtags(tx, created.id, hashtags);
    }

    return created;
  });

  // Index in Elasticsearch (non-blocking)
  const full = await repo.findById(news.id);
  indexNewsDocument(full).catch(() => {});

  return _formatOne(full);
}

async function update(id, dto, user) {
  const news = await repo.findById(id);
  if (!news) throw new AppError('News not found', 404);

  // Only BOSS can edit others' articles; ADMIN can only edit own
  if (user.role === 'ADMIN' && news.author.id !== user.id) {
    throw new AppError('You can only edit your own news', 403);
  }

  const updateData = {};
  if (dto.title !== undefined) {
    updateData.title = dto.title;
    updateData.slug = await generateUniqueSlug(dto.title, id);
  }
  if (dto.content !== undefined) updateData.content = dto.content;
  if (dto.shortDescription !== undefined) updateData.shortDescription = dto.shortDescription;
  if (dto.categoryId !== undefined) updateData.categoryId = dto.categoryId;
  if (dto.status !== undefined) updateData.status = dto.status;
  if (dto.rank !== undefined) updateData.rank = dto.rank;

  const updated = await prisma.$transaction(async (tx) => {
    const u = await tx.news.update({ where: { id }, data: updateData });

    if (dto.hashtags !== undefined) {
      // Soft-delete existing
      await tx.hashtagNews.updateMany({ where: { newsId: id }, data: { isDeleted: true } });
      if (dto.hashtags.length > 0) {
        await _upsertHashtags(tx, id, dto.hashtags);
      }
    }

    return u;
  });

  const full = await repo.findById(updated.id);
  indexNewsDocument(full).catch(() => {});

  return _formatOne(full);
}

async function remove(id, user) {
  const news = await repo.findById(id);
  if (!news) throw new AppError('News not found', 404);

  if (user.role === 'ADMIN' && news.author.id !== user.id) {
    throw new AppError('You can only delete your own news', 403);
  }

  await repo.update(id, { status: 'DELETED' });
  deleteNewsDocument(id).catch(() => {});
}

// ── Private helpers ───────────────────────────────────────────────────────────


async function _searchViaEs(query, page, limit, skip) {
  const esResult = await searchNews(query, skip, limit);

  if (esResult) {
    const news = await repo.findManyByIds(esResult.ids);
    // Preserve ES relevance order
    const ordered = esResult.ids.map((id) => news.find((n) => n.id === id)).filter(Boolean);
    return { data: _formatMany(ordered), total: esResult.total, page, limit };
  }

  // ES unavailable — fallback to DB full-text search
  const where = {
    status: 'PUBLISHED',
    OR: [
      { title: { contains: query, mode: 'insensitive' } },
      { content: { contains: query, mode: 'insensitive' } },
    ],
  };
  const result = await repo.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit });
  return { data: _formatMany(result.data), total: result.total, page, limit };
}

async function _trackView(newsId, ipAddress) {
  const windowStart = new Date(Date.now() - config.viewDedupMinutes * 60 * 1000);

  const alreadyViewed = await prisma.view.findFirst({
    where: { newsId, ipAddress, createdAt: { gte: windowStart } },
    select: { id: true },
  });

  if (!alreadyViewed) {
    await prisma.$transaction([
      prisma.view.create({ data: { newsId, ipAddress } }),
      prisma.news.update({ where: { id: newsId }, data: { viewCount: { increment: 1 } } }),
    ]);
  }
}

async function _upsertHashtags(tx, newsId, hashtags) {
  for (const name of hashtags) {
    const slug = generateSlug(name);
    const hashtag = await tx.hashtag.upsert({
      where: { slug },
      update: {},
      create: { name, slug },
    });

    await tx.hashtagNews.upsert({
      where: { hashtagId_newsId: { hashtagId: hashtag.id, newsId } },
      update: { isDeleted: false },
      create: { hashtagId: hashtag.id, newsId },
    });
  }
}

function _formatMany(items) {
  return items.map((n) => ({
    ...n,
    hashtags: n.hashtags?.map((h) => h.hashtag),
    likeCount: n._count?.likes ?? 0,
    commentCount: n._count?.comments ?? 0,
    _count: undefined,
  }));
}

function _formatOne(n) {
  if (!n) return null;
  return {
    ...n,
    hashtags: n.hashtags?.map((h) => h.hashtag),
    likeCount: n._count?.likes ?? 0,
    commentCount: n._count?.comments ?? 0,
    _count: undefined,
  };
}

module.exports = { getAll, getBySlug, getByIdAdmin, create, update, remove };
