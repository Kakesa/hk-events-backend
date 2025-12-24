const Guest = require('./guest.model');

// ==================== GUEST CONTROLLER ====================

// Créer un guest
exports.createGuest = async (req, res) => {
  console.log('POST /api/guests reçu', req.body)
  try {
    const guest = await Guest.create(req.body);
    res.status(201).json({ success: true, data: guest });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Récupérer tous les guests d'un événement
exports.getGuestsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const guests = await Guest.find({ eventId });
    res.json({ success: true, data: guests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Mettre à jour un guest
exports.updateGuest = async (req, res) => {
  try {
    const { id } = req.params;
    const guest = await Guest.findByIdAndUpdate(id, req.body, { new: true });
    if (!guest) return res.status(404).json({ success: false, message: 'Guest not found' });
    res.json({ success: true, data: guest });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Supprimer un guest
exports.deleteGuest = async (req, res) => {
  try {
    const { id } = req.params;
    await Guest.findByIdAndDelete(id);
    res.json({ success: true, message: 'Guest deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
