const express = require('express');
const {
  login,
  register,
  listAllUsers,
  listLockedUsers,
  unlockUserAccount,
  createCustomerAccount,
  changePassword,
  savePushToken,
} = require('../controllers/authController');
const { authenticateJWT } = require('../middleware/auth');
const { requireSuperAdmin } = require('../middleware/rbac');

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.post('/users/customer', authenticateJWT, requireSuperAdmin, createCustomerAccount);
router.put('/change-password', authenticateJWT, changePassword);
router.post('/push-token', authenticateJWT, savePushToken);

router.get('/settings', async (req, res) => {
  try {
    const Setting = require('../models/Setting');
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({ notif: true, datalog: true, emailalert: false });
    }
    return res.status(200).json(settings);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.post('/settings', async (req, res) => {
  try {
    const { notif, datalog, emailalert } = req.body;
    const Setting = require('../models/Setting');
    let settings = await Setting.findOne();
    if (!settings) {
      settings = new Setting();
    }
    if (notif !== undefined) settings.notif = notif;
    if (datalog !== undefined) settings.datalog = datalog;
    if (emailalert !== undefined) settings.emailalert = emailalert;
    await settings.save();
    return res.status(200).json(settings);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.get('/me', authenticateJWT, (req, res) => {
  return res.status(200).json({
    user: req.user,
  });
});

router.get('/admin-only', authenticateJWT, requireSuperAdmin, (req, res) => {
  return res.status(200).json({
    message: 'SuperAdmin access granted.',
    user: req.user,
  });
});

router.get(
  '/users',
  authenticateJWT,
  requireSuperAdmin,
  listAllUsers,
);

router.get(
  '/users/locked',
  authenticateJWT,
  requireSuperAdmin,
  listLockedUsers,
);

router.patch(
  '/users/:userId/unlock',
  authenticateJWT,
  requireSuperAdmin,
  unlockUserAccount,
);

// --- ADMINISTRATIVE THREAT & AUDIT LOG ENDPOINTS ---
const SecurityLog = require('../models/SecurityLog');
const User = require('../models/User');
const IpBan = require('../models/IpBan');

router.get('/logs', authenticateJWT, requireSuperAdmin, async (req, res) => {
  try {
    const logs = await SecurityLog.find({}).sort({ timestamp: -1 }).lean();
    return res.status(200).json({ count: logs.length, logs });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.delete('/logs', authenticateJWT, requireSuperAdmin, async (req, res) => {
  try {
    await SecurityLog.deleteMany({});
    
    // Log the clear action
    await SecurityLog.create({
      eventType: 'DEVICE_TRIGGERED', 
      description: `Forensic audit logs cleared by administrator ${req.user.username}.`,
      ipAddress: req.ip || null,
      timestamp: new Date()
    });
    
    return res.status(200).json({ message: 'Forensic audit logs cleared successfully.' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.post('/users/:userId/ban', authenticateJWT, requireSuperAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    user.isLocked = true;
    await user.save();
    
    // Log forensic audit
    await SecurityLog.create({
      eventType: 'USER_BANNED',
      description: `User account [${user.username}] was banned by administrator ${req.user.username}.`,
      ipAddress: req.ip || null,
      timestamp: new Date()
    });

    return res.status(200).json({ message: `User ${user.username} has been successfully banned.`, user });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.post('/users/:userId/unban', authenticateJWT, requireSuperAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    user.isLocked = false;
    user.failedLoginAttempts = 0;
    await user.save();
    
    // Log forensic audit
    await SecurityLog.create({
      eventType: 'USER_UNBANNED',
      description: `User account [${user.username}] was unbanned by administrator ${req.user.username}.`,
      ipAddress: req.ip || null,
      timestamp: new Date()
    });

    return res.status(200).json({ message: `User ${user.username} has been successfully unbanned.`, user });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.post('/ip/ban', authenticateJWT, requireSuperAdmin, async (req, res) => {
  try {
    const { ipAddress, reason } = req.body;
    if (!ipAddress) {
      return res.status(400).json({ message: 'IP Address is required.' });
    }
    const existing = await IpBan.findOne({ ipAddress });
    if (existing) {
      return res.status(409).json({ message: 'IP Address is already banned.' });
    }
    const ban = await IpBan.create({ ipAddress, reason, bannedBy: req.user.username });
    
    // Log forensic audit
    await SecurityLog.create({
      eventType: 'IP_BANNED',
      description: `IP address [${ipAddress}] was blacklisted by administrator ${req.user.username}. Reason: ${reason || 'None'}.`,
      ipAddress: req.ip || null,
      timestamp: new Date()
    });

    return res.status(201).json({ message: `IP Address ${ipAddress} successfully banned.`, ban });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

router.post('/ip/unban', authenticateJWT, requireSuperAdmin, async (req, res) => {
  try {
    const { ipAddress } = req.body;
    if (!ipAddress) {
      return res.status(400).json({ message: 'IP Address is required.' });
    }
    const result = await IpBan.findOneAndDelete({ ipAddress });
    if (!result) {
      return res.status(404).json({ message: 'IP Address is not currently banned.' });
    }

    // Log forensic audit
    await SecurityLog.create({
      eventType: 'IP_UNBANNED',
      description: `IP address [${ipAddress}] was unbanned by administrator ${req.user.username}.`,
      ipAddress: req.ip || null,
      timestamp: new Date()
    });

    return res.status(200).json({ message: `IP Address ${ipAddress} successfully unbanned.` });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;
