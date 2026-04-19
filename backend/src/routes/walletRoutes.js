const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const walletController = require('../controllers/walletController');

const router = express.Router();

router.get('/', authMiddleware, walletController.getWallet);
router.post('/buy-coins', authMiddleware, walletController.buyCoins);
router.post('/payment-intent', authMiddleware, walletController.createPaymentIntent);
router.post('/confirm-payment', authMiddleware, walletController.confirmPayment);

module.exports = router;
