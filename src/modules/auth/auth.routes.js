const express = require('express');
const router = express.Router();

const {
  register,
  login,
  forgotPassword,
  resetPassword,
  googleAuth,
  getAllUsers,
  getAdmins,
  updatePermissions,
  updateUser,
  impersonate,
  deleteUser,
  getSubscriptionLimits,
} = require('./auth.controller');

const {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  googleAuthValidation,
} = require('./auth.validation');
const { validate } = require('../../middlewares/validate.middleware');
const { protect } = require('../../middlewares/auth.middleware');
const { restrictTo } = require('../../middlewares/role.middleware');
const { checkPermission } = require('../../middlewares/permission.middleware');

// AUTH
router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.post('/forgot-password', forgotPasswordValidation, validate, forgotPassword);
router.post('/reset-password', resetPasswordValidation, validate, resetPassword);
router.post('/google', googleAuthValidation, validate, googleAuth);
router.get('/me', protect, (req, res) => {
  res.json({ success: true, data: req.user });
});
router.get('/subscription-limits', protect, getSubscriptionLimits);

// ✨ USERS (SUPERADMIN ONLY)
router.get(
  '/users',
  protect,
  restrictTo('superadmin'),
  getAllUsers
);

// ✨ SUPERADMIN: Get all admins
router.get(
  '/users/admins',
  protect,
  restrictTo('superadmin'),
  getAdmins
);

router.put(
  '/users/:id/permissions',
  protect,
  restrictTo('superadmin'),
  updatePermissions
);

// ✨ SUPERADMIN: Update user (for subscriptions, active status, etc.)
router.patch(
  '/users/:id',
  protect,
  restrictTo('superadmin'),
  updateUser
);

// ✨ SUPERADMIN: Impersonate user
router.post(
  '/users/impersonate/:id',
  protect,
  restrictTo('superadmin'),
  impersonate
);

router.delete(
  '/users/:id',
  protect,
  restrictTo('superadmin'),
  deleteUser
);

module.exports = router;
