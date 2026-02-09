const express = require('express');
const router = express.Router();
const emailController = require('./email.controller');
const { sendBulkInvitations } = require('../invitation/invitation.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { restrictTo } = require('../../middlewares/role.middleware');

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

// Envoi en masse d'invitations
router.post('/invitation/bulk', protect, restrictTo('admin', 'superadmin'), async (req, res, next) => {
  try {
    await sendBulkInvitations(req, res, next);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
