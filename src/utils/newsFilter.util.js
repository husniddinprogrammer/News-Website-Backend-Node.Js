const { eq, ne, and, gte, lte, inArray } = require('drizzle-orm');
const { db } = require('../db');
const { news, categories, hashtags, hashtagNews } = require('../db/schema');

/**
 * Barcha filter parametrlaridan Drizzle `where` va `orderBy` quriladi.
 *
 * time    : today | this_week | this_month | (dateFrom+dateTo)
 * sort    : most_viewed | most_liked | most_commented | rank_desc | id_desc | id_asc
 * category: category slug
 * hashtag : hashtag slug
 */
function buildNewsFilter(query, user) {
  const conditions = [];

  // ── Status filtri ─────────────────────────────────────────────────────────
  const isStaff = user && (user.role === 'ADMIN' || user.role === 'BOSS');
  if (!isStaff) {
    conditions.push(eq(news.status, 'PUBLISHED'));
  } else if (query.status) {
    conditions.push(eq(news.status, query.status));
  } else {
    conditions.push(ne(news.status, 'DELETED'));
  }

  // ── Vaqt filtri ───────────────────────────────────────────────────────────
  const now = new Date();

  if (query.time === 'today') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    conditions.push(gte(news.createdAt, start));
  } else if (query.time === 'this_week') {
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    conditions.push(gte(news.createdAt, start));
  } else if (query.time === 'this_month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    conditions.push(gte(news.createdAt, start));
  } else if (query.dateFrom || query.dateTo) {
    if (query.dateFrom) conditions.push(gte(news.createdAt, new Date(query.dateFrom)));
    if (query.dateTo) {
      const end = new Date(query.dateTo);
      end.setHours(23, 59, 59, 999);
      conditions.push(lte(news.createdAt, end));
    }
  }

  // ── Kategoriya filtri ─────────────────────────────────────────────────────
  // categories jadvali news.repository.js da LEFT JOIN qilingan
  if (query.category && query.category !== 'all') {
    conditions.push(eq(categories.slug, query.category));
  }

  // ── Hashtag filtri ────────────────────────────────────────────────────────
  if (query.hashtag && query.hashtag !== 'all') {
    const sub = db
      .select({ newsId: hashtagNews.newsId })
      .from(hashtagNews)
      .innerJoin(hashtags, eq(hashtagNews.hashtagId, hashtags.id))
      .where(and(eq(hashtags.slug, query.hashtag), eq(hashtagNews.isDeleted, false)));
    conditions.push(inArray(news.id, sub));
  }

  const where = conditions.length === 0
    ? undefined
    : conditions.length === 1
      ? conditions[0]
      : and(...conditions);

  return { where, orderBy: _buildOrderBy(query.sort) };
}

function _buildOrderBy(sort) {
  const map = {
    most_viewed:   { viewCount: 'desc' },
    most_liked:    { likes: 'desc' },
    most_commented:{ comments: 'desc' },
    rank_desc:     { rank: 'desc' },
    id_desc:       { createdAt: 'desc' },
    id_asc:        { createdAt: 'asc' },
  };
  return map[sort] || { createdAt: 'desc' };
}

module.exports = { buildNewsFilter };
