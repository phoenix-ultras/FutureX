const db = require('../config/db');

const inMemoryTrades = [];
let nextTradeId = 1;
const DB_FALLBACK_CODES = new Set(['ECONNREFUSED', '3D000', '42P01', 'ENOTFOUND']);

function shouldUseMemoryFallback(error) {
  return DB_FALLBACK_CODES.has(error.code);
}

function mapTrade(row) {
  return {
    id: row.id,
    userId: row.user_id ?? row.userId,
    marketId: Number(row.market_id ?? row.marketId),
    side: row.side,
    amount: Number(row.amount),
    oddsAtTrade: Number(row.odds_at_trade ?? row.oddsAtTrade),
    status: row.status ?? 'ACTIVE',
    createdAt: row.created_at ?? row.createdAt
  };
}

async function createTrade(client, { userId, marketId, side, amount, oddsAtTrade }) {
  if (client) {
    const result = await client.query(
      `INSERT INTO trades (user_id, market_id, side, amount, odds_at_trade, status)
       VALUES ($1, $2, $3, $4, $5, 'ACTIVE')
       RETURNING id, user_id, market_id, side, amount, odds_at_trade, status, created_at`,
      [userId, marketId, side, amount, oddsAtTrade]
    );

    return mapTrade(result.rows[0]);
  }

  try {
    const result = await db.query(
      `INSERT INTO trades (user_id, market_id, side, amount, odds_at_trade, status)
       VALUES ($1, $2, $3, $4, $5, 'ACTIVE')
       RETURNING id, user_id, market_id, side, amount, odds_at_trade, status, created_at`,
      [userId, marketId, side, amount, oddsAtTrade]
    );

    return mapTrade(result.rows[0]);
  } catch (error) {
    if (!shouldUseMemoryFallback(error)) {
      throw error;
    }

    const trade = {
      id: nextTradeId++,
      userId,
      marketId: Number(marketId),
      side,
      amount: Number(amount),
      oddsAtTrade: Number(oddsAtTrade),
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };

    inMemoryTrades.unshift(trade);
    return trade;
  }
}

async function listTradesByMarketId(marketId, client = null) {
  try {
    const executor = client || db;
    const result = await executor.query(
      `SELECT id, user_id, market_id, side, amount, odds_at_trade, status, created_at
       FROM trades
       WHERE market_id = $1
       ORDER BY created_at ASC`,
      [marketId]
    );

    return result.rows.map(mapTrade);
  } catch (error) {
    if (!shouldUseMemoryFallback(error)) {
      throw error;
    }

    return inMemoryTrades
      .filter((trade) => String(trade.marketId) === String(marketId))
      .sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
  }
}

async function listTradesByUserId(userId, client = null) {
  try {
    const executor = client || db;
    const result = await executor.query(
      `SELECT id, user_id, market_id, side, amount, odds_at_trade, status, created_at
       FROM trades
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    return result.rows.map(mapTrade);
  } catch (error) {
    if (!shouldUseMemoryFallback(error)) {
      throw error;
    }

    return inMemoryTrades
      .filter((trade) => String(trade.userId) === String(userId))
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
  }
}

async function listAllTrades() {
  try {
    const result = await db.query(
      `SELECT id, user_id, market_id, side, amount, odds_at_trade, status, created_at
       FROM trades
       ORDER BY created_at DESC
       LIMIT 500`
    );

    return result.rows.map(mapTrade);
  } catch (error) {
    if (!shouldUseMemoryFallback(error)) {
      throw error;
    }

    return [...inMemoryTrades].sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    );
  }
}

async function findActiveTradeByUserAndMarket(userId, marketId, client = null) {
  const executor = client || db;

  try {
    const result = await executor.query(
      `SELECT id, user_id, market_id, side, amount, odds_at_trade, status, created_at
       FROM trades
       WHERE user_id = $1 AND market_id = $2 AND status = 'ACTIVE'
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId, marketId]
    );

    return result.rows[0] ? mapTrade(result.rows[0]) : null;
  } catch (error) {
    if (!shouldUseMemoryFallback(error)) {
      throw error;
    }

    return inMemoryTrades.find(
      (trade) => String(trade.userId) === String(userId) &&
        String(trade.marketId) === String(marketId) &&
        trade.status === 'ACTIVE'
    ) || null;
  }
}

async function findLatestTradeByUserId(userId, client = null) {
  const executor = client || db;

  try {
    const result = await executor.query(
      `SELECT id, user_id, market_id, side, amount, odds_at_trade, status, created_at
       FROM trades
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId]
    );

    return result.rows[0] ? mapTrade(result.rows[0]) : null;
  } catch (error) {
    if (!shouldUseMemoryFallback(error)) {
      throw error;
    }

    return [...inMemoryTrades]
      .filter((trade) => String(trade.userId) === String(userId))
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())[0] || null;
  }
}

async function updateTradeStatus(client, { tradeId, status }) {
  const result = await client.query(
    `UPDATE trades
     SET status = $2
     WHERE id = $1
     RETURNING id, user_id, market_id, side, amount, odds_at_trade, status, created_at`,
    [tradeId, status]
  );

  return result.rows[0] ? mapTrade(result.rows[0]) : null;
}

module.exports = {
  createTrade,
  listTradesByMarketId,
  listTradesByUserId,
  listAllTrades,
  findActiveTradeByUserAndMarket,
  findLatestTradeByUserId,
  updateTradeStatus
};
