const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../../middlewares/auth.middleware');
const { restrictTo } = require('../../middlewares/role.middleware');
const { checkPermission } = require('../../middlewares/permission.middleware');
const {
  searchInvitations,
  checkInGuest,
  checkInByQrToken,
} = require('./checkin.controller');

router.use(protect);
router.use(restrictTo('admin', 'user', 'organizer', 'superadmin'));

router.get(
  '/search',
  checkPermission('guests', 'read'),
  searchInvitations,
);

router.post(
  '/check-in/qr',
  checkPermission('guests', 'update'),
  checkInByQrToken,
);

router.post(
  '/:guestId/check-in',
  checkPermission('guests', 'update'),
  checkInGuest,
);

module.exports = router;
