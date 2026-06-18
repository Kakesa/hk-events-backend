const express = require('express');
const router = express.Router();
const { protect } = require('../../middlewares/auth.middleware');
const { restrictTo } = require('../../middlewares/role.middleware');
const { getSettings, updateSettings } = require('./platform.controller');

router.get('/settings', protect, restrictTo('admin', 'superadmin'), getSettings);
router.patch('/settings', protect, restrictTo('superadmin'), updateSettings);

module.exports = router;
