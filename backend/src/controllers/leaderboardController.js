const leaderboardModel = require('../models/leaderboardModel');

async function getLeaderboard(req, res, next) {
  try {
    const leaderboard = await leaderboardModel.getLeaderboard();
    return res.status(200).json({
      success: true,
      data: leaderboard
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getLeaderboard
};
