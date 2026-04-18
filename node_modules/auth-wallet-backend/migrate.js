const db = require('./src/config/db');

async function runMigration() {
  try {
    console.log('Running migration...');
    const client = await db.getClient();

    try {
      await client.query('BEGIN');

      // Add invested to wallets
      await client.query(`
        ALTER TABLE wallets 
        ADD COLUMN IF NOT EXISTS invested NUMERIC(18, 2) NOT NULL DEFAULT 0 CHECK (invested >= 0);
      `);

      // Add profit to wallets
      await client.query(`
        ALTER TABLE wallets 
        ADD COLUMN IF NOT EXISTS profit NUMERIC(18, 2) NOT NULL DEFAULT 0;
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS transactions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            type VARCHAR(50) NOT NULL CHECK (type IN ('BET', 'WIN', 'LOSS')),
            amount NUMERIC(18, 2) NOT NULL,
            reference_id VARCHAR(255),
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      await client.query(`CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);`);
      await client.query(`CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);`);

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
