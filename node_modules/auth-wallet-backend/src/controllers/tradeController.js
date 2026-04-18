const { matchedData } = require('express-validator');
const tradeService = require('../services/tradeService');
const socketService = require('../services/socketService');

async function placeTrade(req, res, next) {
  try {
    const payload = matchedData(req, { locations: ['body'] });
    const result = await tradeService.placeTrade({
      ...payload,
      userId: req.user.id
    });

    try {
      const io = socketService.getIO();
      io.to(`market:${payload.marketId}`).emit('trade:placed', {
        marketId: payload.marketId,
        trade: result.trade,
        market: result.market
      });
      io.to(`market:${payload.marketId}`).emit('market:odds', {
        marketId: payload.marketId,
        market: result.market
      });
    } catch (socketErr) {
      console.warn('Socket emit failed:', socketErr.message);
    }

    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

async function getTradesByUserId(req, res, next) {
  try {
    const trades = await tradeService.getTradesByUserId(req.params.id);

    return res.status(200).json({
      success: true,
      data: trades
    });
  } catch (error) {
    return next(error);
  }
}

async function getUserStats(req, res, next) {
  try {
    return res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  placeTrade,
  getTradesByUserId,
  getUserStats
};
