const ApiError = require('../utils/ApiError');
const { verifyAccessToken } = require('../utils/token');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return next(new ApiError(401, 'Authorization token is required'));
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : authHeader;

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      ...payload,
      id: payload.id || payload.sub
    };
    return next();
  } catch (error) {
    return next(new ApiError(401, 'Invalid or expired token'));
  }
}

function isAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return next(new ApiError(403, 'Admin only access'));
  }

  return next();
}

function requireSelfOrAdmin(req, res, next) {
  const requestedUserId = String(req.params.id);
  const authenticatedUserId = String(req.user?.id || req.user?.sub || '');

  if (req.user?.role === 'admin' || requestedUserId === authenticatedUserId) {
    return next();
  }

  return next(new ApiError(403, 'You can only access your own resources'));
}

module.exports = authMiddleware;
module.exports.isAdmin = isAdmin;
module.exports.requireSelfOrAdmin = requireSelfOrAdmin;
