const Event = require("../event/event.model");
const Guest = require("../guest/guest.model");
const { generateQRCode } = require("../../utils/qr");
const { getEventEndDateTime } = require("../../utils/eventTime");
const eventService = require("../event/event.service");

/* =====================================================
   GET PUBLIC RSVP (EVENT + GUEST + AUTO QR)
   GET /api/public/rsvp/:eventId/:guestId
===================================================== */
exports.getPublicRSVP = async (req, res) => {
  try {
    const { eventId, guestId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Événement introuvable",
      });
    }

    const guest = await Guest.findOne({ _id: guestId, event: eventId });
    if (!guest) {
      return res.status(404).json({
        success: false,
        message: "Invitation introuvable",
      });
    }

    // 🎯 Génération automatique du QR
    if (!guest.qrCode) {
      guest.qrCode = generateQRCode(eventId, guestId);
      guest.qrGeneratedAt = new Date();
      await guest.save();
    }

    res.json({
      success: true,
      data: {
        event: {
          id: event._id,
          title: event.title,
          description: event.description,
          date: event.date,
          startTime: event.startTime,
          endTime: event.endTime,
          location: event.location,
          coverImage: event.coverImage,
        },
        guest: {
          id: guest._id,
          name: guest.name,
          email: guest.email,
          status: guest.status,
          drinkPreference: guest.drinkPreference,
          dietaryRestrictions: guest.dietaryRestrictions,
          message: guest.message,
          qrCode: guest.qrCode,
        },
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

/* =====================================================
   GET EVENT PUBLIC (JUST ID)
   GET /api/public/events/:id
===================================================== */
exports.getPublicEvent = async (req, res, next) => {
  try {
    const event = await eventService.getEventPublicById(req.params.id);
    res.json({
      success: true,
      data: event,
    });
  } catch (err) {
    next(err);
  }
};

/* =====================================================
   SUBMIT RSVP
   POST /api/public/rsvp/:guestId
===================================================== */
exports.submitRSVP = async (req, res) => {
  try {
    const { guestId } = req.params;
    const { status, drinkPreference, dietaryRestrictions, message } = req.body;

    const guest = await Guest.findById(guestId);
    if (!guest) {
      return res.status(404).json({
        success: false,
        message: "Invité introuvable",
      });
    }

    guest.status = status;
    guest.drinkPreference = drinkPreference || "";
    guest.dietaryRestrictions = dietaryRestrictions || "";
    guest.message = message || "";
    guest.respondedAt = new Date();

    // 🔐 QR généré uniquement si confirmé
    if (status === "confirmed" && !guest.qrCode) {
      guest.qrCode = generateQRCode(guest.event.toString(), guestId);
      guest.qrGeneratedAt = new Date();
    }

    await guest.save();

    res.json({
      success: true,
      message: "RSVP enregistré",
      data: guest,
    });
  } catch (err) {
    console.error("submitRSVP error:", err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

/* =====================================================
   CHECK-IN VIA QR CODE
   GET /api/public/checkin/:qrCode
===================================================== */
exports.checkInByQR = async (req, res) => {
  try {
    const { qrCode } = req.params;

    const guest = await Guest.findOne({ qrCode }).populate("event");
    if (!guest) {
      return res.status(404).json({
        success: false,
        message: "QR code invalide",
      });
    }

    // ⛔ QR expiré après l'événement
    const eventEnd = getEventEndDateTime(guest.event);
    if (eventEnd && new Date() > eventEnd) {
      return res.status(403).json({
        success: false,
        message: "QR code expiré – événement terminé",
      });
    }

    // ⛔ Invité non confirmé
    if (guest.status !== "confirmed") {
      return res.status(403).json({
        success: false,
        message: "Invité non confirmé",
      });
    }

    // 🚫 Déjà check-in
    if (guest.checkedIn) {
      return res.status(400).json({
        success: false,
        message: "Invité déjà enregistré",
        data: {
          checkedInAt: guest.checkedInAt,
        },
      });
    }

    // ✅ Check-in
    guest.checkedIn = true;
    guest.checkedInAt = new Date();
    await guest.save();

    res.json({
      success: true,
      message: "Check-in validé",
      data: {
        guest: {
          id: guest._id,
          name: guest.name,
          checkedInAt: guest.checkedInAt,
        },
        event: {
          id: guest.event._id,
          title: guest.event.title,
        },
      },
    });
  } catch (err) {
    console.error("checkInByQR error:", err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

/* =====================================================
   LIVE EVENT STATS
   GET /api/public/stats/:eventId
===================================================== */
exports.getLiveStats = async (req, res) => {
  try {
    const { eventId } = req.params;

    const guests = await Guest.find({ event: eventId });
    if (!guests.length) {
      return res.status(404).json({
        success: false,
        message: "Aucun invité trouvé",
      });
    }

    const stats = {
      totalInvites: guests.length,
      confirmed: guests.filter(g => g.status === "confirmed").length,
      declined: guests.filter(g => g.status === "declined").length,
      pending: guests.filter(g => g.status === "pending").length,
      checkedIn: guests.filter(g => g.checkedIn).length,
    };

    stats.remaining = stats.confirmed - stats.checkedIn;
    stats.checkInRate = stats.confirmed
      ? Math.round((stats.checkedIn / stats.confirmed) * 100)
      : 0;

    res.json({ success: true, data: stats });
  } catch (err) {
    console.error("getLiveStats error:", err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};
