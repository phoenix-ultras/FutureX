const tradeService = require('../services/tradeService');
const socketService = require('../services/socketService');
const marketModel = require('../models/marketModel');
const userModel = require('../models/userModel');
const tradeModel = require('../models/tradeModel');

async function getDashboard(req, res, next) {
  try {
    const [markets, users, trades] = await Promise.all([
      marketModel.listMarkets({ sort: 'latest' }),
      userModel.listUsersWithWallets(),
      tradeModel.listAllTrades()
    ]);

    return res.status(200).json({
      success: true,
      data: {
        markets,
        users: users.map((user) => ({
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          role: user.role,
          walletBalance: user.wallet_balance || 0
        })),
        trades
      }
    });
  } catch (error) {
    next(error);
  }
}

async function closeMarket(req, res, next) {
  try {
    const marketId = req.params.id;
    const market = await tradeService.closeMarket({ marketId });

    try {
      const io = socketService.getIO();
      io.to(`market:${market.id}`).emit('market:update', {
        marketId: market.id,
        market
      });
    } catch (e) {
      // ignore
    }

    return res.status(200).json({ success: true, message: 'Market closed manually', market });
  } catch (error) {
    next(error);
  }
}

async function settleMarket(req, res, next) {
  try {
    const marketId = req.params.id;
    const { outcome } = req.body;

    if (!outcome) {
      return res.status(400).json({ success: false, message: 'Outcome is required' });
    }

    const settlement = await tradeService.settleMarket({
      marketId,
      result: outcome
    });

    try {
      const io = socketService.getIO();
      io.to(`market:${marketId}`).emit('market:update', {
        marketId: marketId,
        market: settlement.market
      });
    } catch (e) {
      // ignore
    }

    return res.status(200).json({
      success: true,
      message: 'Market settled manually',
      market: settlement.market,
      payoutCount: settlement.payoutCount
    });
  } catch (error) {
    next(error);
  }
}

async function triggerPayout(req, res, next) {
  try {
    const marketId = req.params.id;
    const payout = await tradeService.triggerPayout({ marketId });

    try {
      const io = socketService.getIO();
      io.to(`market:${marketId}`).emit('market:update', {
        marketId,
        market: payout.market
      });
    } catch (e) {
      // ignore
    }

    return res.status(200).json(payout);
  } catch (error) {
    next(error);
  }
}

async function updateCloseTime(req, res, next) {
  try {
    const marketId = req.params.id;
    const { closeTime } = req.body;

    if (!closeTime) {
      return res.status(400).json({ success: false, message: 'Close time is required' });
    }

    const parsedDate = new Date(closeTime);
    if (isNaN(parsedDate.getTime()) || parsedDate.getTime() <= Date.now()) {
      return res.status(400).json({ success: false, message: 'Close time must be a valid future date' });
    }

    const client = await require('../config/db').getClient();
    let updatedMarket;
    try {
      await client.query('BEGIN');
      const market = await marketModel.getMarketByIdForUpdate(client, marketId);
      
      if (!market) {
        throw new require('../utils/ApiError')(404, 'Market not found');
      }

      if (market.status !== 'open') {
        throw new require('../utils/ApiError')(400, 'Only open markets can have their closing time updated');
      }

      updatedMarket = await marketModel.updateMarketCloseTime(client, { marketId, closeTime: parsedDate.toISOString() });
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    try {
      const io = socketService.getIO();
      io.to(`market:${marketId}`).emit('market:update', {
        marketId,
        market: updatedMarket
      });
    } catch (e) {
      // ignore
    }

    return res.status(200).json({
      success: true,
      message: 'Market closing time updated successfully',
      market: updatedMarket
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboard,
  closeMarket,
  settleMarket,
  triggerPayout,
  updateCloseTime
};
