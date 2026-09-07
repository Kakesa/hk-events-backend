const express = require('express');
const router = express.Router();
const { protect } = require('../../middlewares/auth.middleware');
const { restrictTo } = require('../../middlewares/role.middleware');
const {
  listByEvent,
  create,
  getById,
  update,
  remove,
  duplicate,
  reorder,
  syncFromTables,
} = require('./marque-table.controller');

router.use(protect);
router.use(restrictTo('admin', 'user', 'organizer', 'superadmin'));

router.get('/event/:eventId', listByEvent);
router.post('/event/:eventId', create);
router.post('/event/:eventId/sync-from-tables', syncFromTables);
router.patch('/event/:eventId/reorder', reorder);

router.get('/:id', getById);
router.patch('/:id', update);
router.delete('/:id', remove);
router.post('/:id/duplicate', duplicate);

module.exports = router;
