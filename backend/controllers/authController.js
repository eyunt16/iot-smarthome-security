const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const SecurityLog = require('../models/SecurityLog');
const { sendSecurityAlert } = require('../utils/emailAlert');

const MAX_FAILED_LOGIN_ATTEMPTS = 5;

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

function signAccessToken(user) {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error('JWT_SECRET is not configured.');
  }

  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      username: user.username,
      email: user.email,
    },
    jwtSecret,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '12h',
      issuer: process.env.JWT_ISSUER || 'iot-smart-home-api',
      audience: process.env.JWT_AUDIENCE || 'iot-smart-home-clients',
    },
  );
}

async function writeSecurityEvent({
  eventType,
  description,
  ipAddress,
  nodeId = null,
  resolved = false,
}) {
  try {
    await SecurityLog.create({
      eventType,
      description,
      ipAddress,
      nodeId,
      resolved,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Failed to write security log:', error);
  }
}

async function sendLockoutAlert({ user, ipAddress }) {
  try {
    await sendSecurityAlert({
      subject: '[CRITICAL] Account Locked After Failed Login Attempts',
      title: 'User Account Locked',
      message:
        'A user account was locked after exceeding the maximum failed login threshold.',
      metadata: {
        username: user.username,
        email: user.email,
        userId: user._id.toString(),
        failedLoginAttempts: user.failedLoginAttempts,
        ipAddress,
      },
    });
  } catch (error) {
    console.error('Failed to send account lockout alert email:', error);
  }
}

async function login(req, res) {
  const { email, username, usernameOrEmail, password } = req.body || {};
  const clientIp = getClientIp(req);
  const loginIdentifier = String(
    usernameOrEmail || email || username || '',
  ).trim().toLowerCase();

  if (!loginIdentifier || !password) {
    return res.status(400).json({
      message: 'usernameOrEmail and password are required.',
    });
  }

  try {
    const user = await User.findOne({
      $or: [
        { email: loginIdentifier },
        { username: loginIdentifier },
      ],
    }).select('+passwordHash');

    if (!user) {
      await writeSecurityEvent({
        eventType: 'LOGIN_FAILED',
        description: `Login failed for unknown account: ${loginIdentifier}`,
        ipAddress: clientIp,
      });

      return res.status(401).json({
        message: 'Invalid credentials.',
      });
    }

    if (user.isLocked) {
      await writeSecurityEvent({
        eventType: 'LOGIN_FAILED',
        description: `Locked account login attempt for user ${user.username}`,
        ipAddress: clientIp,
      });

      return res.status(423).json({
        message: 'Account is locked. Please contact an administrator.',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      user.failedLoginAttempts += 1;
      const wasLockedBeforeAttempt = user.isLocked;

      if (user.failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
        user.isLocked = true;
      }

      console.info(
        `[AUTH] Failed login for ${user.username}: attempts=${user.failedLoginAttempts}, locked=${user.isLocked}`,
      );

      await user.save();

      await writeSecurityEvent({
        eventType: 'LOGIN_FAILED',
        description: user.isLocked
          ? `Account locked after repeated failed logins for user ${user.username}`
          : `Login failed for user ${user.username}. Attempt ${user.failedLoginAttempts}`,
        ipAddress: clientIp,
      });

      if (user.isLocked && !wasLockedBeforeAttempt) {
        await sendLockoutAlert({
          user,
          ipAddress: clientIp,
        });
      }

      return res.status(401).json({
        message: user.isLocked
          ? 'Account locked after too many failed login attempts.'
          : 'Invalid credentials.',
      });
    }

    user.failedLoginAttempts = 0;
    user.isLocked = false;
    user.lastLoginIP = clientIp;
    await user.save();

    console.info(`[AUTH] Successful login for ${user.username}: attempts reset to 0`);

    const token = signAccessToken(user);

    return res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        lastLoginIP: user.lastLoginIP,
      },
    });
  } catch (error) {
    console.error('Login error:', error);

    return res.status(500).json({
      message: 'Unable to complete login request.',
    });
  }
}

async function unlockUserAccount(req, res) {
  const { userId } = req.params;
  const adminIp = getClientIp(req);

  try {
    const targetUser = await User.findById(userId).select(
      'username email isLocked failedLoginAttempts',
    );

    if (!targetUser) {
      return res.status(404).json({
        message: 'User not found.',
      });
    }

    targetUser.failedLoginAttempts = 0;
    targetUser.isLocked = false;
    await targetUser.save();

    const actingAdmin =
      req.user?.username || req.user?.email || req.user?.id || 'unknown-admin';

    await writeSecurityEvent({
      eventType: 'ACCOUNT_UNLOCKED',
      description: `SuperAdmin ${actingAdmin} unlocked user ${targetUser.username} (${targetUser._id.toString()})`,
      ipAddress: adminIp,
    });

    return res.status(200).json({
      message: 'User account unlocked successfully.',
      user: {
        id: targetUser._id,
        username: targetUser.username,
        email: targetUser.email,
        isLocked: targetUser.isLocked,
        failedLoginAttempts: targetUser.failedLoginAttempts,
      },
    });
  } catch (error) {
    console.error('Unlock user error:', error);

    return res.status(500).json({
      message: 'Unable to unlock user account.',
    });
  }
}

async function listLockedUsers(_req, res) {
  try {
    const lockedUsers = await User.find({ isLocked: true })
      .select('_id username email failedLoginAttempts lastLoginIP')
      .sort({ updatedAt: -1 })
      .lean();

    return res.status(200).json({
      count: lockedUsers.length,
      users: lockedUsers,
    });
  } catch (error) {
    console.error('List locked users error:', error);

    return res.status(500).json({
      message: 'Unable to fetch locked users.',
    });
  }
}

module.exports = {
  login,
  listLockedUsers,
  unlockUserAccount,
  MAX_FAILED_LOGIN_ATTEMPTS,
};
