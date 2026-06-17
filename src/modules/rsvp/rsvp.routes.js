const express = require('express');
const router = express.Router();
const rsvpController = require('./rsvp.controller');


// Public RSVP routes (NO AUTH)
router.get('/events/:id', rsvpController.getPublicEvent);
router.get('/rsvp/:eventId/:guestId', rsvpController.getPublicRSVP);
router.post('/rsvp/:guestId', rsvpController.submitRSVP);
router.post('/rsvp/:guestId/generate-qr', rsvpController.generateGuestQr);
router.get("/checkin/:qrCode", rsvpController.checkInByQR);
router.get("/stats/:eventId", rsvpController.getLiveStats);
router.post('/register/:eventId', rsvpController.registerPublicGuest);

module.exports = router;
