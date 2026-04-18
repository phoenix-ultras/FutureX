const { matchedData } = require('express-validator');
const marketModel = require('../models/marketModel');
const tradeService = require('../services/tradeService');
const auditService = require('../services/auditService');

async function createMarket(req, res, next) {
  try {
    const payload = matchedData(req, { locations: ['body'] });
    console.log('Create market request received', {
      title: payload.title,
      category: payload.category,
      closingTime: payload.closingTime,
      status: payload.status
    });

    const market = await marketModel.createMarket({
      title: payload.title.trim(),
      category: payload.category.trim(),
      description: payload.description?.trim() || null,
      closingTime: payload.closingTime,
      outcomeType: 'YES_NO',
      settlementRule: payload.settlementRule?.trim() || 'Based on official result / API / manual admin input',
      status: payload.status?.trim() || 'open',
      createdBy: req.user?.id || req.user?.sub || null
    });

    await auditService.log(auditService.ACTIONS.MARKET_CREATED, {
      userId: req.user?.id || req.user?.sub || null,
      marketId: market.id,
      metadata: {
        title: market.title,
        category: market.category,
        closingTime: market.closingTime
      }
    });

    console.log('Market created successfully', {
      marketId: market.id,
      title: market.title
    });

    return res.status(201).json({
      success: true,
      data: market,
      message: 'Market created successfully'
    });
  } catch (error) {
    return next(error);
  }
}

async function listMarkets(req, res, next) {
  try {
    const markets = await marketModel.listMarkets({
      category: req.query.category,
      sort: req.query.sort
    });

    console.log('Markets fetched successfully', {
      count: markets.length
    });

    return res.status(200).json({
      success: true,
      data: markets
    });
  } catch (error) {
    return next(error);
  }
}

async function getMarketById(req, res, next) {
  try {
    const market = await marketModel.getMarketById(Number(req.params.id));

    if (!market) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Market not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: market
    });
  } catch (error) {
    return next(error);
  }
}

async function getMarketOdds(req, res, next) {
  try {
    const odds = await tradeService.getMarketOdds(Number(req.params.id));

    return res.status(200).json(odds);
  } catch (error) {
    return next(error);
  }
}

async function settleMarket(req, res, next) {
  try {
    const payload = matchedData(req, { locations: ['body'] });
    const result = await tradeService.settleMarket(payload);

    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createMarket,
  listMarkets,
  getMarketById,
  getMarketOdds,
  settleMarket
};
