const express = require('express');
const { body, param } = require('express-validator');
const tradeController = require('../controllers/tradeController');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();
const allowedSides = ['YES', 'NO'];

const placeTradeValidation = [
  body('userId')
    .customSanitizer((value) => String(value ?? '').trim())
    .notEmpty()
    .withMessage('User id is required'),
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

router.post('/', placeTradeValidation, validateRequest, tradeController.placeTrade);

router.post('/place', placeTradeValidation, validateRequest, tradeController.placeTrade);
router.get('/:id/trades', userTradesValidation, validateRequest, tradeController.getTradesByUserId);
router.get('/:id/stats', userTradesValidation, validateRequest, tradeController.getUserStats);

module.exports = router;
