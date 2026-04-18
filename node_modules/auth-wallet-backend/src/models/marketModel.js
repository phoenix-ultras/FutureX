const db = require('../config/db');

const inMemoryMarkets = [];
let nextMarketId = 1;
const DB_FALLBACK_CODES = new Set(['ECONNREFUSED', '3D000', '42P01', 'ENOTFOUND']);

function mapMarket(row) {
  const status = row.status ?? 'open';
  const payoutProcessed = Boolean(row.payout_processed ?? row.payoutProcessed ?? false);

  return {
    id: row.id,
    title: row.title,
    category: row.category,
    description: row.description || null,
    outcomeType: row.outcome_type ?? row.outcomeType ?? 'YES_NO',
    yesPool: Number(row.yes_pool ?? row.yesPool ?? 0),
    noPool: Number(row.no_pool ?? row.noPool ?? 0),
    createdBy: row.created_by ?? row.createdBy ?? null,
    createdAt: row.created_at ?? row.createdAt,
    closingTime: row.close_time ?? row.closingTime,
    closedAt: row.closed_at ?? row.closedAt ?? null,
    settlementRule: row.settlement_rule ?? row.settlementRule ?? null,
    status,
    result: row.result ?? null,
    outcome: row.result ?? row.outcome ?? null,
    payoutProcessed,
    lifecycleStage: payoutProcessed ? 'PAID_OUT' : status.toUpperCase()
  };
}

function shouldUseMemoryFallback(error) {
  return DB_FALLBACK_CODES.has(error.code);
}

function sortMarkets(markets, sort = 'latest') {
  return [...markets].sort((left, right) => {
    if (sort === 'closingSoon') {
      return new Date(left.closingTime).getTime() - new Date(right.closingTime).getTime();
    }

    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });
}

async function createMarket({
  title,
  category,
  description = null,
  closingTime,
  outcomeType = 'YES_NO',
  settlementRule = 'Based on official result / API / manual admin input',
  status = 'open',
  createdBy = null
}) {
  try {
    const result = await db.query(
      `INSERT INTO markets (
         title,
         category,
         description,
         outcome_type,
         yes_pool,
         no_pool,
         created_by,
         close_time,
         settlement_rule,
         status,
         result
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING
         id,
         title,
         category,
         description,
         outcome_type,
         yes_pool,
         no_pool,
         created_by,
         created_at,
         close_time,
         closed_at,
         settlement_rule,
         status,
         result,
         payout_processed`,
      [title, category, description, outcomeType, 0, 0, createdBy, closingTime, settlementRule, status, null]
    );

    return mapMarket(result.rows[0]);
  } catch (error) {
    if (!shouldUseMemoryFallback(error)) {
      throw error;
    }

    const market = {
      id: nextMarketId++,
      title,
      category,
      description,
      outcomeType,
      yesPool: 0,
      noPool: 0,
      createdBy,
      createdAt: new Date().toISOString(),
      closingTime,
      closedAt: null,
      settlementRule,
      status,
      result: null,
      outcome: null,
      payoutProcessed: false
    };

    inMemoryMarkets.unshift(market);
    return market;
  }
}

async function listMarkets({ category, sort = 'latest' } = {}) {
  try {
    const values = [];
    let whereClause = '';

    if (category) {
      values.push(category);
      whereClause = `WHERE category = $${values.length}`;
    }

    const orderByClause = sort === 'closingSoon' ? 'ORDER BY close_time ASC' : 'ORDER BY created_at DESC';
    const result = await db.query(
      `SELECT
         id,
         title,
         category,
         description,
         outcome_type,
         yes_pool,
         no_pool,
         created_by,
         created_at,
         close_time,
         closed_at,
         settlement_rule,
         status,
         result,
         payout_processed
       FROM markets
       ${whereClause}
       ${orderByClause}`,
      values
    );

    return result.rows.map(mapMarket);
  } catch (error) {
    if (!shouldUseMemoryFallback(error)) {
      throw error;
    }

    const filteredMarkets = category
      ? inMemoryMarkets.filter((market) => market.category === category)
      : inMemoryMarkets;

    return sortMarkets(filteredMarkets, sort);
  }
}

