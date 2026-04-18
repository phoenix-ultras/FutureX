const db = require('../config/db');
const ApiError = require('../utils/ApiError');
const marketModel = require('../models/marketModel');
const tradeModel = require('../models/tradeModel');
const walletModel = require('../models/walletModel');
const userModel = require('../models/userModel');
const transactionModel = require('../models/transactionModel');
const auditService = require('./auditService');

function normalizeMarketState(market) {
  if (!market) {
    return market;
  }

  const closingTimeMs = new Date(market.closingTime).getTime();
  if (market.status === 'open' && Number.isFinite(closingTimeMs) && closingTimeMs <= Date.now()) {
    return { ...market, status: 'closed' };
  }

  return market;
}

function ensureOpenMarketForTrading(market) {
  const normalizedMarket = normalizeMarketState(market);

  if (!normalizedMarket) {
    throw new ApiError(404, 'Market not found');
  }

  if (normalizedMarket.status !== 'open') {
    throw new ApiError(400, 'Market is not open for trading');
  }

  const closingTimeMs = new Date(normalizedMarket.closingTime).getTime();
  if (!Number.isFinite(closingTimeMs)) {
    throw new ApiError(400, 'Market closing time is invalid');
  }

  if (Date.now() >= closingTimeMs) {
    throw new ApiError(400, 'Trading is closed for this market');
  }

  return normalizedMarket;
}

function calculateOdds({ yesPool, noPool }) {
  const normalizedYesPool = Number(yesPool) || 0;
  const normalizedNoPool = Number(noPool) || 0;
  const totalPool = normalizedYesPool + normalizedNoPool;

  return {
    yesOdds: normalizedYesPool > 0 ? totalPool / normalizedYesPool : Math.max(totalPool, 1),
    noOdds: normalizedNoPool > 0 ? totalPool / normalizedNoPool : Math.max(totalPool, 1),
    totalPool
  };
}

async function getMarketOdds(marketId) {
  const market = normalizeMarketState(await marketModel.getMarketById(marketId));

  if (!market) {
    throw new ApiError(404, 'Market not found');
  }

  return calculateOdds(market);
}

