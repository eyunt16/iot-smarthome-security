const SecurityLog = require('../models/SecurityLog');
const { sendSecurityAlert } = require('../utils/emailAlert');

const ROLES = Object.freeze({
  SUPER_ADMIN: 'SuperAdmin',
  HOME_OWNER: 'HomeOwner',
  GUEST: 'Guest',
});

const ROLE_HIERARCHY = Object.freeze({
  [ROLES.SUPER_ADMIN]: 3,
  [ROLES.HOME_OWNER]: 2,
  [ROLES.GUEST]: 1,
});

function getClientIp(req) {
  const forwardedFor = req.headers['x-forwarded-for'];

  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }

  return (
    req.ip
    || req.socket?.remoteAddress
    || req.connection?.remoteAddress
    || null
  );
}

async function logUnauthorizedAccess(req, reason) {
  const ipAddress = getClientIp(req);

  try {
    await SecurityLog.create({
      eventType: 'UNAUTHORIZED_ACCESS',
      description: reason,
      ipAddress,
      nodeId: null,
      resolved: false,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Failed to persist security log entry:', error);
  }

  try {
    await sendSecurityAlert({
      subject: '[HIGH] Unauthorized Access Attempt Detected',
      title: 'Unauthorized Access Event',
      message: reason,
      metadata: {
        method: req.method,
        path: req.originalUrl,
        ipAddress,
        userId: req.user?._id || req.user?.id || null,
        username: req.user?.username || null,
        role: req.user?.role || null,
      },
    });
  } catch (error) {
    console.error('Failed to send unauthorized access alert email:', error);
  }
}

function hasSufficientRole(userRole, allowedRoles) {
  const currentRoleWeight = ROLE_HIERARCHY[userRole];

  if (!currentRoleWeight) {
    return false;
  }

  return allowedRoles.some((role) => currentRoleWeight >= ROLE_HIERARCHY[role]);
}

function authorizeRoles(...allowedRoles) {
  const normalizedAllowedRoles = [...new Set(allowedRoles)].filter(
    (role) => Object.values(ROLES).includes(role),
  );

  if (normalizedAllowedRoles.length === 0) {
    throw new Error('authorizeRoles requires at least one valid role.');
  }

  return async function rbacMiddleware(req, res, next) {
    const user = req.user;

    if (!user) {
      await logUnauthorizedAccess(
        req,
        `Access denied: unauthenticated request to ${req.method} ${req.originalUrl}`,
      );

      return res.status(401).json({
        message: 'Authentication required.',
      });
    }

    if (!Object.values(ROLES).includes(user.role)) {
      await logUnauthorizedAccess(
        req,
        `Access denied: invalid role "${user.role}" for user ${user._id || user.id || user.username || 'unknown'} on ${req.method} ${req.originalUrl}`,
      );

      return res.status(403).json({
        message: 'Access denied.',
      });
    }

    if (user.isLocked === true) {
      await logUnauthorizedAccess(
        req,
        `Access denied: locked account ${user._id || user.id || user.username || 'unknown'} attempted ${req.method} ${req.originalUrl}`,
      );

      return res.status(423).json({
        message: 'Account is locked.',
      });
    }

    if (!hasSufficientRole(user.role, normalizedAllowedRoles)) {
      await logUnauthorizedAccess(
        req,
        `Access denied: role ${user.role} cannot access ${req.method} ${req.originalUrl}`,
      );

      return res.status(403).json({
        message: 'Insufficient permissions.',
      });
    }

    return next();
  };
}

const requireGuest = authorizeRoles(ROLES.GUEST);
const requireHomeOwner = authorizeRoles(ROLES.HOME_OWNER);
const requireSuperAdmin = authorizeRoles(ROLES.SUPER_ADMIN);

module.exports = {
  ROLES,
  authorizeRoles,
  requireGuest,
  requireHomeOwner,
  requireSuperAdmin,
};