async function getMarketById(id) {
  try {
    const result = await db.query(
      `SELECT
         id,
         title,
         category,
         description,
         outcome_type,
         yes_pool,
         no_pool,
         created_by,
         created_at,
         close_time,
         closed_at,
         settlement_rule,
         status,
         result,
         payout_processed
       FROM markets
       WHERE id = $1`,
      [id]
    );

    return result.rows[0] ? mapMarket(result.rows[0]) : null;
  } catch (error) {
    if (!shouldUseMemoryFallback(error)) {
      throw error;
    }

    return inMemoryMarkets.find((market) => String(market.id) === String(id)) || null;
  }
}

async function getMarketByIdForUpdate(client, id) {
  const result = await client.query(
    `SELECT
       id,
       title,
       category,
       description,
       outcome_type,
       yes_pool,
       no_pool,
       created_by,
       created_at,
       close_time,
       closed_at,
       settlement_rule,
       status,
       result,
       payout_processed
     FROM markets
     WHERE id = $1
     FOR UPDATE`,
    [id]
  );

  return result.rows[0] ? mapMarket(result.rows[0]) : null;
}

async function updateMarketPools(client, { marketId, yesPool, noPool, status }) {
  const result = await client.query(
    `UPDATE markets
     SET yes_pool = $2,
         no_pool = $3,
         status = COALESCE($4, status)
     WHERE id = $1
     RETURNING
       id,
       title,
       category,
       description,
       outcome_type,
       yes_pool,
       no_pool,
       created_by,
       created_at,
       close_time,
       closed_at,
       settlement_rule,
       status,
       result,
       payout_processed`,
    [marketId, yesPool, noPool, status ?? null]
  );

  return result.rows[0] ? mapMarket(result.rows[0]) : null;
}

async function closeMarket(client, { marketId, status = 'closed' }) {
  const result = await client.query(
    `UPDATE markets
     SET status = $2,
         closed_at = COALESCE(closed_at, NOW())
     WHERE id = $1
     RETURNING
       id,
       title,
       category,
       description,
       outcome_type,
       yes_pool,
       no_pool,
       created_by,
       created_at,
       close_time,
       closed_at,
       settlement_rule,
       status,
       result,
       payout_processed`,
    [marketId, status]
  );

  return result.rows[0] ? mapMarket(result.rows[0]) : null;
}

async function settleMarket(client, { marketId, result: finalResult, status = 'settled', payoutProcessed = false }) {
  const queryResult = await client.query(
    `UPDATE markets
     SET result = $2,
         status = $3,
         payout_processed = $4,
         closed_at = COALESCE(closed_at, NOW())
     WHERE id = $1
     RETURNING
       id,
       title,
       category,
       description,
       outcome_type,
       yes_pool,
       no_pool,
       created_by,
       created_at,
       close_time,
       closed_at,
       settlement_rule,
       status,
       result,
       payout_processed`,
    [marketId, finalResult, status, payoutProcessed]
  );

  return queryResult.rows[0] ? mapMarket(queryResult.rows[0]) : null;
}

async function updateMarketCloseTime(client, { marketId, closeTime }) {
  const queryResult = await client.query(
    `UPDATE markets
     SET close_time = $2
     WHERE id = $1
     RETURNING
       id,
       title,
       category,
       description,
       outcome_type,
       yes_pool,
       no_pool,
       created_by,
       created_at,
       close_time,
       closed_at,
       settlement_rule,
       status,
       result,
       payout_processed`,
    [marketId, closeTime]
  );

  return queryResult.rows[0] ? mapMarket(queryResult.rows[0]) : null;
}

module.exports = {
  createMarket,
  listMarkets,
  getMarketById,
  getMarketByIdForUpdate,
  updateMarketPools,
  closeMarket,
  settleMarket,
  updateMarketCloseTime
};
