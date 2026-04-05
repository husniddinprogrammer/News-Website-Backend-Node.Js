const { buildDateFilter, buildOrderBy } = require('./pagination.util');

/**
 * Barcha filter parametrlaridan Prisma `where` va `orderBy` quriladi.
 *
 * time    : today | this_week | this_month | (dateFrom+dateTo)
 * sort    : most_viewed | most_liked | most_commented | rank_desc | id_desc | id_asc
 * category: category slug
 * hashtag : hashtag slug
 * (category va hashtag ikkalasi bo'lmasa — barcha yangiliklar)
 */
function buildNewsFilter(query, user) {
  const where = _buildStatusFilter(query, user);

  // ── Vaqt filtri ──────────────────────────────────────────────────────────
  const dateFilter = buildDateFilter(query);
  if (dateFilter) where.createdAt = dateFilter;

  // ── Kategoriya filtri ─────────────────────────────────────────────────────
  if (query.category && query.category !== 'all') {
    where.category = { slug: query.category };
  }

  // ── Hashtag filtri ────────────────────────────────────────────────────────
  if (query.hashtag && query.hashtag !== 'all') {
    where.hashtags = {
      some: { isDeleted: false, hashtag: { slug: query.hashtag } },
    };
  }

  return {
    where,
    orderBy: buildOrderBy(query.sort),
  };
}

function _buildStatusFilter(query, user) {
  const isStaff = user && (user.role === 'ADMIN' || user.role === 'BOSS');

  if (!isStaff) return { status: 'PUBLISHED' };
  if (query.status) return { status: query.status };
  return { NOT: { status: 'DELETED' } };
}

module.exports = { buildNewsFilter };
