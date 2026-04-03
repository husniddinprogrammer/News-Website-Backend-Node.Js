const Joi = require('joi');

const create = Joi.object({
  name: Joi.string().min(1).max(50).required(),
});

const listQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().max(100),
});

module.exports = { create, listQuery };
