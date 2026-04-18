const db = require('../config/db');
const walletModel = require('../models/walletModel');
const transactionModel = require('../models/transactionModel');
const ApiError = require('../utils/ApiError');

function toWalletResponse(wallet, transactions = []) {
  return {
    balance: Number(wallet.balance),
    lockedBalance: Number(wallet.locked_balance),
    invested: Number(wallet.invested || 0),
    profit: Number(wallet.profit || 0),
    transactions
  };
}

async function getWalletByUserId(userId) {
  const wallet = await walletModel.findWalletByUserId(userId);

  if (!wallet) {
    throw new ApiError(404, 'Wallet not found');
  }

  const transactions = await transactionModel.getTransactionsByUserId(userId);

  return toWalletResponse(wallet, transactions);
}

function calculateNextBalances(wallet, changes) {
  const nextBalance = Number(wallet.balance) + Number(changes.balanceDelta || 0);
  const nextLockedBalance = Number(wallet.locked_balance) + Number(changes.lockedBalanceDelta || 0);

  if (nextBalance < 0 || nextLockedBalance < 0 || nextBalance < nextLockedBalance) {
    throw new ApiError(400, 'Wallet update would result in invalid balances');
  }

  return {
    balance: nextBalance,
    lockedBalance: nextLockedBalance,
    invested: Number(wallet.invested || 0),
    profit: Number(wallet.profit || 0)
  };
}

async function withWalletTransaction(userId, operation) {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    const wallet = await walletModel.findWalletByUserIdForUpdate(client, userId);

    if (!wallet) {
      throw new ApiError(404, 'Wallet not found');
    }

    const nextState = await operation(wallet);

    const updatedWallet = await walletModel.updateWalletBalances(client, {
      userId,
      balance: nextState.balance,
      lockedBalance: nextState.lockedBalance,
      invested: nextState.invested,
      profit: nextState.profit
    });

    await client.query('COMMIT');

    return toWalletResponse(updatedWallet);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function adjustWalletBalances(userId, changes) {
  return withWalletTransaction(userId, async (wallet) => calculateNextBalances(wallet, changes));
}

async function lockFunds(userId, amount) {
  const normalizedAmount = Number(amount);

  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    throw new ApiError(400, 'Lock amount must be greater than zero');
  }

  return withWalletTransaction(userId, async (wallet) => {
    if (Number(wallet.balance) < normalizedAmount) {
      throw new ApiError(400, 'Insufficient available balance to lock funds');
    }

    return calculateNextBalances(wallet, {
      balanceDelta: -normalizedAmount,
      lockedBalanceDelta: normalizedAmount
    });
  });
}

async function unlockFunds(userId, amount) {
  const normalizedAmount = Number(amount);

  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    throw new ApiError(400, 'Unlock amount must be greater than zero');
  }

  return withWalletTransaction(userId, async (wallet) => {
    if (Number(wallet.locked_balance) < normalizedAmount) {
      throw new ApiError(400, 'Insufficient locked balance to unlock funds');
    }

    return calculateNextBalances(wallet, {
      balanceDelta: normalizedAmount,
      lockedBalanceDelta: -normalizedAmount
    });
  });
}

async function consumeLockedFunds(userId, amount) {
  const normalizedAmount = Number(amount);

  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    throw new ApiError(400, 'Consumed amount must be greater than zero');
  }

  return withWalletTransaction(userId, async (wallet) => {
    if (Number(wallet.locked_balance) < normalizedAmount) {
      throw new ApiError(400, 'Insufficient locked balance to settle funds');
    }

    return calculateNextBalances(wallet, {
      balanceDelta: 0,
      lockedBalanceDelta: -normalizedAmount
    });
  });
}

async function placeTradeHold(userId, amount) {
  return lockFunds(userId, amount);
}

async function releaseTradeHold(userId, amount) {
  return unlockFunds(userId, amount);
}

module.exports = {
  getWalletByUserId,
  adjustWalletBalances,
  lockFunds,
  unlockFunds,
  consumeLockedFunds,
  placeTradeHold,
  releaseTradeHold
};
