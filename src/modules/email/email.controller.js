const EmailLog = require('./email.model');

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

    const [totalSent, delivered, failed, opened, clicked] = await Promise.all([
      EmailLog.countDocuments(query),
      EmailLog.countDocuments({ ...query, status: 'delivered' }),
      EmailLog.countDocuments({ ...query, status: 'failed' }),
      EmailLog.countDocuments({ ...query, status: 'opened' }),
      EmailLog.countDocuments({ ...query, status: 'clicked' }),
    ]);

    // Calcul des taux (simulation/réel)
    // Pour l'instant on assume sent = delivered si pas failed
    const realDelivered = totalSent - failed; 

    const deliveryRate = totalSent > 0 ? (realDelivered / totalSent) * 100 : 0;
    const openRate = realDelivered > 0 ? (opened / realDelivered) * 100 : 0;
    const clickRate = opened > 0 ? (clicked / opened) * 100 : 0;

    res.json({
      success: true,
      data: {
        totalSent,
        deliveryRate,
        openRate,
        clickRate,
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
