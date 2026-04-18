const express = require('express');
const { body, param } = require('express-validator');
const tradeController = require('../controllers/tradeController');
const validateRequest = require('../middleware/validateRequest');
const authMiddleware = require('../middleware/authMiddleware');
const { requireSelfOrAdmin } = require('../middleware/authMiddleware');
const {
  tradeRateLimiter,
  rapidBetGuard,
  duplicateTradeGuard,
  marketStateGuard,
  walletSafetyGuard
} = require('../middleware/tradeFraudMiddleware');

const router = express.Router();
const allowedSides = ['YES', 'NO'];

const placeTradeValidation = [
  body('marketId')
    .isInt({ min: 1 })
    .withMessage('Market id must be a positive integer'),
  body('side')
    .trim()
    .isIn(allowedSides)
    .withMessage(`Side must be one of: ${allowedSides.join(', ')}`),
  body('amount')
    .isFloat({ gt: 0 })
    .withMessage('Amount must be greater than zero')
];

const userTradesValidation = [
  param('id')
    .customSanitizer((value) => String(value ?? '').trim())
    .notEmpty()
    .withMessage('User id is required')
];

router.post(
  '/',
  authMiddleware,
  tradeRateLimiter,
  placeTradeValidation,
  validateRequest,
  rapidBetGuard,
  duplicateTradeGuard,
  marketStateGuard,
  walletSafetyGuard,
  tradeController.placeTrade
);

router.post(
  '/place',
  authMiddleware,
  tradeRateLimiter,
  placeTradeValidation,
  validateRequest,
  rapidBetGuard,
  duplicateTradeGuard,
  marketStateGuard,
  walletSafetyGuard,
  tradeController.placeTrade
);
router.get('/:id/trades', authMiddleware, userTradesValidation, validateRequest, requireSelfOrAdmin, tradeController.getTradesByUserId);
router.get('/:id/stats', authMiddleware, userTradesValidation, validateRequest, requireSelfOrAdmin, tradeController.getUserStats);

module.exports = router;
