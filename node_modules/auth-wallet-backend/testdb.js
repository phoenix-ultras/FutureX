const db = require('./src/config/db');

async function test() {
  try {
    const res = await db.query('SELECT * FROM squads');
    console.log('Squads in DB:', res.rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit(0);
  }
}

test();
