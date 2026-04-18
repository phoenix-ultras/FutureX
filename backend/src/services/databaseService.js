const fs = require('fs/promises');
const path = require('path');
const db = require('../config/db');

async function ensureWalletConstraint() {
  await db.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'wallets_user_id_unique'
      ) THEN
        ALTER TABLE wallets
        ADD CONSTRAINT wallets_user_id_unique UNIQUE (user_id);
      END IF;
    END $$;
  `);
}

async function ensureMarketSchema() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS markets (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      description TEXT,
      outcome_type VARCHAR(20) NOT NULL DEFAULT 'YES_NO',
      yes_pool NUMERIC(18, 2) NOT NULL DEFAULT 0,
      no_pool NUMERIC(18, 2) NOT NULL DEFAULT 0,
      created_by TEXT,
      close_time TIMESTAMPTZ NOT NULL,
      closed_at TIMESTAMPTZ,
      settlement_rule TEXT,
      status VARCHAR(50) NOT NULL,
      result VARCHAR(10),
      payout_processed BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.query(`
    ALTER TABLE markets
    ADD COLUMN IF NOT EXISTS description TEXT;
  `);

  await db.query(`
    ALTER TABLE markets
    ADD COLUMN IF NOT EXISTS outcome_type VARCHAR(20) NOT NULL DEFAULT 'YES_NO';
  `);

  await db.query(`
    ALTER TABLE markets
    ADD COLUMN IF NOT EXISTS yes_pool NUMERIC(18, 2) NOT NULL DEFAULT 0;
  `);

  await db.query(`
    ALTER TABLE markets
    ADD COLUMN IF NOT EXISTS no_pool NUMERIC(18, 2) NOT NULL DEFAULT 0;
  `);

  await db.query(`
    ALTER TABLE markets
    ADD COLUMN IF NOT EXISTS created_by TEXT;
  `);

  await db.query(`
    ALTER TABLE markets
    ADD COLUMN IF NOT EXISTS settlement_rule TEXT;
  `);

  await db.query(`
    ALTER TABLE markets
    ADD COLUMN IF NOT EXISTS result VARCHAR(10);
  `);

  await db.query(`
    ALTER TABLE markets
    ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;
  `);

  await db.query(`
    ALTER TABLE markets
    ADD COLUMN IF NOT EXISTS payout_processed BOOLEAN NOT NULL DEFAULT FALSE;
  `);
}

async function ensureUserSchema() {
  await db.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS name VARCHAR(80) NOT NULL DEFAULT 'Trader';
  `);

  await db.query(`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user';
  `);
}

async function ensureTransactionSchema() {
  await db.query(`
    ALTER TABLE transactions
    ADD COLUMN IF NOT EXISTS market_id INTEGER REFERENCES markets(id) ON DELETE SET NULL;
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_transactions_market_id
    ON transactions(market_id);
  `);
}

async function ensureAuditSchema() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      market_id INTEGER REFERENCES markets(id) ON DELETE SET NULL,
      action_type VARCHAR(50) NOT NULL,
      metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
    ON audit_logs(created_at DESC);
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id
    ON audit_logs(user_id);
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_audit_logs_market_id
    ON audit_logs(market_id);
  `);
}

async function ensureTradeSchema() {
  const existingTradesTable = await db.query(`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'trades'
    ) AS exists;
  `);

  if (!existingTradesTable.rows[0].exists) {
    const userIdTypeResult = await db.query(`
      SELECT data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'id';
    `);

    const userIdType = userIdTypeResult.rows[0]?.data_type === 'uuid' ? 'UUID' : 'INTEGER';

    await db.query(`
      CREATE TABLE IF NOT EXISTS trades (
        id SERIAL PRIMARY KEY,
        user_id ${userIdType} NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        market_id INTEGER NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
        side VARCHAR(3) NOT NULL,
        amount NUMERIC(18, 2) NOT NULL CHECK (amount > 0),
        odds_at_trade NUMERIC(18, 6) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  }

  await db.query(`
    ALTER TABLE trades
    ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_trades_user_id_created_at
    ON trades(user_id, created_at DESC);
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_trades_market_id
    ON trades(market_id);
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_trades_user_market_active
    ON trades(user_id, market_id, status);
  `);
}

async function ensureSchema() {
  const schemaPath = path.join(__dirname, '..', '..', 'sql', 'schema.sql');
  const schemaSql = await fs.readFile(schemaPath, 'utf8');

  await db.query(schemaSql);
  await ensureUserSchema();
  await ensureWalletConstraint();
  await ensureMarketSchema();
  await ensureTradeSchema();
  await ensureTransactionSchema();
  await ensureAuditSchema();
  console.log('Database schema verified');
}

module.exports = {
  ensureSchema
};
