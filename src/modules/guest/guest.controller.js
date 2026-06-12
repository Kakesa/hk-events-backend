const Guest = require('./guest.model');
const Event = require('../event/event.model');

// ➕ Créer un guest
exports.createGuest = async (req, res) => {
  try {
    const guest = await Guest.create(req.body);
    res.status(201).json({ success: true, data: guest });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 📄 Guests par événement
exports.getGuestsByEvent = async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const isSuperadmin = req.user.role === 'superadmin';
    const userId = req.user.id;

    // 1. ✅ Vérifier que l'utilisateur a accès à cet événement
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Événement non trouvé'
      });
    }

    // Seul le propriétaire ou le superadmin peut voir les guests
    const isOwner = String(event.userId) === String(userId);
    if (!isOwner && !isSuperadmin) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Vous n\'avez pas le droit de voir les invités de cet événement.'
      });
    }

    // 2. Récupérer les guests
    const guests = await Guest.find({ eventId });
    res.json({ success: true, data: guests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✏️ Update (admin)
exports.updateGuest = async (req, res) => {
  try {
    const guest = await Guest.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!guest) {
      return res.status(404).json({ success: false, message: 'Guest introuvable' });
    }

    res.json({ success: true, data: guest });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 🌍 UPDATE RSVP PUBLIC
exports.updateGuestPublic = async (req, res) => {
  try {
    const allowedFields = [
      'status',
      'drinkPreference',
      'dietaryRestrictions',
      'message',
    ];

    const data = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        data[field] = req.body[field];
      }
    });

    const guest = await Guest.findByIdAndUpdate(
      req.params.id,
      {
        ...data,
        respondedAt: new Date(),
      },
      { new: true }
    );

    if (!guest) {
      return res.status(404).json({
        success: false,
        message: 'Invité introuvable',
      });
    }

    res.json({ success: true, data: guest });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// 🗑️ Supprimer
exports.deleteGuest = async (req, res) => {
  try {
    await Guest.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Guest supprimé' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
