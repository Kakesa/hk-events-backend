const express = require('express');
const router = express.Router();

const {
  register,
  login,
  getAllUsers,
  updatePermissions,
  deleteUser,
} = require('./auth.controller');

const { protect } = require('../../middlewares/auth.middleware');
const { restrictTo } = require('../../middlewares/role.middleware');

const { registerValidation, loginValidation } = require('./auth.validation');
const { validate } = require('../../middlewares/validate.middleware');

// AUTH PUBLIC
router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);

// 🔐 ADMIN ONLY
router.use(protect);
router.use(restrictTo('admin'));

router.get('/users', getAllUsers);
router.put('/users/:id/permissions', updatePermissions);
router.delete('/users/:id', deleteUser);

module.exports = router;
