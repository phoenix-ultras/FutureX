const db = require('../config/db');

function mapAuditLog(row) {
  return {
    id: row.id,
    userId: row.user_id,
    marketId: row.market_id,
    actionType: row.action_type,
    metadata: row.metadata || {},
    timestamp: row.created_at
  };
}

async function createAuditLog(clientOrPayload, maybePayload = null) {
  const client = maybePayload ? clientOrPayload : null;
  const payload = maybePayload || clientOrPayload;
  const executor = client || db;

  const result = await executor.query(
    `INSERT INTO audit_logs (user_id, market_id, action_type, metadata)
     VALUES ($1, $2, $3, $4::jsonb)
     RETURNING id, user_id, market_id, action_type, metadata, created_at`,
    [
      payload.userId ?? null,
      payload.marketId ?? null,
      payload.actionType,
      JSON.stringify(payload.metadata || {})
    ]
  );

  return mapAuditLog(result.rows[0]);
}

module.exports = {
  createAuditLog
};
