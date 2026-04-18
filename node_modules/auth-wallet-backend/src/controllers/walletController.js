const walletService = require('../services/walletService');

async function getWallet(req, res, next) {
  try {
    const wallet = await walletService.getWalletByUserId(req.user.id);

    return res.status(200).json({
      name: req.user.name || req.user.username,
      username: req.user.username || req.user.name,
      role: req.user.role,
      ...wallet
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getWallet
};
