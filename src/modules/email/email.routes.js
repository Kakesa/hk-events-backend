const express = require('express');
const router = express.Router();
const emailController = require('./email.controller');
const { protect, restrictTo } = require('../../middlewares/auth.middleware');

/* =====================================================
   ROUTES (/api/emails)
===================================================== */

// Logs & Historique
router.get('/history', protect, restrictTo('admin', 'superadmin'), async (req, res, next) => {
  try {
    emailController.getEmailLogs(req, res, next);
  } catch (err) {
    next(err);
  }
});

// Analytics
router.get('/analytics', protect, restrictTo('admin', 'superadmin'), async (req, res, next) => {
  try {
    emailController.getEmailAnalytics(req, res, next);
  } catch (err) {
    next(err);
  }
});

// Renvoyer un email
router.post('/history/:id/resend', protect, restrictTo('admin', 'superadmin'), async (req, res, next) => {
  try {
    emailController.resendEmail(req, res, next);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
