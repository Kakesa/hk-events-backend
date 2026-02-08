const express = require('express');
const router = express.Router();
const activityController = require('./activity.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { restrictTo } = require('../../middlewares/role.middleware');

/* =====================================================
   ROUTES
===================================================== */
// 1. Activités Récentes (Superadmin only for now)
router.get('/recent', protect, restrictTo('superadmin'), (req, res, next) => {
  try {
    activityController.getRecentActivities(req, res, next);
  } catch (err) {
    next(err);
  }
});

// 2. Activités par Événement
router.get('/event/:eventId', protect, (req, res, next) => {
  try {
    activityController.getActivitiesByEvent(req, res, next);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
