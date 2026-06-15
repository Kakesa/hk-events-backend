const Invitation = require('./invitation.model');
const Guest = require('../guest/guest.model');
const Event = require('../event/event.model');
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
    const isSuperadmin = req.user.role === 'superadmin';
    const userId = req.user.id;

    // 1. ✅ Vérifier que l'utilisateur a accès à cet événement
    const Event = require('../event/event.model');
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Événement non trouvé'
      });
    }

    // Seul le propriétaire ou le superadmin peut voir les invitations
    const isOwner = String(event.userId) === String(userId);
    if (!isOwner && !isSuperadmin) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Vous n\'avez pas le droit de voir les invitations de cet événement.'
      });
    }

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
    let { guestId, method, eventId } = req.body;
    
    // Default method to 'email' if not provided
    method = method || 'email';
    
    if (!eventId) {
      return res.status(400).json({ 
        success: false, 
        message: 'L\'ID de l\'événement est requis' 
      });
    }

    const guest = await Guest.findById(guestId);
    if (!guest) {
      return res.status(404).json({ 
        success: false, 
        message: 'Invité introuvable' 
      });
    }

    // Fetch event details
    const Event = require('../event/event.model');
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: 'Événement introuvable' 
      });
    }

    if (method === 'email') {
      if (!guest.email) {
        return res.status(400).json({ 
          success: false, 
          message: 'L\'invité n\'a pas d\'adresse email' 
        });
      }

      // Generate RSVP link
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
      const rsvpLink = `${frontendUrl}/rsvp/${eventId}/${guestId}`;

      // Import email template
      const { generateInvitationEmail } = require('../../utils/email-templates');

      // Generate professional email HTML
      const emailHtml = generateInvitationEmail(
        { name: guest.name, email: guest.email },
        {
          title: event.title,
          date: event.date,
          startTime: event.startTime,
          endTime: event.endTime,
          location: event.location,
          description: event.description,
          coverImage: event.coverImage
        },
        rsvpLink
      );

      await sendEmail(
        guest.email,
        `Invitation - ${event.title}`,
        emailHtml,
        {
          recipientName: guest.name,
          eventId: eventId
        }
      );

      console.log(`✅ Email envoyé à ${guest.name} (${guest.email})`);
    } else if (method === 'whatsapp' || method === 'sms') {
      console.log(`📱 Invitation ${method} enregistrée pour ${guest.name} (${guest.phone})`);
    } else {
      console.log(`Simulation ${method} à ${guest.name} (${guest.phone || guest.email})`);
    }

    // Créer ou mettre à jour invitation
    const invitation = await Invitation.findOneAndUpdate(
      { guestId },
      { 
        sentAt: new Date(), 
        distributionMethod: method,
        eventId: eventId
      },
      { upsert: true, new: true }
    );

    res.json({ 
      success: true, 
      message: 'Invitation envoyée avec succès',
      data: invitation 
    });
  } catch (err) {
    console.error('❌ Erreur sendInvitation:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de l\'envoi de l\'invitation',
      error: err.message 
    });
  }
};

exports.sendBulkInvitations = async (req, res) => {
  try {
    let { guestIds, method, eventId, htmlContent, subject, customMessage } = req.body;
    
    // Default method to 'email' if not provided
    method = method || 'email';
    
    // Validation
    if (!guestIds || guestIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Aucun invité sélectionné' 
      });
    }

    if (!eventId) {
      return res.status(400).json({ 
        success: false, 
        message: 'L\'ID de l\'événement est requis' 
      });
    }

    // Fetch event details
    const Event = require('../event/event.model');
    const event = await Event.findById(eventId).populate('userId');
    
    if (!event) {
      return res.status(404).json({ 
        success: false, 
        message: 'Événement introuvable' 
      });
    }

    const invitations = [];
    const results = {
      total: guestIds.length,
      sent: 0,
      failed: 0,
      errors: []
    };

    const { generateInvitationEmail } = require('../../utils/email-templates');
    const { getEventTypeWithArticle } = require('../../utils/eventType');

    const replaceVariables = (text, guest, event, rsvpLink) => {
      if (!text) return text;

      const eventDate = new Date(event.date).toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const eventTypeWithArticle = getEventTypeWithArticle(event.type);

      return String(text)
        .replace(/{{eventName}}/g, event.title || '')
        .replace(/{{eventDate}}/g, eventDate)
        .replace(/{{eventLocation}}/g, event.location || '')
        .replace(/{{guestName}}/g, guest.name || '')
        .replace(/{{organizerName}}/g, event.userId?.name || "L'équipe organisatrice")
        .replace(/{{rsvpLink}}/g, rsvpLink)
        .replace(/{{eventType}}/g, event.type || 'Événement')
        .replace(/{{eventTypeWithArticle}}/g, eventTypeWithArticle)
        .replace(/{{customMessage}}/g, customMessage || '');
    };

    for (const guestId of guestIds) {
      try {
        const guest = await Guest.findById(guestId);
        if (!guest) {
          results.failed++;
          results.errors.push({ guestId, error: 'Invité introuvable' });
          continue;
        }

        if (method === 'email' && guest.email) {
          // Generate RSVP link
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
          const rsvpLink = `${frontendUrl}/rsvp/${eventId}/${guestId}`;

          let finalHtml;
          let finalSubject;

          if (htmlContent) {
            // Use custom template provided by frontend
            finalHtml = replaceVariables(htmlContent, guest, event, rsvpLink);
            finalSubject = subject ? replaceVariables(subject, guest, event, rsvpLink) : `Invitation - ${event.title}`;
          } else {
            // Use default professional template
            finalHtml = generateInvitationEmail(
              { name: guest.name, email: guest.email },
              {
                title: event.title,
                date: event.date,
                startTime: event.startTime,
                endTime: event.endTime,
                location: event.location,
                description: event.description,
                coverImage: event.coverImage
              },
              rsvpLink
            );
            finalSubject = `Invitation - ${event.title}`;
          }

          // Send email
          await sendEmail(
            guest.email,
            finalSubject,
            finalHtml,
            {
              recipientName: guest.name,
              eventId: eventId
            }
          );

          results.sent++;
          console.log(`✅ Email envoyé à ${guest.name} (${guest.email})`);
        } else if (method === 'email' && !guest.email) {
          results.failed++;
          results.errors.push({ 
            guestId, 
            name: guest.name, 
            error: 'Aucune adresse email' 
          });
          continue;
        } else {
          // Other methods (SMS, WhatsApp) - simulation
          console.log(`Simulation ${method} à ${guest.name} (${guest.phone || guest.email})`);
          results.sent++;
        }

        // Create or update invitation record
        const invitation = await Invitation.findOneAndUpdate(
          { guestId, eventId },
          { 
            sentAt: new Date(), 
            distributionMethod: method,
            eventId: eventId
          },
          { upsert: true, new: true }
        );
        invitations.push(invitation);

      } catch (error) {
        results.failed++;
        results.errors.push({ 
          guestId, 
          error: error.message 
        });
        console.error(`❌ Erreur envoi à ${guestId}:`, error.message);
      }
    }

    // Return detailed results
    res.json({ 
      success: true, 
      message: `${results.sent} invitation(s) envoyée(s) sur ${results.total}`,
      data: {
        invitations,
        stats: results
      }
    });
  } catch (err) {
    console.error('❌ Erreur sendBulkInvitations:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de l\'envoi des invitations',
      error: err.message 
    });
  }
};
