const express = require('express');
const router = express.Router();
const { protect } = require('../../middlewares/auth.middleware');
const { restrictTo } = require('../../middlewares/role.middleware');

const {
  getOverview,
  generateTables,
  skipSetup,
  createTable,
  updateTable,
  deleteTable,
  assignGuest,
  autoDistribute,
  createGroup,
  createPresetGroups,
  updateGroup,
  deleteGroup,
  assignGuestToGroup,
  search,
  updatePositions,
  getPrintData,
} = require('./seating.controller');

router.use(protect);
router.use(restrictTo('admin', 'user', 'organizer', 'superadmin'));

router.get('/event/:eventId', getOverview);
router.get('/event/:eventId/search', search);
router.get('/event/:eventId/print', getPrintData);

router.post('/event/:eventId/generate', generateTables);
router.post('/event/:eventId/skip-setup', skipSetup);
router.post('/event/:eventId/tables', createTable);
router.post('/event/:eventId/auto-distribute', autoDistribute);
router.post('/event/:eventId/positions', updatePositions);

router.post('/event/:eventId/groups', createGroup);
router.post('/event/:eventId/groups/presets', createPresetGroups);

router.patch('/tables/:tableId', updateTable);
router.delete('/tables/:tableId', deleteTable);

router.patch('/guests/:guestId/assign', assignGuest);
router.patch('/guests/:guestId/group', assignGuestToGroup);

router.patch('/groups/:groupId', updateGroup);
router.delete('/groups/:groupId', deleteGroup);

module.exports = router;
