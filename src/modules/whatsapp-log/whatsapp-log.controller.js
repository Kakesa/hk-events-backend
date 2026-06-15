const WhatsAppLog = require('./whatsapp-log.model');

const toDTO = (doc) => ({
  guestId: doc.guestId,
  guestName: doc.guestName,
  eventId: doc.eventId,
  copiedAt: doc.copiedAt ? doc.copiedAt.toISOString() : undefined,
  sentAt: doc.sentAt ? doc.sentAt.toISOString() : undefined,
  copyCount: doc.copyCount ?? 0,
  sendCount: doc.sendCount ?? 0,
});

exports.getLogs = async (req, res, next) => {
  try {
    const { eventId } = req.query;
    const query = eventId ? { eventId: String(eventId) } : {};

    const logs = await WhatsAppLog.find(query).sort({ updatedAt: -1 });
    res.json({ success: true, data: logs.map(toDTO) });
  } catch (err) {
    next(err);
  }
};

exports.logAction = async (req, res, next) => {
  try {
    const { eventId, guestId, guestName, action } = req.body || {};
    const idemKey = req.header('Idempotency-Key') || null;

    if (!eventId || !guestId || !guestName || !['copied', 'sent'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Payload invalide',
      });
    }

    const eventIdStr = String(eventId);
    const guestIdStr = String(guestId);

    let log = await WhatsAppLog.findOne({ eventId: eventIdStr, guestId: guestIdStr });

    if (log && idemKey && log.lastIdemKey === idemKey) {
      return res.json({ success: true, data: toDTO(log) });
    }

    const now = new Date();

    if (!log) {
      log = new WhatsAppLog({
        eventId: eventIdStr,
        guestId: guestIdStr,
        guestName,
        copyCount: action === 'copied' ? 1 : 0,
        sendCount: action === 'sent' ? 1 : 0,
        copiedAt: action === 'copied' ? now : undefined,
        sentAt: action === 'sent' ? now : undefined,
        lastIdemKey: idemKey,
      });
    } else {
      log.guestName = guestName;
      if (action === 'copied') {
        log.copyCount += 1;
        log.copiedAt = now;
      } else {
        log.sendCount += 1;
        log.sentAt = now;
      }
      log.lastIdemKey = idemKey;
    }

    await log.save();
    res.json({ success: true, data: toDTO(log) });
  } catch (err) {
    next(err);
  }
};

exports.clearLogs = async (req, res, next) => {
  try {
    const { eventId } = req.query;

    if (eventId) {
      await WhatsAppLog.deleteMany({ eventId: String(eventId) });
    } else {
      await WhatsAppLog.deleteMany({});
    }

    res.json({ success: true, data: { message: 'Cleared' } });
  } catch (err) {
    next(err);
  }
};
