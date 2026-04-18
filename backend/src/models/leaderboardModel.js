const db = require('../config/db');

async function getLeaderboard() {
  try {
    const result = await db.query(`
      SELECT
        u.id AS user_id,
        COALESCE(u.name, u.username) AS username,
        COUNT(t.id) AS total_trades,
        COALESCE(SUM(
          CASE
            WHEN m.status = 'settled' AND t.side = m.result THEN (t.amount * t.odds_at_trade) - t.amount
            WHEN m.status = 'settled' AND t.side != m.result THEN -t.amount
            ELSE 0
          END
        ), 0) AS total_profit,
        COUNT(CASE WHEN m.status = 'settled' AND t.side = m.result THEN 1 END) AS winning_trades,
        COUNT(CASE WHEN m.status = 'settled' THEN 1 END) AS settled_trades
      FROM users u
      JOIN trades t ON u.id = t.user_id
      LEFT JOIN markets m ON t.market_id = m.id
      GROUP BY u.id, u.username
      ORDER BY total_profit DESC, total_trades DESC
      LIMIT 100;
    `);

    return result.rows.map(row => {
      const totalTrades = parseInt(row.total_trades, 10);
      const settledTrades = parseInt(row.settled_trades, 10);
      const winningTrades = parseInt(row.winning_trades, 10);
      const winRate = settledTrades > 0 ? (winningTrades / settledTrades) * 100 : 0;

      return {
        userId: row.user_id,
        username: row.username,
        totalTrades,
        totalProfit: parseFloat(row.total_profit),
        winRate: parseFloat(winRate.toFixed(2))
      };
    });
  } catch (error) {
    console.error('Failed to get leaderboard:', error.message);
    return [];
  }
}

module.exports = {
  getLeaderboard
};
