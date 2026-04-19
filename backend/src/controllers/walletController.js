const walletService = require('../services/walletService');
const crypto = require('crypto');

// In-memory store for pending payments (in a real app, this goes in the DB)
const pendingPayments = new Map();

async function getWallet(req, res, next) {
  try {
    const wallet = await walletService.getWalletByUserId(req.user.id);

    return res.status(200).json({
      name: req.user.name || req.user.username,
      username: req.user.username || req.user.name,
      role: req.user.role,
      ...wallet
    });
  } catch (error) {
    return next(error);
  }
}

async function buyCoins(req, res, next) {
  try {
    const { amount } = req.body;
    
    // amount here is expected to be the USD value
    // We convert it to coins: 1 USD = 100 Coins
    const usdAmount = Number(amount);
    
    if (!usdAmount || isNaN(usdAmount) || usdAmount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const coinsToAdd = usdAmount * 100;

    const updatedWallet = await walletService.adjustWalletBalances(req.user.id, {
      balanceDelta: coinsToAdd
    });

    return res.status(200).json({
      message: `Successfully purchased ${coinsToAdd} coins`,
      wallet: updatedWallet
    });
  } catch (error) {
    return next(error);
  }
}

async function createPaymentIntent(req, res, next) {
  try {
    const { amount } = req.body;
    const usdAmount = Number(amount);

    if (!usdAmount || isNaN(usdAmount) || usdAmount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const paymentId = 'pay_' + crypto.randomBytes(12).toString('hex');
    const coinsToAdd = usdAmount * 100;
    
    // Create a mock intent
    const intent = {
      paymentId,
      userId: req.user.id,
      amount: usdAmount,
      coins: coinsToAdd,
      status: 'pending',
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 mins expiry
      qrPayload: `upi://pay?pa=mockmerchant@upi&pn=NeonPrediction&am=${usdAmount}&tr=${paymentId}&cu=USD` // mock payload
    };

    pendingPayments.set(paymentId, intent);

    return res.status(200).json(intent);
  } catch (error) {
    return next(error);
  }
}

async function confirmPayment(req, res, next) {
  try {
    const { paymentId } = req.body;

    if (!paymentId) {
      return res.status(400).json({ error: 'Missing paymentId' });
    }

    const intent = pendingPayments.get(paymentId);

    if (!intent) {
      return res.status(404).json({ error: 'Payment intent not found or expired' });
    }

    if (intent.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to confirm this payment' });
    }

    if (intent.status !== 'pending') {
      return res.status(400).json({ error: 'Payment already processed' });
    }

    if (Date.now() > intent.expiresAt) {
      pendingPayments.delete(paymentId);
      return res.status(400).json({ error: 'Payment intent expired' });
    }

    // Mark as processed
    intent.status = 'succeeded';
    pendingPayments.set(paymentId, intent);

    // Credit the user's wallet
    const updatedWallet = await walletService.adjustWalletBalances(req.user.id, {
      balanceDelta: intent.coins
    });

    // Optionally clean up the intent after some time, or delete immediately
    pendingPayments.delete(paymentId);

    return res.status(200).json({
      message: `Successfully purchased ${intent.coins} coins`,
      wallet: updatedWallet
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getWallet,
  buyCoins,
  createPaymentIntent,
  confirmPayment
};
