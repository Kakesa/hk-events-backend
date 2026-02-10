const express = require('express');
const router = express.Router();
const rsvpController = require('./rsvp.controller');


// Public RSVP routes (NO AUTH)
router.get('/events/:id', rsvpController.getPublicEvent);
router.get('/rsvp/:eventId/:guestId', rsvpController.getPublicRSVP);
router.post('/rsvp/:guestId', rsvpController.submitRSVP);
// Check-in QR (PUBLIC)
router.get("/checkin/:qrCode", rsvpController.checkInByQR);
router.get("/stats/:eventId", rsvpController.getLiveStats);
// Générer un QR code pour un invité
router.post('/register/:eventId', rsvpController.registerPublicGuest);

router.post('/rsvp/:guestId/generate-qr', async (req, res) => {
  try {
    const guest = await require('./guest/guest.model').findById(req.params.guestId);
    if (!guest) return res.status(404).json({ success: false, message: 'Invité introuvable' });

    const { generateQRCode } = require('../utils/qr');
    guest.qrCode = generateQRCode(guest.event.toString(), guest._id.toString());
    guest.qrGeneratedAt = new Date();
    await guest.save();

    res.json({ success: true, data: { qrCode: guest.qrCode } });
  } catch (err) {
    console.error('generateQR error:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});


module.exports = router;
