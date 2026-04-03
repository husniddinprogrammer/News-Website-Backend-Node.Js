const Joi = require('joi');

const toggle = Joi.object({
  newsId: Joi.string().uuid().required(),
});

module.exports = { toggle };
