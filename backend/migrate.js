const db = require('./src/config/db');

async function runMigration() {
  try {
    console.log('Running migration...');
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      await client.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS name VARCHAR(80) NOT NULL DEFAULT 'Trader';
      `);

      await client.query(`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user';
      `);

      await client.query(`
        ALTER TABLE wallets 
        ADD COLUMN IF NOT EXISTS invested NUMERIC(18, 2) NOT NULL DEFAULT 0 CHECK (invested >= 0);
      `);

      await client.query(`
        ALTER TABLE wallets 
        ADD COLUMN IF NOT EXISTS profit NUMERIC(18, 2) NOT NULL DEFAULT 0;
      `);

      await client.query(`
        ALTER TABLE markets
        ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ;
      `);

      await client.query(`
        ALTER TABLE markets
        ADD COLUMN IF NOT EXISTS payout_processed BOOLEAN NOT NULL DEFAULT FALSE;
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS transactions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            type VARCHAR(50) NOT NULL CHECK (type IN ('BET', 'WIN', 'LOSS')),
            amount NUMERIC(18, 2) NOT NULL,
            market_id INTEGER REFERENCES markets(id) ON DELETE SET NULL,
            reference_id VARCHAR(255),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      await client.query(`
        ALTER TABLE transactions
        ADD COLUMN IF NOT EXISTS market_id INTEGER REFERENCES markets(id) ON DELETE SET NULL;
      `);

      await client.query(`CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_transactions_market_id ON transactions(market_id);`);

      await client.query(`
        CREATE TABLE IF NOT EXISTS trades (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            market_id INTEGER NOT NULL REFERENCES markets(id) ON DELETE CASCADE,
            side VARCHAR(3) NOT NULL CHECK (side IN ('YES', 'NO')),
            amount NUMERIC(18, 2) NOT NULL CHECK (amount > 0),
            odds_at_trade NUMERIC(18, 6) NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'WON', 'LOST', 'CANCELLED')),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      await client.query(`
        ALTER TABLE trades
        ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';
      `);

      await client.query(`CREATE INDEX IF NOT EXISTS idx_trades_user_id_created_at ON trades(user_id, created_at DESC);`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_trades_market_id ON trades(market_id);`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_trades_user_market_active ON trades(user_id, market_id, status);`);

      await client.query(`
        CREATE TABLE IF NOT EXISTS audit_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            market_id INTEGER REFERENCES markets(id) ON DELETE SET NULL,
            action_type VARCHAR(50) NOT NULL,
            metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      await client.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_audit_logs_market_id ON audit_logs(market_id);`);

      await client.query(`
        CREATE TABLE IF NOT EXISTS squads (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) UNIQUE NOT NULL,
            description TEXT,
            leader_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS squad_members (
            squad_id INTEGER REFERENCES squads(id) ON DELETE CASCADE,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            role VARCHAR(20) NOT NULL DEFAULT 'member',
            joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            PRIMARY KEY (squad_id, user_id)
        );
      `);

      await client.query(`CREATE INDEX IF NOT EXISTS idx_squad_members_user_id ON squad_members(user_id);`);

      await client.query('COMMIT');
      console.log('Migration completed successfully.');
    } catch (e) {
      await client.query('ROLLBACK');
      console.error('Migration failed, rolling back.', e);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Connection error', err);
  } finally {
    process.exit(0);
  }
}

runMigration();
