const db = require('../config/db');

function mapUser(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name || row.username,
    username: row.username,
    email: row.email,
    password_hash: row.password_hash,
    role: row.role || 'user',
    created_at: row.created_at,
    wallet_balance: row.wallet_balance !== undefined ? Number(row.wallet_balance || 0) : undefined
  };
}

async function findByEmail(email) {
  const result = await db.query(
    `SELECT id, username, name, email, password_hash, role, created_at
     FROM users
     WHERE email = $1`,
    [email]
  );

  return mapUser(result.rows[0]);
}

async function findByUsername(username) {
  const result = await db.query(
    `SELECT id, username, name, email, password_hash, role, created_at
     FROM users
     WHERE username = $1`,
    [username]
  );

  return mapUser(result.rows[0]);
}

async function findById(id) {
  const result = await db.query(
    `SELECT id, username, name, email, role, created_at
     FROM users
     WHERE id = $1`,
    [id]
  );

  return mapUser(result.rows[0]);
}

async function createUser(client, { username, name, email, passwordHash, role = 'user' }) {
  const result = await client.query(
    `INSERT INTO users (username, name, email, password_hash, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, username, name, email, role, created_at`,
    [username, name, email, passwordHash, role]
  );

  return mapUser(result.rows[0]);
}

async function listUsersWithWallets() {
  const result = await db.query(
    `SELECT
       u.id,
       u.username,
       u.name,
       u.email,
       u.role,
       u.created_at,
       COALESCE(w.balance, 0) AS wallet_balance
     FROM users u
     LEFT JOIN wallets w ON w.user_id = u.id
     ORDER BY u.created_at DESC`
  );

  return result.rows.map(mapUser);
}

module.exports = {
  findByEmail,
  findByUsername,
  findById,
  createUser,
  listUsersWithWallets
};
