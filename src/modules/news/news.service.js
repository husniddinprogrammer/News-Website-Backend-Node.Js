const { eq, and, gte, ilike, sql } = require('drizzle-orm');
const { db } = require('../../db');
const { news, views, hashtags, hashtagNews } = require('../../db/schema');
const { AppError } = require('../../middleware/error.middleware');
const { generateUniqueSlug, generateSlug } = require('../../utils/slug.util');
const { parsePagination } = require('../../utils/pagination.util');
const { buildNewsFilter } = require('../../utils/newsFilter.util');
const { indexNewsDocument, deleteNewsDocument, searchNews } = require('../../config/elasticsearch');
const config = require('../../config');
const repo = require('./news.repository');

async function getAll(query, user) {
  const { page, limit, skip } = parsePagination(query);

  if (query.search) {
    return _searchViaEs(query.search, page, limit, skip);
  }

  const { where, orderBy } = buildNewsFilter(query, user);
  const result = await repo.findMany({ where, orderBy, skip, take: limit });
  return { data: result.data, total: result.total, page, limit };
}

async function getBySlug(slug, ipAddress) {
  const item = await repo.findBySlug(slug);
  if (!item || item.status !== 'PUBLISHED') throw new AppError('News not found', 404);
  _trackView(item.id, ipAddress).catch(() => {});
  return item;
}

async function getByIdAdmin(id) {
  const item = await repo.findById(id);
  if (!item) throw new AppError('News not found', 404);
  return item;
}

async function create(dto, authorId) {
  const slug = await generateUniqueSlug(dto.title);
  const tagNames = dto.hashtags || [];

  const created = await db.transaction(async (tx) => {
    const [row] = await tx.insert(news).values({
      title: dto.title, slug, content: dto.content,
      shortDescription: dto.shortDescription, categoryId: dto.categoryId,
      authorId, status: dto.status || 'DRAFT', rank: dto.rank ?? 0,
    }).returning();

    if (tagNames.length > 0) {
      await _upsertHashtags(tx, row.id, tagNames);
    }
    return row;
  });

  const full = await repo.findById(created.id);
  indexNewsDocument(full).catch(() => {});
  return full;
}

async function update(id, dto, user) {
  const item = await repo.findById(id);
  if (!item) throw new AppError('News not found', 404);

  if (user.role === 'ADMIN' && item.author.id !== user.id) {
    throw new AppError('You can only edit your own news', 403);
  }

  const updateData = {};
  if (dto.title !== undefined) {
    updateData.title = dto.title;
    updateData.slug  = await generateUniqueSlug(dto.title, id);
  }
  if (dto.content          !== undefined) updateData.content          = dto.content;
  if (dto.shortDescription !== undefined) updateData.shortDescription = dto.shortDescription;
  if (dto.categoryId       !== undefined) updateData.categoryId       = dto.categoryId;
  if (dto.status           !== undefined) updateData.status           = dto.status;
  if (dto.rank             !== undefined) updateData.rank             = dto.rank;

  await db.transaction(async (tx) => {
    await tx.update(news).set({ ...updateData, updatedAt: new Date() }).where(eq(news.id, id));

    if (dto.hashtags !== undefined) {
      await tx.update(hashtagNews).set({ isDeleted: true }).where(eq(hashtagNews.newsId, id));
      if (dto.hashtags.length > 0) await _upsertHashtags(tx, id, dto.hashtags);
    }
  });

  const full = await repo.findById(id);
  indexNewsDocument(full).catch(() => {});
  return full;
}

async function remove(id, user) {
  const item = await repo.findById(id);
  if (!item) throw new AppError('News not found', 404);

  if (user.role === 'ADMIN' && item.author.id !== user.id) {
    throw new AppError('You can only delete your own news', 403);
  }

  await db.update(news).set({ status: 'DELETED', updatedAt: new Date() }).where(eq(news.id, id));
  deleteNewsDocument(id).catch(() => {});
}

// ── Private helpers ───────────────────────────────────────────────────────────

async function _searchViaEs(query, page, limit, skip) {
  const esResult = await searchNews(query, skip, limit);

  if (esResult) {
    const items = await repo.findManyByIds(esResult.ids);
    const ordered = esResult.ids.map((id) => items.find((n) => n.id === id)).filter(Boolean);
    return { data: ordered, total: esResult.total, page, limit };
  }

  // Fallback to DB search
  const where = and(
    eq(news.status, 'PUBLISHED'),
    ilike(news.title, `%${query}%`)
  );
  const result = await repo.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit });
  return { data: result.data, total: result.total, page, limit };
}

async function _trackView(newsId, ipAddress) {
  const windowStart = new Date(Date.now() - config.viewDedupMinutes * 60 * 1000);

  await db.transaction(async (tx) => {
    const [existing] = await tx.select({ id: views.id }).from(views)
      .where(and(
        eq(views.newsId, newsId),
        eq(views.ipAddress, ipAddress),
        gte(views.createdAt, windowStart),
      )).limit(1);

    if (!existing) {
      await tx.insert(views).values({ newsId, ipAddress });
      await tx.update(news)
        .set({ viewCount: sql`${news.viewCount} + 1` })
        .where(eq(news.id, newsId));
    }
  });
}

async function _upsertHashtags(tx, newsId, tagNames) {
  for (const name of tagNames) {
    const slug = generateSlug(name);

    const [existing] = await tx.select().from(hashtags).where(eq(hashtags.slug, slug)).limit(1);
    let hashtag = existing;
    if (!hashtag) {
      [hashtag] = await tx.insert(hashtags).values({ name, slug }).returning();
    }

    await tx.insert(hashtagNews)
      .values({ hashtagId: hashtag.id, newsId, isDeleted: false })
      .onConflictDoUpdate({
        target: [hashtagNews.hashtagId, hashtagNews.newsId],
        set: { isDeleted: false },
      });
  }
}

module.exports = { getAll, getBySlug, getByIdAdmin, create, update, remove };
