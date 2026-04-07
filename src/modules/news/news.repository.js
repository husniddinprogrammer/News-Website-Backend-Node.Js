const { eq, and, inArray, count, sql, desc, asc } = require('drizzle-orm');
const { db } = require('../../db');
const { news, users, categories, images, hashtagNews, hashtags, likes, comments } = require('../../db/schema');

// ─── Shared select columns ────────────────────────────────────────────────────

const NEWS_SELECT = {
  id: news.id, title: news.title, slug: news.slug,
  content: news.content, shortDescription: news.shortDescription,
  status: news.status, viewCount: news.viewCount, rank: news.rank,
  createdAt: news.createdAt, updatedAt: news.updatedAt,
  categoryId:   news.categoryId,   authorId:      news.authorId,
  categoryName: categories.name,   categorySlug:  categories.slug,
  authorUsername: users.username,  authorName:    users.name,
  authorSurname:  users.surname,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function _buildOrderBy(orderBy) {
  if (!orderBy) return [desc(news.createdAt)];
  const key = Object.keys(orderBy)[0];
  const dir = orderBy[key];

  if (key === 'viewCount') return dir === 'desc' ? [desc(news.viewCount)] : [asc(news.viewCount)];
  if (key === 'rank')      return dir === 'desc' ? [desc(news.rank)]      : [asc(news.rank)];
  if (key === 'createdAt') return dir === 'desc' ? [desc(news.createdAt)] : [asc(news.createdAt)];
  if (key === 'likes')    return [sql`(SELECT COUNT(*) FROM likes WHERE likes."newsId" = news.id) DESC`];
  if (key === 'comments') return [sql`(SELECT COUNT(*) FROM comments WHERE comments."newsId" = news.id AND comments."isDeleted" = false) DESC`];

  return [desc(news.createdAt)];
}

async function _enrich(baseRows) {
  if (!baseRows.length) return [];

  const ids = baseRows.map((r) => r.id);

  const [imageRows, hashtagRows, likeCounts, commentCounts] = await Promise.all([
    db.select({ id: images.id, newsId: images.newsId, url: images.url })
      .from(images)
      .where(and(inArray(images.newsId, ids), eq(images.isDeleted, false))),

    db.select({ newsId: hashtagNews.newsId, id: hashtags.id, name: hashtags.name, slug: hashtags.slug })
      .from(hashtagNews)
      .innerJoin(hashtags, eq(hashtagNews.hashtagId, hashtags.id))
      .where(and(inArray(hashtagNews.newsId, ids), eq(hashtagNews.isDeleted, false))),

    db.select({ newsId: likes.newsId, cnt: count() })
      .from(likes).where(inArray(likes.newsId, ids)).groupBy(likes.newsId),

    db.select({ newsId: comments.newsId, cnt: count() })
      .from(comments)
      .where(and(inArray(comments.newsId, ids), eq(comments.isDeleted, false)))
      .groupBy(comments.newsId),
  ]);

  const imgMap     = {};
  const tagMap     = {};
  for (const img of imageRows) {
    (imgMap[img.newsId] ||= []).push({ id: img.id, url: img.url });
  }
  for (const ht of hashtagRows) {
    (tagMap[ht.newsId] ||= []).push({ id: ht.id, name: ht.name, slug: ht.slug });
  }
  const likeMap    = Object.fromEntries(likeCounts.map((r) => [r.newsId, Number(r.cnt)]));
  const commentMap = Object.fromEntries(commentCounts.map((r) => [r.newsId, Number(r.cnt)]));

  return baseRows.map((r) => ({
    id: r.id, title: r.title, slug: r.slug,
    content: r.content, shortDescription: r.shortDescription,
    status: r.status, viewCount: r.viewCount, rank: r.rank,
    createdAt: r.createdAt, updatedAt: r.updatedAt,
    category: r.categoryId
      ? { id: r.categoryId, name: r.categoryName, slug: r.categorySlug }
      : null,
    author: r.authorId
      ? { id: r.authorId, username: r.authorUsername, name: r.authorName, surname: r.authorSurname }
      : null,
    images:      imgMap[r.id]  || [],
    hashtags:    tagMap[r.id]  || [],
    likeCount:    likeMap[r.id]    || 0,
    commentCount: commentMap[r.id] || 0,
  }));
}

function _baseQuery() {
  return db.select(NEWS_SELECT)
    .from(news)
    .leftJoin(categories, eq(news.categoryId, categories.id))
    .leftJoin(users,      eq(news.authorId,   users.id));
}

// ─── Public API ───────────────────────────────────────────────────────────────

async function findMany({ where, orderBy, skip, take }) {
  const builtOrder = _buildOrderBy(orderBy);

  const [rows, [{ total }]] = await Promise.all([
    _baseQuery().where(where).orderBy(...builtOrder).limit(take).offset(skip),
    db.select({ total: count() }).from(news).where(where),
  ]);

  return { data: await _enrich(rows), total: Number(total) };
}

async function findBySlug(slug) {
  const [row] = await _baseQuery().where(eq(news.slug, slug)).limit(1);
  if (!row) return null;
  const [enriched] = await _enrich([row]);
  return enriched;
}

async function findById(id) {
  const [row] = await _baseQuery().where(eq(news.id, id)).limit(1);
  if (!row) return null;
  const [enriched] = await _enrich([row]);
  return enriched;
}

async function create(data) {
  const [row] = await db.insert(news).values(data).returning();
  return findById(row.id);
}

async function update(id, data) {
  await db.update(news).set({ ...data, updatedAt: new Date() }).where(eq(news.id, id));
  return findById(id);
}

async function incrementViewCount(id) {
  return db.update(news).set({ viewCount: sql`${news.viewCount} + 1` }).where(eq(news.id, id));
}

async function findManyByIds(ids) {
  if (!ids.length) return [];
  const rows = await _baseQuery()
    .where(and(inArray(news.id, ids), eq(news.status, 'PUBLISHED')));
  return _enrich(rows);
}

module.exports = { findMany, findBySlug, findById, create, update, incrementViewCount, findManyByIds };
