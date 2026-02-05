const Event = require('../event/event.model');
const Guest = require('../guest/guest.model');

/* =====================================================
   GET PUBLIC RSVP (EVENT + GUEST)
   GET /api/public/rsvp/:eventId/:guestId
===================================================== */
exports.getPublicRSVP = async (req, res) => {
  try {
    const { eventId, guestId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Événement introuvable' });
    }

    const guest = await Guest.findOne({ _id: guestId, event: eventId });
    if (!guest) {
      return res.status(404).json({ success: false, message: 'Invitation invalide' });
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
          dateFormatted: event.date
            ? new Date(event.date).toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })
            : null,
        },
        guest: {
          id: guest._id,
          name: guest.name,
          email: guest.email,
          status: guest.status,
          drinkPreference: guest.drinkPreference,
          dietaryRestrictions: guest.dietaryRestrictions,
          message: guest.message,
        },
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

/* =====================================================
   SUBMIT RSVP
   POST /api/public/rsvp/:guestId
===================================================== */
exports.submitRSVP = async (req, res) => {
  try {
    const { guestId } = req.params;
    const {
      status,
      drinkPreference,
      dietaryRestrictions,
      message,
    } = req.body;

    const guest = await Guest.findById(guestId);
    if (!guest) {
      return res.status(404).json({ success: false, message: 'Invité introuvable' });
    }

    guest.status = status;
    guest.drinkPreference = drinkPreference || '';
    guest.dietaryRestrictions = dietaryRestrictions || '';
    guest.message = message || '';
    guest.respondedAt = new Date();

    await guest.save();

    res.json({
      success: true,
      message: 'RSVP enregistré',
      data: guest,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};
