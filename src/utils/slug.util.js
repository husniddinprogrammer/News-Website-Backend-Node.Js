const slugify = require('slugify');
const { eq, and, ne } = require('drizzle-orm');
const { db } = require('../db');
const { news } = require('../db/schema');

/**
 * Generate a unique slug from a string.
 * If the slug already exists in the news table, appends a numeric suffix.
 */
async function generateUniqueSlug(text, excludeId = null) {
  const base = slugify(text, { lower: true, strict: true, trim: true });
  let slug = base;
  let counter = 1;

  while (true) {
    const where = excludeId
      ? and(eq(news.slug, slug), ne(news.id, excludeId))
      : eq(news.slug, slug);

    const [existing] = await db.select({ id: news.id }).from(news).where(where).limit(1);

    if (!existing) break;
    slug = `${base}-${counter}`;
    counter++;
  }

  return slug;
}

/**
 * Generate a simple slug (no uniqueness check — for categories, hashtags, etc.)
 */
function generateSlug(text) {
  return slugify(text, { lower: true, strict: true, trim: true });
}

module.exports = { generateUniqueSlug, generateSlug };
