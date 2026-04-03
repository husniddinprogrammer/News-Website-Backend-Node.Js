const slugify = require('slugify');
const prisma = require('../config/database');

/**
 * Generate a unique slug from a string.
 * If the slug already exists in the news table, appends a numeric suffix.
 */
async function generateUniqueSlug(text, excludeId = null) {
  const base = slugify(text, { lower: true, strict: true, trim: true });
  let slug = base;
  let counter = 1;

  while (true) {
    const existing = await prisma.news.findFirst({
      where: {
        slug,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });

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
