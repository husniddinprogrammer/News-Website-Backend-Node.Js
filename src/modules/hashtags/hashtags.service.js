const { AppError } = require('../../middleware/error.middleware');
const { generateSlug } = require('../../utils/slug.util');
const { parsePagination } = require('../../utils/pagination.util');
const repo = require('./hashtags.repository');

async function getAll(query) {
  const { page, limit, skip } = parsePagination(query);
  const result = await repo.findAll({ skip, take: limit, search: query.search });
  return { ...result, page, limit };
}

async function create(dto) {
  const slug = generateSlug(dto.name);
  const existing = await repo.findBySlug(slug);
  if (existing) throw new AppError('Hashtag already exists', 409);
  return repo.create({ name: dto.name, slug });
}

async function remove(id) {
  const hashtag = await repo.findById(id);
  if (!hashtag) throw new AppError('Hashtag not found', 404);
  await repo.remove(id);
}

module.exports = { getAll, create, remove };
