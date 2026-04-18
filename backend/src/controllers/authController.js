const { matchedData } = require('express-validator');
const authService = require('../services/authService');
const env = require('../config/env');

function getRefreshCookieOptions() {
  const isProduction = env.nodeEnv === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    path: '/api/auth/refresh',
    maxAge: 7 * 24 * 60 * 60 * 1000
  };
}

async function signup(req, res, next) {
  try {
    console.log('Signup request received', {
      name: req.body?.name || req.body?.username,
      email: req.body?.email
    });

    const payload = matchedData(req, { locations: ['body'] });
    const user = await authService.signup(payload);

    return res.status(201).json({
      message: 'User created successfully',
      user
    });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    console.log('Login request received', {
      email: req.body?.email
    });

    const payload = matchedData(req, { locations: ['body'] });
    const result = await authService.login(payload);

    res.cookie('refreshToken', result.refreshToken, getRefreshCookieOptions());

    return res.status(200).json({
      message: 'Login successful',
      accessToken: result.accessToken,
      user: result.user
    });
  } catch (error) {
    return next(error);
  }
}

async function refresh(req, res, next) {
  try {
    const result = await authService.refreshAccessToken(req.cookies.refreshToken);

    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
}

function logout(req, res) {
  res.clearCookie('refreshToken', getRefreshCookieOptions());

  return res.status(200).json({
    message: 'Logged out successfully'
  });
}

module.exports = {
  signup,
  login,
  refresh,
  logout
};
