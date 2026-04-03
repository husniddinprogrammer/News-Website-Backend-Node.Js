const Joi = require('joi');

const create = Joi.object({
  newsId: Joi.string().uuid().required(),
  content: Joi.string().min(1).max(2000).required(),
});

const listQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

module.exports = { create, listQuery };
