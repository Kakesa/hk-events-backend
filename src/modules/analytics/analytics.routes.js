const express = require('express');
const router = express.Router();

router.get('/overview', async (req, res) => {
  try {
    res.json({
      totalEvents: 0,
      totalGuests: 0,
      totalConfirmed: 0,
      upcomingEvents: 0,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur analytics' });
  }
});

module.exports = router;
