const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const SecurityLog = require('../models/SecurityLog');
const { sendSecurityAlert } = require('../utils/emailAlert');
const { sendPushNotification } = require('../utils/pushNotification');

const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const REGISTRABLE_ROLES = Object.freeze({
  customer: 'HomeOwner',
  guest: 'Guest',
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

      return res.status(403).json({
        message: 'Account is locked. Please contact an administrator.',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      const wasLockedBeforeAttempt = user.isLocked;
      
      if (user.role !== 'SuperAdmin') {
        user.failedLoginAttempts += 1;

        if (user.failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS) {
          user.isLocked = true;
        }
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

        // Push notification trigger
        try {
          const admins = await User.find({ role: { $in: ['admin', 'SuperAdmin'] } });
          const tokens = admins.reduce((acc, curr) => acc.concat(curr.expoPushTokens || []), []);
          if (tokens.length > 0) {
            await sendPushNotification(
              tokens,
              '⚠️ Security Alert',
              `Account ${user.username} has been locked.`
            );
          }
        } catch (pushErr) {
          console.error('[Push Notification Error] Failed to send lock alert:', pushErr);
        }
      }

      return res.status(user.isLocked ? 403 : 401).json({
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

async function register(req, res) {
  const {
    username,
    email,
    password,
    confirmPassword,
    role,
  } = req.body || {};

  const normalizedUsername = String(username || '').trim().toLowerCase();
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedRole = String(role || 'customer').trim().toLowerCase();
  const mappedRole = REGISTRABLE_ROLES[normalizedRole];

  if (!normalizedUsername || !normalizedEmail || !password || !confirmPassword) {
    return res.status(400).json({
      message: 'username, email, password, and confirmPassword are required.',
    });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({
      message: 'Passwords do not match.',
    });
  }

  if (!mappedRole) {
    return res.status(400).json({
      message: 'Role must be either customer or guest.',
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      message: 'Password must be at least 8 characters long.',
    });
  }

  try {
    const existingUser = await User.findOne({
      $or: [
        { username: normalizedUsername },
        { email: normalizedEmail },
      ],
    }).lean();

    if (existingUser) {
      return res.status(409).json({
        message: existingUser.username === normalizedUsername
          ? 'Username already exists.'
          : 'Email already exists.',
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      username: normalizedUsername,
      email: normalizedEmail,
      passwordHash,
      role: mappedRole,
      failedLoginAttempts: 0,
      isLocked: false,
      lastLoginIP: null,
    });

    return res.status(201).json({
      message: `${normalizedRole === 'guest' ? 'Guest' : 'Customer'} account created successfully.`,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Register error:', error);

    return res.status(500).json({
      message: 'Unable to create account.',
    });
  }
}

async function createCustomerAccount(req, res) {
  const { username, email, password, role } = req.body || {};
  const normalizedUsername = String(username || '').trim().toLowerCase();
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedRole = String(role || 'customer').trim().toLowerCase();
  const mappedRole = REGISTRABLE_ROLES[normalizedRole];

  if (!normalizedUsername || !normalizedEmail || !password || !mappedRole) {
    return res.status(400).json({ message: 'Invalid or missing fields.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
  }

  try {
    const existingUser = await User.findOne({
      $or: [{ username: normalizedUsername }, { email: normalizedEmail }],
    }).lean();

    if (existingUser) {
      return res.status(409).json({ message: 'Username or email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      username: normalizedUsername,
      email: normalizedEmail,
      passwordHash,
      role: mappedRole,
      failedLoginAttempts: 0,
      isLocked: false,
      lastLoginIP: null,
    });

    return res.status(201).json({
      message: 'Customer account created successfully.',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Create customer account error:', error);
    return res.status(500).json({ message: 'Unable to create account.' });
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

async function listAllUsers(_req, res) {
  try {
    const users = await User.find({})
      .select('_id username email role isLocked failedLoginAttempts lastLoginIP')
      .sort({ updatedAt: -1 })
      .lean();

    return res.status(200).json({
      count: users.length,
      users,
    });
  } catch (error) {
    console.error('List all users error:', error);

    return res.status(500).json({
      message: 'Unable to fetch users.',
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

async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body || {};
  const userId = req.user?.id || req.user?.sub;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current and new password are required.' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ message: 'New password must be at least 8 characters long.' });
  }

  try {
    const user = await User.findById(userId).select('+passwordHash');
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid current password.' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();

    await writeSecurityEvent({
      eventType: 'PASSWORD_CHANGED',
      description: `Password changed for user ${user.username}`,
      ipAddress: getClientIp(req),
    });

    return res.status(200).json({ message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ message: 'Unable to change password.' });
  }
}

async function savePushToken(req, res) {
  const { token } = req.body || {};
  const userId = req.user?.id || req.user?.sub;

  if (!token) {
    return res.status(400).json({ message: 'Push token is required.' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (!user.expoPushTokens) {
      user.expoPushTokens = [];
    }

    if (!user.expoPushTokens.includes(token)) {
      user.expoPushTokens.push(token);
      await user.save();
    }

    return res.status(200).json({ message: 'Push token saved successfully.' });
  } catch (error) {
    console.error('Save push token error:', error);
    return res.status(500).json({ message: 'Unable to save push token.' });
  }
}

module.exports = {
  login,
  register,
  listAllUsers,
  listLockedUsers,
  unlockUserAccount,
  createCustomerAccount,
  changePassword,
  savePushToken,
  MAX_FAILED_LOGIN_ATTEMPTS,
};