async function placeTrade({ userId, marketId, side, amount }) {
  const normalizedAmount = Number(amount);

  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    throw new ApiError(400, 'Trade amount must be greater than zero');
  }

  const user = await userModel.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    const market = ensureOpenMarketForTrading(await marketModel.getMarketByIdForUpdate(client, marketId));
    const existingTrade = await tradeModel.findActiveTradeByUserAndMarket(userId, marketId, client);
    const wallet = await walletModel.findWalletByUserIdForUpdate(client, userId);

    if (existingTrade) {
      await auditService.log(auditService.ACTIONS.TRADE_REJECTED, {
        userId,
        marketId,
        metadata: {
          reason: 'DUPLICATE_ACTIVE_TRADE',
          existingTradeId: existingTrade.id
        }
      }, client);
      throw new ApiError(409, 'One active trade per user per market is allowed');
    }

    if (!wallet) {
      throw new ApiError(404, 'Wallet not found');
    }

    const walletBalance = Number(wallet.balance);
    const availableBalance = walletBalance - Number(wallet.locked_balance || 0);
    if (availableBalance < normalizedAmount) {
      throw new ApiError(400, 'Insufficient wallet balance');
    }

    const odds = calculateOdds(market);
    const oddsAtTrade = side === 'YES' ? odds.yesOdds : odds.noOdds;

    const nextPools = {
      yesPool: side === 'YES' ? Number(market.yesPool) + normalizedAmount : Number(market.yesPool),
      noPool: side === 'NO' ? Number(market.noPool) + normalizedAmount : Number(market.noPool)
    };

    const updatedWallet = await walletModel.updateWalletBalances(client, {
      userId,
      balance: walletBalance,
      lockedBalance: Number(wallet.locked_balance) + normalizedAmount,
      invested: Number(wallet.invested || 0) + normalizedAmount,
      profit: Number(wallet.profit || 0)
    });

    const updatedMarket = await marketModel.updateMarketPools(client, {
      marketId,
      yesPool: nextPools.yesPool,
      noPool: nextPools.noPool,
      status: Date.now() >= new Date(market.closingTime).getTime() ? 'closed' : market.status
    });

    const trade = await tradeModel.createTrade(client, {
      userId,
      marketId,
      side,
      amount: normalizedAmount,
      oddsAtTrade
    });

    await transactionModel.createTransaction(client, {
      userId,
      type: 'BET',
      amount: normalizedAmount,
      marketId,
      referenceId: String(trade.id)
    });

    const recentTrade = await tradeModel.findLatestTradeByUserId(userId, client);
    const suspiciousTradeSize = recentTrade && recentTrade.id !== trade.id
      ? normalizedAmount >= Number(recentTrade.amount) * 5
      : false;

    await auditService.log(auditService.ACTIONS.BET_PLACED, {
      userId,
      marketId,
      metadata: {
        tradeId: trade.id,
        side,
        amount: normalizedAmount,
        oddsAtTrade,
        suspiciousTradeSize
      }
    }, client);

    await client.query('COMMIT');

    return {
      success: true,
      message: 'Trade executed',
      updatedWallet: Number(updatedWallet.balance),
      market: normalizeMarketState(updatedMarket),
      trade
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function closeMarket({ marketId }) {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    const market = normalizeMarketState(await marketModel.getMarketByIdForUpdate(client, marketId));

    if (!market) {
      throw new ApiError(404, 'Market not found');
    }

    if (market.status === 'settled') {
      throw new ApiError(400, 'Settled markets cannot be closed again');
    }

    const closedMarket = await marketModel.closeMarket(client, { marketId, status: 'closed' });
    await auditService.log(auditService.ACTIONS.MARKET_CLOSED, {
      marketId,
      metadata: {
        previousStatus: market.status,
        nextStatus: closedMarket.status
      }
    }, client);
    await client.query('COMMIT');
    return closedMarket;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function processMarketPayout(client, market, trades) {
  if (market.payoutProcessed) {
    return {
      market,
      payoutCount: 0
    };
  }

  let payoutCount = 0;

  for (const trade of trades) {
    const isWin = trade.side === market.result;
    const amount = Number(trade.amount);
    const payout = isWin ? amount * Number(trade.oddsAtTrade) : 0;
    const wallet = await walletModel.findWalletByUserIdForUpdate(client, trade.userId);

    if (!wallet) {
      continue;
    }

    let newBalance = Number(wallet.balance);
    const newInvested = Math.max(0, Number(wallet.invested || 0) - amount);
    let newProfit = Number(wallet.profit || 0);
    const newLockedBalance = Math.max(0, Number(wallet.locked_balance) - amount);

    if (isWin) {
      newBalance += (payout - amount);
      newProfit += (payout - amount);
      await transactionModel.createTransaction(client, {
        userId: trade.userId,
        type: 'WIN',
        amount: payout,
        marketId: market.id,
        referenceId: String(trade.id)
      });
      await tradeModel.updateTradeStatus(client, {
        tradeId: trade.id,
        status: 'WON'
      });
    } else {
      newBalance -= amount;
      newProfit -= amount;
      await transactionModel.createTransaction(client, {
        userId: trade.userId,
        type: 'LOSS',
        amount,
        marketId: market.id,
        referenceId: String(trade.id)
      });
      await tradeModel.updateTradeStatus(client, {
        tradeId: trade.id,
        status: 'LOST'
      });
    }

    await walletModel.updateWalletBalances(client, {
      userId: trade.userId,
      balance: newBalance,
      lockedBalance: newLockedBalance,
      invested: newInvested,
      profit: newProfit
    });

    payoutCount += 1;
  }

  const updatedMarket = await marketModel.settleMarket(client, {
    marketId: market.id,
    result: market.result,
    status: 'settled',
    payoutProcessed: true
  });

  await auditService.log(auditService.ACTIONS.PAYOUT_EXECUTED, {
    marketId: market.id,
    metadata: {
      tradesProcessed: trades.length,
      payoutCount
    }
  }, client);

  return {
    market: updatedMarket,
    payoutCount
  };
}

async function settleMarket({ marketId, result }) {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    const market = normalizeMarketState(await marketModel.getMarketByIdForUpdate(client, marketId));

    if (!market) {
      throw new ApiError(404, 'Market not found');
    }

    const closingTimeMs = new Date(market.closingTime).getTime();
    if (market.status === 'open' && Number.isFinite(closingTimeMs) && Date.now() < closingTimeMs) {
      throw new ApiError(400, 'Market cannot be settled before closing time');
    }

    if (market.status === 'settled') {
      throw new ApiError(400, 'Market is already settled');
    }

    const normalizedResult = String(result).toUpperCase();
    const settledMarket = await marketModel.settleMarket(client, {
      marketId,
      result: normalizedResult,
      status: 'settled',
      payoutProcessed: false
    });

    await auditService.log(auditService.ACTIONS.MARKET_SETTLED, {
      marketId,
      metadata: {
        result: normalizedResult,
        previousStatus: market.status
      }
    }, client);

    await client.query('COMMIT');

    return {
      success: true,
      message: 'Market settled successfully',
      market: settledMarket,
      settledTrades: 0,
      payoutCount: 0
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function triggerPayout({ marketId }) {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    const market = normalizeMarketState(await marketModel.getMarketByIdForUpdate(client, marketId));
    if (!market) {
      throw new ApiError(404, 'Market not found');
    }

    if (!market.result) {
      throw new ApiError(400, 'Market result must be set before payout');
    }

    if (market.status !== 'settled') {
      throw new ApiError(400, 'Market must be settled before payout');
    }

    const trades = await tradeModel.listTradesByMarketId(marketId, client);
    const payout = await processMarketPayout(client, market, trades);

    await client.query('COMMIT');

    return {
      success: true,
      message: payout.payoutCount > 0 ? 'Payout completed successfully' : 'Payout was already processed',
      market: payout.market,
      payoutCount: payout.payoutCount
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function getTradesByUserId(userId) {
  const user = await userModel.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  return tradeModel.listTradesByUserId(userId);
}

module.exports = {
  calculateOdds,
  getMarketOdds,
  placeTrade,
  closeMarket,
  settleMarket,
  triggerPayout,
  getTradesByUserId
};
