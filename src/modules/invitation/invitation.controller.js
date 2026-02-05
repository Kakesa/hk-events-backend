const Invitation = require('./invitation.model');
const Guest = require('../guest/guest.model');
const { sendEmail } = require('../../services/email.service');

// ==================== CRUD DE BASE ====================

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
      { sentAt: new Date(), status: 'sent' },
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

// ==================== ENVOI INVITATIONS ====================

// Fonction pour simuler l'envoi (à remplacer par email / WhatsApp / SMS réel)
const sendMessage = async (guest, method) => {
  console.log(`Envoi ${method} à ${guest.name} (${guest.email || guest.phone})`);
  // Intégrer ton vrai service ici
  return true;
};

// Envoi à un invité
exports.sendInvitation = async (req, res) => {
  try {
    const { guestId, method } = req.body;
    const guest = await Guest.findById(guestId);
    if (!guest) return res.status(404).json({ success: false, message: 'Guest not found' });

    if (method === 'email') {
      if (!guest.email) return res.status(400).json({ success: false, message: 'Guest has no email' });

      await sendEmail(
        guest.email,
        'Invitation à votre événement',
        `<p>Bonjour ${guest.name},</p><p>Vous êtes invité à notre événement !</p>`
      );
    } else {
      console.log(`Simulation ${method} à ${guest.name} (${guest.phone || guest.email})`);
    }

    // Créer ou mettre à jour invitation
    const invitation = await Invitation.findOneAndUpdate(
      { guestId },
      { sentAt: new Date(), distributionMethod: method },
      { upsert: true, new: true }
    );

    res.json({ success: true, data: invitation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.sendBulkInvitations = async (req, res) => {
  try {
    const { guestIds, method } = req.body;
    if (!guestIds || guestIds.length === 0)
      return res.status(400).json({ success: false, message: 'Aucun invité sélectionné' });

    const invitations = [];

    for (const guestId of guestIds) {
      const guest = await Guest.findById(guestId);
      if (!guest) continue;

      if (method === 'email' && guest.email) {
        await sendEmail(
          guest.email,
          'Invitation à votre événement',
          `<p>Bonjour ${guest.name},</p><p>Vous êtes invité à notre événement !</p>`
        );
      } else {
        console.log(`Simulation ${method} à ${guest.name} (${guest.phone || guest.email})`);
      }

      const invitation = await Invitation.findOneAndUpdate(
        { guestId },
        { sentAt: new Date(), distributionMethod: method },
        { upsert: true, new: true }
      );
      invitations.push(invitation);
    }

    res.json({ success: true, data: invitations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};
