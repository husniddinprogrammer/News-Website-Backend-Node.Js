const Joi = require('joi');

const create = Joi.object({
  newsId: Joi.string().uuid().required(),
  content: Joi.string().min(1).max(2000).required(),
});

const listQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

const allQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().valid('id_desc', 'id_asc').default('id_desc'),
});

module.exports = { create, listQuery, allQuery };
