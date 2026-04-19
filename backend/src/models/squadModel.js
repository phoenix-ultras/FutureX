const db = require('../config/db');

async function getAllSquads() {
  const query = `
    SELECT s.id, s.name, s.description, s.created_at, 
           u.name AS leader_name,
           (SELECT COUNT(*) FROM squad_members sm WHERE sm.squad_id = s.id) AS member_count,
           COALESCE((
             SELECT SUM(w.profit) FROM wallets w 
             JOIN squad_members sm ON w.user_id = sm.user_id 
             WHERE sm.squad_id = s.id
           ), 0) AS total_profit
    FROM squads s
    LEFT JOIN users u ON s.leader_id = u.id
    ORDER BY total_profit DESC, member_count DESC;
  `;
  const res = await db.query(query);
  return res.rows;
}

async function getSquadById(id) {
  const query = `
    SELECT s.id, s.name, s.description, s.created_at, 
           u.name AS leader_name,
           (SELECT COUNT(*) FROM squad_members sm WHERE sm.squad_id = s.id) AS member_count,
           COALESCE((
             SELECT SUM(w.profit) FROM wallets w 
             JOIN squad_members sm ON w.user_id = sm.user_id 
             WHERE sm.squad_id = s.id
           ), 0) AS total_profit
    FROM squads s
    LEFT JOIN users u ON s.leader_id = u.id
    WHERE s.id = $1;
  `;
  const res = await db.query(query, [id]);
  return res.rows[0];
}

async function createSquad(name, description, leaderId) {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');
    
    // Check if name exists
    const existing = await client.query('SELECT id FROM squads WHERE name = $1', [name]);
    if (existing.rows.length > 0) {
      throw new Error('Squad name already exists');
    }

    // Create squad
    const insertRes = await client.query(
      `INSERT INTO squads (name, description, leader_id) VALUES ($1, $2, $3) RETURNING id`,
      [name, description, leaderId]
    );
    const squadId = insertRes.rows[0].id;

    // Add leader as member
    await client.query(
      `INSERT INTO squad_members (squad_id, user_id, role) VALUES ($1, $2, 'leader')`,
      [squadId, leaderId]
    );

    await client.query('COMMIT');
    return squadId;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function joinSquad(squadId, userId) {
  const query = `
    INSERT INTO squad_members (squad_id, user_id) 
    VALUES ($1, $2)
    ON CONFLICT (squad_id, user_id) DO NOTHING
    RETURNING *;
  `;
  const res = await db.query(query, [squadId, userId]);
  return res.rows[0];
}

async function leaveSquad(squadId, userId) {
  const query = `
    DELETE FROM squad_members 
    WHERE squad_id = $1 AND user_id = $2
    RETURNING *;
  `;
  const res = await db.query(query, [squadId, userId]);
  return res.rows[0];
}

async function getSquadMembers(squadId) {
  const query = `
    SELECT sm.user_id, sm.role, sm.joined_at, u.name, u.email,
           COALESCE(w.profit, 0) as profit,
           COALESCE(w.balance, 0) as balance
    FROM squad_members sm
    JOIN users u ON sm.user_id = u.id
    LEFT JOIN wallets w ON w.user_id = u.id
    WHERE sm.squad_id = $1
    ORDER BY w.profit DESC;
  `;
  const res = await db.query(query, [squadId]);
  return res.rows;
}

async function getUserSquads(userId) {
  const query = `
    SELECT s.id, s.name, s.description, s.created_at, sm.role, sm.joined_at,
           u.name AS leader_name,
           (SELECT COUNT(*) FROM squad_members sm2 WHERE sm2.squad_id = s.id) AS member_count
    FROM squads s
    JOIN squad_members sm ON s.id = sm.squad_id
    LEFT JOIN users u ON s.leader_id = u.id
    WHERE sm.user_id = $1;
  `;
  const res = await db.query(query, [userId]);
  return res.rows;
}

module.exports = {
  getAllSquads,
  getSquadById,
  createSquad,
  joinSquad,
  leaveSquad,
  getSquadMembers,
  getUserSquads
};
