const db = require('../config/db');
const ApiError = require('../utils/ApiError');

async function createWallet(client, { userId, balance, lockedBalance = 0 }) {
  try {
    const result = await client.query(
      `INSERT INTO wallets (user_id, balance, locked_balance, invested, profit)
       VALUES ($1, $2, $3, 0, 0)
       RETURNING user_id, balance, locked_balance, invested, profit, created_at`,
      [userId, balance, lockedBalance]
    );

    return result.rows[0];
  } catch (error) {
    if (error.code === '23505') {
      throw new ApiError(409, 'Wallet already exists for this user');
    }

    throw error;
  }
}

async function findWalletByUserId(userId) {
  const result = await db.query(
    `SELECT user_id, balance, locked_balance, invested, profit, created_at
     FROM wallets
     WHERE user_id = $1`,
    [userId]
  );

  return result.rows[0] || null;
}

async function updateWalletBalances(client, { userId, balance, lockedBalance, invested, profit }) {
  const result = await client.query(
    `UPDATE wallets
     SET balance = $2, locked_balance = $3, invested = COALESCE($4, invested), profit = COALESCE($5, profit)
     WHERE user_id = $1
     RETURNING user_id, balance, locked_balance, invested, profit, created_at`,
    [userId, balance, lockedBalance, invested, profit]
  );

  return result.rows[0];
}

async function findWalletByUserIdForUpdate(client, userId) {
  const result = await client.query(
    `SELECT user_id, balance, locked_balance, invested, profit, created_at
     FROM wallets
     WHERE user_id = $1
     FOR UPDATE`,
    [userId]
  );

  return result.rows[0] || null;
}

module.exports = {
  createWallet,
  findWalletByUserId,
  updateWalletBalances,
  findWalletByUserIdForUpdate
};
