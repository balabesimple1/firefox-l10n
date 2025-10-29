const Joi = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    next();
  };
};

// Common validation schemas
const schemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    name: Joi.string().min(2).required(),
    role: Joi.string().valid('ADMIN', 'PRODUCT_TEAM', 'FINANCE_TEAM', 'TRANSLATOR').required()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  project: Joi.object({
    name: Joi.string().min(2).required(),
    description: Joi.string().optional(),
    repository: Joi.string().uri().optional(),
    autoApprove: Joi.boolean().optional(),
    costThreshold: Joi.number().positive().optional(),
    locales: Joi.array().items(Joi.string()).optional()
  }),

  translationTask: Joi.object({
    projectId: Joi.string().required(),
    localeId: Joi.string().required(),
    title: Joi.string().min(2).required(),
    description: Joi.string().optional(),
    wordCount: Joi.number().integer().min(0).optional(),
    priority: Joi.number().integer().min(1).max(5).optional(),
    dueDate: Joi.date().optional()
  }),

  invoice: Joi.object({
    projectId: Joi.string().required(),
    month: Joi.number().integer().min(1).max(12).required(),
    year: Joi.number().integer().min(2020).required(),
    lineItems: Joi.array().items(
      Joi.object({
        description: Joi.string().required(),
        wordCount: Joi.number().integer().min(0).required(),
        ratePerWord: Joi.number().positive().required()
      })
    ).min(1).required()
  }),

  translatorRate: Joi.object({
    localeId: Joi.string().required(),
    ratePerWord: Joi.number().positive().required(),
    currency: Joi.string().length(3).optional()
  })
};

module.exports = { validate, schemas };