const { AppError } = require('../../middleware/error.middleware');
const { generateSlug } = require('../../utils/slug.util');
const repo = require('./categories.repository');

async function getAll() {
  return repo.findAll();
}

async function getById(id) {
  const cat = await repo.findById(id);
  if (!cat) throw new AppError('Category not found', 404);
  return cat;
}

async function create(dto) {
  const slug = generateSlug(dto.name);
  const existing = await repo.findBySlug(slug);
  if (existing) throw new AppError('Category with this name already exists', 409);
  return repo.create({ name: dto.name, slug });
}

async function update(id, dto) {
  const cat = await repo.findById(id);
  if (!cat) throw new AppError('Category not found', 404);

  const slug = generateSlug(dto.name);
  return repo.update(id, { name: dto.name, slug });
}

async function remove(id) {
  const cat = await repo.findById(id);
  if (!cat) throw new AppError('Category not found', 404);
  return repo.softDelete(id);
}

module.exports = { getAll, getById, create, update, remove };
