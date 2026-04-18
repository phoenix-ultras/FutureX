const db = require('../config/db');

function mapTransaction(row) {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    amount: Number(row.amount),
    marketId: row.market_id ? Number(row.market_id) : null,
    referenceId: row.reference_id,
    timestamp: row.created_at
  };
}

async function createTransaction(client, { userId, type, amount, marketId = null, referenceId = null }) {
  const result = await client.query(
    `INSERT INTO transactions (user_id, type, amount, market_id, reference_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, user_id, type, amount, market_id, reference_id, created_at`,
    [userId, type, amount, marketId, referenceId]
  );

  return mapTransaction(result.rows[0]);
}

async function getTransactionsByUserId(userId, limit = 50, offset = 0) {
  const result = await db.query(
    `SELECT id, user_id, type, amount, market_id, reference_id, created_at
     FROM transactions
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  return result.rows.map(mapTransaction);
}

module.exports = {
  createTransaction,
  getTransactionsByUserId
};
