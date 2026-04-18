const db = require('../config/db');
const tradeService = require('../services/tradeService');
const socketService = require('../services/socketService');

async function closeMarket(req, res, next) {
  try {
    const marketId = req.params.id;
    
    const result = await db.query(
      `UPDATE markets 
       SET status = 'closed', close_time = NOW() 
       WHERE id = $1 
       RETURNING *`,
      [marketId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Market not found' });
    }

    const market = result.rows[0];

    // Optionally notify via socket
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
      market: settlement.market
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  closeMarket,
  settleMarket
};
