const Joi = require('joi');

const listQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().max(100),
});

const updateRole = Joi.object({
  role: Joi.string().valid('ADMIN', 'BOSS').required(),
});

const updateBlocked = Joi.object({
  isBlocked: Joi.boolean().required(),
});

module.exports = { listQuery, updateRole, updateBlocked };
