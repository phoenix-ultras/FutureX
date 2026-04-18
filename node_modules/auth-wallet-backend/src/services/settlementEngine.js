const db = require('../config/db');
const tradeService = require('./tradeService');
const socketService = require('./socketService');

async function closeExpiredMarkets() {
  try {
    const result = await db.query(
      `UPDATE markets
       SET status = 'closed'
       WHERE status = 'open' AND close_time <= NOW()
       RETURNING *`
    );
    
    for (const market of result.rows) {
      console.log(`Market ${market.id} expired. Transitioned to CLOSED (Waiting Result).`);
      try {
        const io = socketService.getIO();
        io.to(`market:${market.id}`).emit('market:update', {
          marketId: market.id,
          market: market
        });
      } catch (socketErr) {
        // ignore
      }
    }
  } catch (err) {
    console.error('Failed to close expired markets:', err.message);
  }
}

async function getReadyToSettleMarkets() {
  try {
    // Settle markets that have been closed for at least 15 seconds (Simulated Oracle Delay)
    const result = await db.query(
      `SELECT id
       FROM markets
       WHERE status = 'closed' AND close_time <= NOW() - INTERVAL '15 seconds'`
    );
    return result.rows;
  } catch (err) {
    console.error('Failed to query ready-to-settle markets:', err.message);
    return [];
  }
}

async function runSettlementCycle() {
  try {
    await closeExpiredMarkets();

    const readyMarkets = await getReadyToSettleMarkets();
    
    for (const row of readyMarkets) {
      console.log(`Oracle simulating settlement for closed market ${row.id}...`);
      
      const result = Math.random() > 0.5 ? 'YES' : 'NO';
      
      try {
        const settlement = await tradeService.settleMarket({
          marketId: row.id,
          result
        });
        
        console.log(`Market ${row.id} settled as ${result}. PAYOUTS distributed.`);
        
        try {
          const io = socketService.getIO();
          io.to(`market:${row.id}`).emit('market:update', {
            marketId: row.id,
            market: settlement.market
          });
        } catch (socketErr) {
          // ignore
        }
      } catch (err) {
        console.error(`Failed to settle market ${row.id}:`, err.message);
      }
    }
  } catch (err) {
    console.error('Error in settlement cycle:', err.message);
  }
}

function start() {
  console.log('Starting Settlement Engine...');
  setInterval(runSettlementCycle, 15000);
  setTimeout(runSettlementCycle, 2000);
}

module.exports = {
  start,
  runSettlementCycle
};
