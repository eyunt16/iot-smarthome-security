const jwt = require('jsonwebtoken');
const User = require('../models/User');

function extractBearerToken(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader || typeof authHeader !== 'string') {
    return null;
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return null;
  }

  return token.trim();
}

async function authenticateJWT(req, res, next) {
  const token = extractBearerToken(req);
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    return res.status(500).json({
      message: 'JWT_SECRET is not configured.',
    });
  }

  if (!token) {
    return res.status(401).json({
      message: 'Authentication token is required.',
    });
  }

  try {
    const payload = jwt.verify(token, jwtSecret, {
      issuer: process.env.JWT_ISSUER || 'iot-smart-home-api',
      audience: process.env.JWT_AUDIENCE || 'iot-smart-home-clients',
    });

    if (!payload?.sub) {
      return res.status(401).json({
        message: 'Invalid authentication token.',
      });
    }

    const user = await User.findById(payload.sub)
      .select('username email role isLocked failedLoginAttempts lastLoginIP')
      .lean();

    if (!user) {
      return res.status(401).json({
        message: 'Authentication token is no longer valid.',
      });
    }

    req.user = {
      id: user._id.toString(),
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      isLocked: user.isLocked,
      failedLoginAttempts: user.failedLoginAttempts,
      lastLoginIP: user.lastLoginIP || null,
      tokenIssuedAt: payload.iat || null,
      tokenExpiresAt: payload.exp || null,
    };

    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Authentication token has expired.',
      });
    }

    return res.status(401).json({
      message: 'Invalid authentication token.',
    });
  }
}

module.exports = {
  authenticateJWT,
};
