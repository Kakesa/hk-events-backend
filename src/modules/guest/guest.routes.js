const express = require('express');
const router = express.Router();
const { protect } = require('../../middlewares/auth.middleware');

const {
  createGuest,
  getGuestsByEvent,
  updateGuest,
  deleteGuest,
  updateGuestPublic,
} = require('./guest.controller');

// 🌍 PUBLIC RSVP (SANS AUTH) - Avant la protection
router.patch('/public/:id', updateGuestPublic);

// 🔐 Admin / dashboard (protégé)
router.use(protect);
router.post('/', createGuest);
router.get('/event/:eventId', getGuestsByEvent);
router.patch('/:id', updateGuest);
router.delete('/:id', deleteGuest);

module.exports = router;
