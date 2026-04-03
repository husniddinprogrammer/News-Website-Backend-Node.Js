/**
 * Parse and clamp pagination query params.
 */
function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

/**
 * Build Prisma date filter from time query param or custom range.
 */
function buildDateFilter(query) {
  const now = new Date();

  if (query.time === 'today') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return { gte: start };
  }

  if (query.time === 'this_week') {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
    return { gte: start };
  }

  if (query.time === 'this_month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { gte: start };
  }

  if (query.dateFrom || query.dateTo) {
    const filter = {};
    if (query.dateFrom) filter.gte = new Date(query.dateFrom);
    if (query.dateTo) {
      const end = new Date(query.dateTo);
      end.setHours(23, 59, 59, 999);
      filter.lte = end;
    }
    return filter;
  }

  return undefined;
}

/**
 * Build Prisma orderBy clause from sort query param.
 */
function buildOrderBy(sort) {
  const map = {
    most_viewed: { viewCount: 'desc' },
    most_liked: { likes: { _count: 'desc' } },
    most_commented: { comments: { _count: 'desc' } },
    id_desc: { createdAt: 'desc' },
    id_asc: { createdAt: 'asc' },
  };
  return map[sort] || { createdAt: 'desc' };
}

module.exports = { parsePagination, buildDateFilter, buildOrderBy };
