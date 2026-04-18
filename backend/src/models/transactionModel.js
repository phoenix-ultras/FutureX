const db = require('../config/db');

async function createTransaction(client, { userId, type, amount, referenceId = null }) {
  const result = await client.query(
    `INSERT INTO transactions (user_id, type, amount, reference_id)
     VALUES ($1, $2, $3, $4)
     RETURNING id, user_id, type, amount, reference_id, created_at`,
    [userId, type, amount, referenceId]
  );

  return result.rows[0];
}

async function getTransactionsByUserId(userId, limit = 50, offset = 0) {
  const result = await db.query(
    `SELECT id, user_id, type, amount, reference_id, created_at
     FROM transactions
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  return result.rows;
}

module.exports = {
  createTransaction,
  getTransactionsByUserId
};
