const { body, param, query, validationResult } = require('express-validator');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// User validation rules
const validateUserRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('role')
    .optional()
    .isIn(['admin', 'agency', 'creator', 'client'])
    .withMessage('Role must be one of: admin, agency, creator, client'),
  handleValidationErrors
];

const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Content validation rules
const validateContentCreation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('platform')
    .isIn(['tiktok', 'instagram', 'youtube', 'linkedin', 'twitter'])
    .withMessage('Platform must be one of: tiktok, instagram, youtube, linkedin, twitter'),
  body('contentType')
    .isIn(['video', 'image', 'carousel', 'story', 'post'])
    .withMessage('Content type must be one of: video, image, carousel, story, post'),
  body('scheduledDate')
    .optional()
    .isISO8601()
    .withMessage('Scheduled date must be a valid ISO 8601 date'),
  body('status')
    .optional()
    .isIn(['draft', 'review', 'approved', 'scheduled', 'published'])
    .withMessage('Status must be one of: draft, review, approved, scheduled, published'),
  handleValidationErrors
];

// AI generation validation rules
const validateAIGeneration = [
  body('prompt')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Prompt must be between 10 and 1000 characters'),
  body('type')
    .isIn(['hook', 'script', 'caption', 'hashtags', 'ideas'])
    .withMessage('Type must be one of: hook, script, caption, hashtags, ideas'),
  body('platform')
    .optional()
    .isIn(['tiktok', 'instagram', 'youtube', 'linkedin', 'twitter'])
    .withMessage('Platform must be one of: tiktok, instagram, youtube, linkedin, twitter'),
  body('tone')
    .optional()
    .isIn(['professional', 'casual', 'funny', 'inspirational', 'educational'])
    .withMessage('Tone must be one of: professional, casual, funny, inspirational, educational'),
  body('niche')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Niche must not exceed 100 characters'),
  handleValidationErrors
];

// Hashtag validation rules
const validateHashtagPack = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Pack name must be between 1 and 100 characters'),
  body('hashtags')
    .isArray({ min: 1, max: 30 })
    .withMessage('Hashtags must be an array with 1-30 items'),
  body('hashtags.*')
    .trim()
    .matches(/^#[a-zA-Z0-9_]+$/)
    .withMessage('Each hashtag must start with # and contain only letters, numbers, and underscores'),
  body('purpose')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Purpose must not exceed 200 characters'),
  handleValidationErrors
];

// Parameter validation rules
const validateObjectId = [
  param('id')
    .isUUID()
    .withMessage('ID must be a valid UUID'),
  handleValidationErrors
];

const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateContentCreation,
  validateAIGeneration,
  validateHashtagPack,
  validateObjectId,
  validatePagination
};