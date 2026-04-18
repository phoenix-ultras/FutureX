const rateLimit = require('express-rate-limit');
const ApiError = require('../utils/ApiError');
const auditService = require('../services/auditService');
const tradeModel = require('../models/tradeModel');
const marketModel = require('../models/marketModel');
const walletModel = require('../models/walletModel');

const tradeRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => String(req.user?.id || req.ip),
  handler: async (req, res) => {
    await auditService.log(auditService.ACTIONS.FRAUD_BLOCKED_ATTEMPT, {
      userId: req.user?.id || null,
      marketId: req.body?.marketId || null,
      metadata: {
        reason: 'RATE_LIMIT_EXCEEDED',
        windowMs: 60000
      }
    }).catch(() => {});

    return res.status(429).json({
      message: 'Too many trades. Maximum 10 trades per minute.'
    });
  }
});

async function rapidBetGuard(req, res, next) {
  try {
    const lastTrade = await tradeModel.findLatestTradeByUserId(req.user.id);

    if (!lastTrade) {
      return next();
    }

    const elapsedMs = Date.now() - new Date(lastTrade.createdAt).getTime();
    if (elapsedMs >= 3000) {
      return next();
    }

    await auditService.log(auditService.ACTIONS.FRAUD_BLOCKED_ATTEMPT, {
      userId: req.user.id,
      marketId: req.body.marketId || null,
      metadata: {
        reason: 'RAPID_BETTING',
        elapsedMs
      }
    });

    return res.status(429).json({
      message: 'Trades must be at least 3 seconds apart'
    });
  } catch (error) {
    return next(error);
  }
}

async function duplicateTradeGuard(req, res, next) {
  try {
    const existingTrade = await tradeModel.findActiveTradeByUserAndMarket(req.user.id, req.body.marketId);

    if (!existingTrade) {
      return next();
    }

    await auditService.log(auditService.ACTIONS.FRAUD_BLOCKED_ATTEMPT, {
      userId: req.user.id,
      marketId: req.body.marketId,
      metadata: {
        reason: 'DUPLICATE_ACTIVE_TRADE',
        existingTradeId: existingTrade.id
      }
    });

    return res.status(409).json({
      message: 'One active trade per user per market is allowed'
    });
  } catch (error) {
    return next(error);
  }
}

async function marketStateGuard(req, res, next) {
  try {
    const market = await marketModel.getMarketById(req.body.marketId);
    const closeTimeMs = market ? new Date(market.closingTime).getTime() : NaN;

    if (!market || market.status !== 'open' || (Number.isFinite(closeTimeMs) && Date.now() >= closeTimeMs)) {
      await auditService.log(auditService.ACTIONS.FRAUD_BLOCKED_ATTEMPT, {
        userId: req.user.id,
        marketId: req.body.marketId || null,
        metadata: {
          reason: 'MARKET_NOT_OPEN',
          currentStatus: market?.status || 'missing'
        }
      });

      return res.status(400).json({
        message: 'Market is not open for trading'
      });
    }

    return next();
  } catch (error) {
    return next(error);
  }
}

async function walletSafetyGuard(req, res, next) {
  try {
    const wallet = await walletModel.findWalletByUserId(req.user.id);
    const amount = Number(req.body.amount);

    if (!wallet) {
      throw new ApiError(404, 'Wallet not found');
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new ApiError(400, 'Amount must be greater than zero');
    }

    const availableBalance = Number(wallet.balance) - Number(wallet.locked_balance || 0);

    if (availableBalance < amount) {
      await auditService.log(auditService.ACTIONS.TRADE_REJECTED, {
        userId: req.user.id,
        marketId: req.body.marketId || null,
        metadata: {
          reason: 'INSUFFICIENT_BALANCE',
          attemptedAmount: amount,
          availableBalance
        }
      });

      return res.status(400).json({
        message: 'Insufficient wallet balance'
      });
    }

    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  tradeRateLimiter,
  rapidBetGuard,
  duplicateTradeGuard,
  marketStateGuard,
  walletSafetyGuard
};
