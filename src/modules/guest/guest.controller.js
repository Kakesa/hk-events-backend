const Guest = require('./guest.model');
const Event = require('../event/event.model');
const { normalizePhoneToE164 } = require('../../utils/phone');
const { assertCanAddGuest } = require('../../utils/subscriptionLimits');

const sanitizeGuestPayload = (payload = {}) => {
  const data = { ...payload };

  if (data.phone !== undefined && data.phone !== null && String(data.phone).trim()) {
    const normalized = normalizePhoneToE164(data.phone);
    if (!normalized) {
      const error = new Error(
        'Numéro de téléphone invalide. Utilisez le format +243XXXXXXXXX'
      );
      error.statusCode = 400;
      throw error;
    }
    data.phone = normalized;
  } else if (data.phone === '') {
    data.phone = undefined;
  }

  return data;
};

// ➕ Créer un guest
exports.createGuest = async (req, res) => {
  try {
    const eventId = req.body.eventId;
    if (!eventId) {
      return res.status(400).json({ success: false, message: 'eventId requis' });
    }

    if (req.user.role !== 'superadmin') {
      await assertCanAddGuest(req.user, eventId);
    }

    const guest = await Guest.create(sanitizeGuestPayload(req.body));
    res.status(201).json({ success: true, data: guest });
  } catch (err) {
    res.status(err.statusCode || 400).json({ success: false, message: err.message, code: err.code });
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
    const guests = await Guest.find({ eventId }).sort({ createdAt: -1 });
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
      sanitizeGuestPayload(req.body),
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
