const auditLogModel = require('../models/auditLogModel');

const ACTIONS = {
  BET_PLACED: 'BET_PLACED',
  TRADE_REJECTED: 'TRADE_REJECTED',
  MARKET_CREATED: 'MARKET_CREATED',
  MARKET_CLOSED: 'MARKET_CLOSED',
  MARKET_SETTLED: 'MARKET_SETTLED',
  PAYOUT_EXECUTED: 'PAYOUT_EXECUTED',
  FRAUD_BLOCKED_ATTEMPT: 'FRAUD_BLOCKED_ATTEMPT'
};

async function log(actionType, { userId = null, marketId = null, metadata = {} } = {}, client = null) {
  const payload = {
    userId,
    marketId,
    actionType,
    metadata
  };

  return client
    ? auditLogModel.createAuditLog(client, payload)
    : auditLogModel.createAuditLog(payload);
}

module.exports = {
  ACTIONS,
  log
};
