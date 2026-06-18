const eventService = require('./event.service');
const { assertCanCreateEvent } = require('../../utils/subscriptionLimits');

/* =======================
   CREATE EVENT
======================= */
const createEvent = async (req, res, next) => {
  try {
    if (req.user.role !== 'superadmin') {
      await assertCanCreateEvent(req.user);
    }

    const file = req.file || null;

    const eventData = {
      ...req.body,
      userId: req.user.id,
    };

    const event = await eventService.createEvent(eventData, file);

    res.status(201).json({
      success: true,
      message: 'Événement créé',
      data: event, // ✅ déjà prêt
    });
  } catch (err) {
    next(err);
  }
};

/* =======================
   GET EVENTS (USER)
======================= */
const getEvents = async (req, res, next) => {
  try {
    const events = await eventService.getEventsByUser(req.user.id);

    res.json({
      success: true,
      data: events, // ✅ DIRECT
    });
  } catch (err) {
    next(err);
  }
};

/* =======================
   GET ALL EVENTS
======================= */
const getAllEvents = async (req, res, next) => {
  try {
    const events = await eventService.getAllEvents();

    res.json({
      success: true,
      data: events, // ✅ DIRECT
    });
  } catch (err) {
    next(err);
  }
};

/* =======================
   GET SINGLE EVENT
======================= */
const getEvent = async (req, res, next) => {
  try {
    const isSuperadmin = req.user.role === 'superadmin';
    const event = await eventService.getEventById(
      req.params.id,
      req.user.id,
      isSuperadmin
    );

    res.json({
      success: true,
      data: event, // ✅ DIRECT
    });
  } catch (err) {
    next(err);
  }
};

/* =======================
   GET EVENT ANALYTICS
======================= */
const getEventAnalytics = async (req, res, next) => {
  try {
    const isSuperadmin = req.user.role === 'superadmin';
    if (!isSuperadmin) {
      const { assertAdvancedAnalytics } = require('../../utils/subscriptionLimits');
      assertAdvancedAnalytics(req.user);
    }

    const analytics = await eventService.getEventAnalytics(
      req.params.id,
      req.user.id,
      isSuperadmin
    );

    res.json({
      success: true,
      data: analytics,
    });
  } catch (err) {
    next(err);
  }
};

/* =======================
   UPDATE EVENT
======================= */
const updateEvent = async (req, res, next) => {
  try {
    const file = req.file || null;

    const event = await eventService.updateEvent(
      req.params.id,
      req.user.id,
      req.body,
      file
    );

    res.json({
      success: true,
      message: 'Événement mis à jour',
      data: event, // ✅ DIRECT
    });
  } catch (err) {
    next(err);
  }
};

/* =======================
   DELETE EVENT
======================= */
const deleteEvent = async (req, res, next) => {
  try {
    await eventService.deleteEvent(req.params.id, req.user.id);

    res.json({
      success: true,
      message: 'Événement supprimé',
    });
  } catch (err) {
    next(err);
  }
};

/* =======================
   PUBLISH EVENT
======================= */
const publishEvent = async (req, res, next) => {
  try {
    const event = await eventService.publishEvent(
      req.params.id,
      req.user.id
    );

    res.json({
      success: true,
      message: 'Événement publié',
      data: event,
      invitationLink: `${process.env.FRONTEND_URL}${event.invitationLink || ''}`,
    });
  } catch (err) {
    next(err);
  }
};

/* =======================
   PUBLIC EVENT
======================= */
const getPublicEventBySlug = async (req, res, next) => {
  try {
    const event = await eventService.getPublicEventBySlug(req.params.slug);

    res.json({
      success: true,
      data: event, // ✅ DIRECT
    });
  } catch (err) {
    next(err);
  }
};

/* =======================
   GUESTBOOK (PUBLIC)
======================= */
const addGuestBookPublic = async (req, res, next) => {
  try {
    const guest = await eventService.addGuestBookPublic(
      req.params.slug,
      req.body
    );

    res.status(201).json({
      success: true,
      message: "Message ajouté au livre d'or public",
      data: guest,
    });
  } catch (err) {
    next(err);
  }
};

/* =======================
   GUESTBOOK (PRIVATE)
======================= */
const addGuestBook = async (req, res, next) => {
  try {
    const guest = await eventService.addGuestBook(
      req.params.id,
      req.user.id,
      req.body
    );

    res.status(201).json({
      success: true,
      message: "Message ajouté au livre d'or privé",
      data: guest,
    });
  } catch (err) {
    next(err);
  }
};

/* =======================
   GET GUESTBOOK (PRIVATE)
======================= */
const getGuestBook = async (req, res, next) => {
  try {
    const isSuperadmin = req.user.role === 'superadmin';
    const messages = await eventService.getGuestBook(
      req.params.id,
      req.user.id,
      isSuperadmin
    );

    res.json({
      success: true,
      data: messages,
    });
  } catch (err) {
    next(err);
  }
};

/* =======================
   REPLY TO GUESTBOOK MESSAGE
======================= */
const replyGuestBook = async (req, res, next) => {
  try {
    const { id: eventId, messageId } = req.params;

    const updated = await eventService.replyGuestBook(
      eventId,
      req.user.id,
      messageId,
      req.body.reply,
    );

    res.json({ success: true, message: 'Réponse ajoutée', data: updated });
  } catch (err) {
    next(err);
  }
};

/* =======================
   DOWNLOAD GUESTBOOK (CSV)
======================= */
const downloadGuestBook = async (req, res, next) => {
  try {
    const isSuperadmin = req.user.role === 'superadmin';
    const messages = await eventService.getGuestBook(
      req.params.id,
      req.user.id,
      isSuperadmin,
    );

    // Build CSV
    const header = ['guestName', 'message', 'reply', 'createdAt', 'repliedAt'];
    const rows = messages.map((m) => [
      `"${(m.guestName || '').replace(/"/g, '""')}"`,
      `"${(m.message || '').replace(/"/g, '""')}"`,
      `"${(m.reply || '').replace(/"/g, '""')}"`,
      m.createdAt || '',
      m.repliedAt || '',
    ]);

    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="guestbook-${req.params.id}.csv"`);
    res.send(csv);
  } catch (err) {
    next(err);
  }
};

/* =======================
   EXPORTS
======================= */
module.exports = {
  createEvent,
  getEvents,
  getAllEvents,
  getEvent,
  getEventAnalytics,
  updateEvent,
  deleteEvent,
  publishEvent,
  getPublicEventBySlug,
  addGuestBookPublic,
  addGuestBook,
  getGuestBook,
  replyGuestBook,
  downloadGuestBook,
};
