const mongoose = require("mongoose");
const Event = require("../event/event.model");
const Guest = require("../guest/guest.model");
const { generateQRCode, parseScanToken, ensureGuestQrCode } = require("../../utils/qr");
const { getEventEndDateTime } = require("../../utils/eventTime");
const eventService = require("../event/event.service");

/* =====================================================
   GET PUBLIC RSVP (EVENT + GUEST + AUTO QR)
   GET /api/public/rsvp/:eventId/:guestId
===================================================== */
exports.getPublicRSVP = async (req, res) => {
  try {
    const { eventId, guestId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId) || !mongoose.Types.ObjectId.isValid(guestId)) {
      return res.status(400).json({
        success: false,
        message: "ID invalide",
      });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Événement introuvable",
      });
    }

    const guest = await Guest.findOne({ _id: guestId, eventId: eventId });
    if (!guest) {
      return res.status(404).json({
        success: false,
        message: "Invitation introuvable",
      });
    }

    // QR uniquement pour invités confirmés
    if (guest.status === "confirmed") {
      await ensureGuestQrCode(guest);
    }

    res.json({
      success: true,
      data: {
        event: {
          id: event._id,
          title: event.title,
          type: event.type,
          description: event.description,
          date: event.date,
          startTime: event.startTime,
          endTime: event.endTime,
          location: event.location,
          coverImage: event.coverImage,
          primaryColor: event.primaryColor,
          accentColor: event.accentColor,
        },
        guest: {
          id: guest._id,
          name: guest.name,
          email: guest.email,
          status: guest.status,
          drinkPreference: guest.drinkPreference,
          dietaryRestrictions: guest.dietaryRestrictions,
          message: guest.message,
          qrCode: guest.status === "confirmed" ? guest.qrCode : undefined,
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

    if (!mongoose.Types.ObjectId.isValid(guestId)) {
      return res.status(400).json({
        success: false,
        message: "ID invité invalide",
      });
    }

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

    if (status === "confirmed") {
      await ensureGuestQrCode(guest);
    }

    await guest.save();

    // Synchroniser le message dans le livre d'or de l'événement
    if (message?.trim()) {
      const event = await Event.findById(guest.eventId);
      if (event) {
        const existing = event.guestbook.find(
          (e) => e.guestName === guest.name,
        );
        if (existing) {
          existing.message = message.trim();
        } else {
          event.guestbook.push({
            guestName: guest.name,
            message: message.trim(),
          });
        }
        await event.save();
      }
    }

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
    const token = parseScanToken(req.params.qrCode);

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "QR code invalide",
      });
    }

    let guest = await Guest.findOne({ qrCode: token }).populate("eventId");

    // Compatibilité : anciens QR contenant seulement l'ID invité
    if (!guest && mongoose.Types.ObjectId.isValid(token)) {
      guest = await Guest.findById(token).populate("eventId");
      if (guest?.status === "confirmed") {
        await ensureGuestQrCode(guest);
      }
    }

    if (!guest) {
      return res.status(404).json({
        success: false,
        message: "QR code invalide",
      });
    }

    // ⛔ QR expiré après l'événement
    const eventEnd = getEventEndDateTime(guest.eventId);
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
          id: guest.eventId._id,
          title: guest.eventId.title,
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

    const guests = await Guest.find({ eventId: eventId });
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

/* =====================================================
   REGISTER PUBLIC GUEST (NO INVITE LINK)
   POST /api/public/register/:eventId
===================================================== */
exports.registerPublicGuest = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { name, email, status = "pending", drinkPreference, dietaryRestrictions, message, plusOne, plusOneName } = req.body;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ success: false, message: "ID événement invalide" });
    }

    if (!name || !email) {
      return res.status(400).json({ success: false, message: "Nom et email requis" });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: "Événement introuvable" });
    }

    // Check existing email for this event
    let guest = await Guest.findOne({ eventId: eventId, email: email.toLowerCase() });

    if (guest) {
      // Update existing
      guest.status = status;
      guest.drinkPreference = drinkPreference;
      guest.dietaryRestrictions = dietaryRestrictions;
      guest.message = message;
      guest.plusOne = plusOne;
      guest.plusOneName = plusOneName;
      guest.respondedAt = new Date();
    } else {
      // Create new
      guest = new Guest({
        eventId: eventId,
        name,
        email: email.toLowerCase(),
        status,
        drinkPreference,
        dietaryRestrictions,
        message,
        plusOne,
        plusOneName,
        respondedAt: new Date(),
        distributionMethod: 'link', // Self-registered
      });
    }

    if (status === "confirmed") {
      await ensureGuestQrCode(guest);
    } else {
      await guest.save();
    }

    if (status !== "confirmed") {
      await guest.save();
    }

    // Synchroniser le message dans le livre d'or de l'événement
    if (message?.trim()) {
      const existing = event.guestbook.find(
        (e) => e.guestName === guest.name,
      );
      if (existing) {
        existing.message = message.trim();
      } else {
        event.guestbook.push({
          guestName: guest.name,
          message: message.trim(),
        });
      }
      await event.save();
    }

    res.status(201).json({
      success: true,
      message: "Inscription confirmée",
      data: guest,
    });

  } catch (err) {
    console.error("registerPublicGuest error:", err);
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};
