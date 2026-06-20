const express = require('express');
const router = express.Router();
const { protect } = require('../../middlewares/auth.middleware');
const { restrictTo } = require('../../middlewares/role.middleware');
const { getSettings, updateSettings, getPurgePreviewHandler, purgeTestDataHandler } = require('./platform.controller');

router.get('/settings', protect, restrictTo('admin', 'superadmin'), getSettings);
router.patch('/settings', protect, restrictTo('superadmin'), updateSettings);
router.get('/purge-preview', protect, restrictTo('superadmin'), getPurgePreviewHandler);
router.post('/purge-test-data', protect, restrictTo('superadmin'), purgeTestDataHandler);

module.exports = router;
