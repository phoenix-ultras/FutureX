const express = require('express');
const { body, param, query } = require('express-validator');
const marketController = require('../controllers/marketController');
const validateRequest = require('../middleware/validateRequest');
const authMiddleware = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/authMiddleware');

const router = express.Router();
const allowedCategories = ['sports', 'creator', 'meme', 'product', 'trend'];
const allowedStatuses = ['open', 'closed', 'settled', 'paid_out'];
const allowedResults = ['YES', 'NO'];

const createMarketValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 255 })
    .withMessage('Title must be 255 characters or fewer'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .isIn(allowedCategories)
    .withMessage(`Category must be one of: ${allowedCategories.join(', ')}`),
  body('description')
    .optional()
    .trim(),
  body('closingTime')
    .customSanitizer((value, { req }) => value || req.body.close_time)
    .notEmpty()
    .withMessage('Closing time is required')
    .isISO8601()
    .withMessage('Closing time must be a valid ISO 8601 date')
    .custom((value) => {
      if (new Date(value).getTime() <= Date.now()) {
        throw new Error('Closing time must be in the future');
      }

      return true;
    }),
  body('settlementRule')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Settlement rule must be 500 characters or fewer'),
  body('status')
    .optional()
    .trim()
    .isIn(allowedStatuses)
    .withMessage(`Status must be one of: ${allowedStatuses.join(', ')}`)
];

const listMarketsValidation = [
  query('category')
    .optional()
    .trim()
    .isIn(allowedCategories)
    .withMessage(`Category must be one of: ${allowedCategories.join(', ')}`),
  query('sort')
    .optional()
    .isIn(['latest', 'closingSoon'])
    .withMessage('Sort must be one of: latest, closingSoon')
];

const getMarketValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Market id must be a positive integer')
];

const settleMarketValidation = [
  body('marketId')
    .isInt({ min: 1 })
    .withMessage('Market id must be a positive integer'),
  body('result')
    .trim()
    .isIn(allowedResults)
    .withMessage(`Result must be one of: ${allowedResults.join(', ')}`)
];

router.post('/create', authMiddleware, isAdmin, createMarketValidation, validateRequest, marketController.createMarket);
router.get('/all', listMarketsValidation, validateRequest, marketController.listMarkets);
router.get('/:id/odds', getMarketValidation, validateRequest, marketController.getMarketOdds);
router.post('/settle', settleMarketValidation, validateRequest, marketController.settleMarket);
router.get('/:id', getMarketValidation, validateRequest, marketController.getMarketById);

router.post('/', authMiddleware, isAdmin, createMarketValidation, validateRequest, marketController.createMarket);
router.get('/', listMarketsValidation, validateRequest, marketController.listMarkets);

module.exports = router;
