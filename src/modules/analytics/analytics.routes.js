const express = require('express');
const router = express.Router();
const User = require('../users/users.model');
const Event = require('../event/event.model');
const Guest = require('../guest/guest.model');
const { protect } = require('../../middlewares/auth.middleware');
const { restrictTo } = require('../../middlewares/role.middleware');

router.get('/overview', protect, restrictTo('superadmin'), async (req, res) => {
  try {
    const [totalUsers, totalEvents, totalGuests, totalConfirmed, upcomingEvents] = await Promise.all([
      User.countDocuments(),
      Event.countDocuments(),
      Guest.countDocuments(),
      Guest.countDocuments({ status: 'confirmed' }),
      Event.countDocuments({ date: { $gte: new Date() } }),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalEvents,
        totalGuests,
        totalConfirmed,
        upcomingEvents,
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ success: false, message: 'Erreur analytics' });
  }
});

module.exports = router;
