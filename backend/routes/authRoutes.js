const express = require('express');
const {
  login,
  listLockedUsers,
  unlockUserAccount,
} = require('../controllers/authController');
const { authenticateJWT } = require('../middleware/auth');
const { requireSuperAdmin } = require('../middleware/rbac');

const router = express.Router();

router.post('/login', login);

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

module.exports = router;
