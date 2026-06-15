const EmailLog = require('./email.model');
const { sendEmail } = require('../../services/email.service');
const Event = require('../event/event.model');
const Guest = require('../guest/guest.model');
const User = require('../users/users.model');

// ==================== GET Logs ====================
exports.getEmailLogs = async (req, res, next) => {
  try {
    const { eventId, limit = 20, page = 1 } = req.query;
    const query = eventId ? { eventId } : {};

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      EmailLog.find(query).sort({ sentAt: -1 }).skip(skip).limit(parseInt(limit)),
      EmailLog.countDocuments(query),
    ]);

    // Mapping pour le frontend
    const data = logs.map(log => ({
      id: log._id,
      recipientEmail: log.recipientEmail,
      recipientName: log.recipientName,
      subject: log.subject,
      status: log.status,
      sentAt: log.sentAt,
      eventId: log.eventId,
    }));

    res.json({
      success: true,
      data,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ==================== GET Analytics ====================
exports.getEmailAnalytics = async (req, res, next) => {
  try {
    const { eventId } = req.query;
    const query = eventId ? { eventId } : {};

    const [totalSent, delivered, failed, opened, clicked, bounced] = await Promise.all([
      EmailLog.countDocuments(query),
      EmailLog.countDocuments({ ...query, status: 'delivered' }),
      EmailLog.countDocuments({ ...query, status: 'failed' }),
      EmailLog.countDocuments({ ...query, status: 'opened' }),
      EmailLog.countDocuments({ ...query, status: 'clicked' }),
      EmailLog.countDocuments({ ...query, status: 'bounced' }),
    ]);

    const realDelivered = Math.max(totalSent - failed, 0);

    const deliveryRate = totalSent > 0 ? (realDelivered / totalSent) * 100 : 0;
    const openRate = realDelivered > 0 ? (opened / realDelivered) * 100 : 0;
    const clickRate = opened > 0 ? (clicked / opened) * 100 : 0;
    const bounceRate = totalSent > 0 ? (bounced / totalSent) * 100 : 0;

    res.json({
      success: true,
      data: {
        totalSent,
        totalDelivered: realDelivered,
        totalOpened: opened,
        totalClicked: clicked,
        totalBounced: bounced,
        totalFailed: failed,
        deliveryRate,
        openRate,
        clickRate,
        bounceRate,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ==================== RESEND (Stub) ====================
exports.resendEmail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const log = await EmailLog.findById(id);
    if (!log) return res.status(404).json({ message: 'Email log not found' });

    // TODO: Appel au service d'envoi ici (avec import du shared service)
    // const result = await sendEmail(log.recipientEmail, log.subject, log.content);

    // Simulation succès
    log.status = 'sent';
    log.sentAt = new Date();
    await log.save();

    res.json({ success: true, message: 'Email renvoyé', data: { status: 'sent' } });
  } catch (err) {
    next(err);
  }
};

// ==================== NOTIFY ORGANIZER ====================
exports.sendOrganizerNotification = async (req, res, next) => {
  try {
    const { guestId, eventId, status } = req.body;

    if (!guestId || !eventId || !status) {
      return res.status(400).json({ success: false, message: 'Données incomplètes' });
    }

    // 1. Récupérer l'événement et l'organisateur
    const event = await Event.findById(eventId).populate('userId');
    if (!event || !event.userId) {
      return res.status(404).json({ success: false, message: 'Événement ou organisateur introuvable' });
    }

    const organizer = event.userId; // Populated User
    const guest = await Guest.findById(guestId);

    if (!guest) {
      return res.status(404).json({ success: false, message: 'Invité introuvable' });
    }

    // 2. Préparer l'email
    const subject = `Nouveau RSVP pour ${event.title}`;
    const html = `
      <h2>Nouvelle réponse RSVP</h2>
      <p><strong>Invité :</strong> ${guest.name} (${guest.email})</p>
      <p><strong>Événement :</strong> ${event.title}</p>
      <p><strong>Statut :</strong> <span style="color: ${status === 'confirmed' ? 'green' : 'red'}">${status.toUpperCase()}</span></p>
      ${guest.message ? `<p><strong>Message :</strong> ${guest.message}</p>` : ''}
      <br/>
      <p>Connectez-vous à votre tableau de bord pour voir plus de détails.</p>
    `;

    // 3. Envoyer l'email
    await sendEmail(organizer.email, subject, html, {
      recipientName: organizer.name,
      eventId: event._id
    });

    res.json({ success: true, message: 'Notification envoyée' });
  } catch (err) {
    console.error('sendOrganizerNotification error:', err);
    // On ne bloque pas si l'email échoue, mais on log l'erreur
    res.status(500).json({ success: false, message: "Erreur lors de l'envoi de la notification" });
  }
};
