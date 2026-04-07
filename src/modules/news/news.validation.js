const Joi = require('joi');

const create = Joi.object({
  title: Joi.string().min(3).max(255).required(),
  content: Joi.string().min(10).required(),
  shortDescription: Joi.string().min(10).max(500).required(),
  categoryId: Joi.number().integer().positive().required(),
  status: Joi.string().valid('DRAFT', 'PUBLISHED').default('DRAFT'),
  rank: Joi.number().integer().min(0).max(10).default(0),
  hashtags: Joi.array().items(Joi.string().min(1).max(50)).max(10).default([]),
});

const update = Joi.object({
  title: Joi.string().min(3).max(255),
  content: Joi.string().min(10),
  shortDescription: Joi.string().min(10).max(500),
  categoryId: Joi.number().integer().positive(),
  status: Joi.string().valid('DRAFT', 'PUBLISHED', 'DELETED'),
  rank: Joi.number().integer().min(0).max(10),
  hashtags: Joi.array().items(Joi.string().min(1).max(50)).max(10),
}).min(1);

const listQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.string().valid('DRAFT', 'PUBLISHED', 'DELETED'),
  category: Joi.string().max(100),  // 'all' yoki category slug
  hashtag: Joi.string().max(100),   // 'all' yoki hashtag slug
  search: Joi.string().max(200),
  sort: Joi.string().valid('most_viewed', 'most_liked', 'most_commented', 'rank_desc', 'id_desc', 'id_asc').default('id_desc'),
  time: Joi.string().valid('today', 'this_week', 'this_month'),
  dateFrom: Joi.date().iso(),
  dateTo: Joi.date().iso().when('dateFrom', { is: Joi.exist(), then: Joi.date().min(Joi.ref('dateFrom')) }),
});

module.exports = { create, update, listQuery };
