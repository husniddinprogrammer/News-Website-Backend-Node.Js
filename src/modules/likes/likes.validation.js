const Joi = require('joi');

const toggle = Joi.object({
  newsId: Joi.number().integer().positive().required(),
});

module.exports = { toggle };
