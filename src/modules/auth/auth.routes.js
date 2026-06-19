const express = require('express');
const router = express.Router();

const {
  register,
  login,
  forgotPassword,
  resetPassword,
  googleAuth,
  me,
  getAllUsers,
  getAdmins,
  updatePermissions,
  updateUser,
  impersonate,
  deleteUser,
  getSubscriptionLimits,
  updateProfile,
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
const upload = require('../../middlewares/upload');
const { restrictTo } = require('../../middlewares/role.middleware');
const { checkPermission } = require('../../middlewares/permission.middleware');

// AUTH
router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.post('/forgot-password', forgotPasswordValidation, validate, forgotPassword);
router.post('/reset-password', resetPasswordValidation, validate, resetPassword);
router.post('/google', googleAuthValidation, validate, googleAuth);
router.get('/me', protect, me);
router.patch('/profile', protect, upload.single('avatar'), updateProfile);
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
