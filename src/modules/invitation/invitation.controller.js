const Invitation = require('./invitation.model');
const Guest = require('../guest/guest.model');


// Créer une invitation
exports.createInvitation = async (req, res) => {
  try {
    const invitation = await Invitation.create(req.body);
    res.status(201).json({ success: true, data: invitation });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Récupérer toutes les invitations d'un événement
exports.getInvitationsByEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const invitations = await Invitation.find({ eventId }).populate('guestId');
    res.json({ success: true, data: invitations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Marquer une invitation comme envoyée
exports.markSent = async (req, res) => {
  try {
    const { id } = req.params;
    const invitation = await Invitation.findByIdAndUpdate(
      id,
      { sentAt: new Date() },
      { new: true }
    );
    if (!invitation) return res.status(404).json({ success: false, message: 'Invitation not found' });
    res.json({ success: true, data: invitation });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// Supprimer une invitation
exports.deleteInvitation = async (req, res) => {
  try {
    const { id } = req.params;
    await Invitation.findByIdAndDelete(id);
    res.json({ success: true, message: 'Invitation deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
