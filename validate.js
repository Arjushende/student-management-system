// middleware/validate.js
// Backend validation. This is the source of truth — frontend validation is
// only a UX convenience and must never be trusted on its own, since requests
// can bypass the browser entirely (curl, Postman, a modified client, etc).

const { body, param, query, validationResult } = require('express-validator');

// Runs after the rule chains below; sends 422 with field-level errors if any failed.
function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
}

const studentRules = [
  body('first_name')
    .trim()
    .notEmpty().withMessage('First name is required')
    .isLength({ max: 50 }).withMessage('First name must be 50 characters or fewer')
    .matches(/^[A-Za-z\s'-]+$/).withMessage('First name contains invalid characters'),

  body('last_name')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .isLength({ max: 50 }).withMessage('Last name must be 50 characters or fewer')
    .matches(/^[A-Za-z\s'-]+$/).withMessage('Last name contains invalid characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Email must be a valid email address')
    .normalizeEmail(),

  body('phone')
    .optional({ checkFalsy: true })
    .matches(/^[0-9+\-()\s]{7,20}$/).withMessage('Phone number is invalid'),

  body('date_of_birth')
    .optional({ checkFalsy: true })
    .isISO8601().withMessage('Date of birth must be a valid date (YYYY-MM-DD)')
    .custom(value => new Date(value) < new Date()).withMessage('Date of birth must be in the past'),

  body('department_id')
    .optional({ checkFalsy: true })
    .isInt({ min: 1 }).withMessage('department_id must be a positive integer'),

  body('status')
    .optional({ checkFalsy: true })
    .isIn(['active', 'inactive', 'graduated']).withMessage('Status must be active, inactive, or graduated')
];

const idParamRule = [
  param('id').isInt({ min: 1 }).withMessage('id must be a positive integer')
];

const listQueryRules = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('sortBy').optional().isAlpha().withMessage('sortBy must be alphabetic'),
  query('order').optional().isIn(['asc', 'desc', 'ASC', 'DESC'])
];

module.exports = { handleValidation, studentRules, idParamRule, listQueryRules };
