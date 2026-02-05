const express = require('express');
const router = express.Router();
const rsvpController = require('./rsvp.controller');

// Public RSVP routes (NO AUTH)
router.get('/rsvp/:eventId/:guestId', rsvpController.getPublicRSVP);
router.post('/rsvp/:guestId', rsvpController.submitRSVP);

module.exports = router;
