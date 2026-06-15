const express = require('express');
const router = express.Router();
const User = require('../users/users.model');
const Event = require('../event/event.model');
const Guest = require('../guest/guest.model');
const paymentService = require('../payment/payment.service');
const visitorService = require('./visitor.service');
const { protect } = require('../../middlewares/auth.middleware');
const { restrictTo } = require('../../middlewares/role.middleware');

router.get('/overview', protect, restrictTo('superadmin'), async (req, res) => {
  try {
    const [totalUsers, totalEvents, totalGuests, totalConfirmed, upcomingEvents, monthlyRevenue] = await Promise.all([
      User.countDocuments(),
      Event.countDocuments(),
      Guest.countDocuments(),
      Guest.countDocuments({ status: 'confirmed' }),
      Event.countDocuments({ date: { $gte: new Date() } }),
      paymentService.getMonthlyRevenue(),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalEvents,
        totalGuests,
        totalConfirmed,
        upcomingEvents,
        monthlyRevenue,
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ success: false, message: 'Erreur analytics' });
  }
});

router.post('/visit', async (req, res) => {
  try {
    const { visitorId, path, referrer } = req.body || {};
    if (!visitorId || typeof visitorId !== 'string') {
      return res.status(400).json({ success: false, message: 'visitorId requis' });
    }

    await visitorService.recordVisit({ visitorId, path, referrer });
    res.json({ success: true });
  } catch (error) {
    console.error('Error recording visit:', error);
    res.status(500).json({ success: false, message: 'Erreur enregistrement visite' });
  }
});

router.get('/visitors', protect, restrictTo('superadmin'), async (req, res) => {
  try {
    const period = req.query.period || 'week';
    const allowed = ['day', 'week', 'month', 'year'];
    if (!allowed.includes(period)) {
      return res.status(400).json({ success: false, message: 'Période invalide' });
    }

    const data = await visitorService.getVisitorStats(period);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching visitor stats:', error);
    res.status(500).json({ success: false, message: 'Erreur statistiques visiteurs' });
  }
});

module.exports = router;
