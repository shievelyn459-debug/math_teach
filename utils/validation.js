const { body, validationResult } = require('express-validator');

// 用户注册验证规则
const registerValidation = [
  body('username')
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers and underscores'),

  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .isLength({ max: 100 }).withMessage('Email must be less than 100 characters'),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6, max: 50 }).withMessage('Password must be between 6 and 50 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter and one number')
];

// 登录验证规则
const loginValidation = [
  body('username')
    .notEmpty().withMessage('Username is required'),

  body('password')
    .notEmpty().withMessage('Password is required')
];

// 待办事项验证规则
const todoValidation = [
  body('title')
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 200 }).withMessage('Title must be less than 200 characters'),

  body('description')
    .optional()
    .isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),

  body('dueDate')
    .optional()
    .isISO8601().withMessage('Due date must be a valid date'),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium or high'),

  body('category')
    .optional()
    .isLength({ max: 50 }).withMessage('Category must be less than 50 characters')
];

// 通用验证处理函数
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }

  next();
};

// 密码强度检查
const checkPasswordStrength = (password) => {
  const strength = {
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    length: password.length >= 8
  };

  const score = Object.values(strength).filter(Boolean).length;

  return {
    score,
    isStrong: score >= 4,
    requirements: [
      { met: strength.hasUpperCase, message: 'At least one uppercase letter' },
      { met: strength.hasLowerCase, message: 'At least one lowercase letter' },
      { met: strength.hasNumbers, message: 'At least one number' },
      { met: strength.hasSpecial, message: 'At least one special character' },
      { met: strength.length, message: 'At least 8 characters long' }
    ]
  };
};

module.exports = {
  registerValidation,
  loginValidation,
  todoValidation,
  validate,
  checkPasswordStrength
};