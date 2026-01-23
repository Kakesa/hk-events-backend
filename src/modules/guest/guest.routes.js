const express = require('express');
const router = express.Router();

const {
  createGuest,
  getGuestsByEvent,
  updateGuest,
  deleteGuest,
  updateGuestPublic,
} = require('./guest.controller');

// 🔐 Admin / dashboard
router.post('/', createGuest);
router.get('/event/:eventId', getGuestsByEvent);
router.patch('/:id', updateGuest);
router.delete('/:id', deleteGuest);

// 🌍 PUBLIC RSVP (SANS AUTH)
router.patch('/public/:id', updateGuestPublic);

module.exports = router;
