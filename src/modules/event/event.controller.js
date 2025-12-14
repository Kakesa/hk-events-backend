const eventService = require('./event.service');

// ==================== ORGANIZER ====================

// ➕ Créer un événement
const createEvent = async (req, res, next) => {
  try {
    const file = req.file || null;

    const event = await eventService.createEvent(
      req.body,
      req.user.id,
      file
    );

    res.status(201).json({
      success: true,
      message: 'Événement créé',
      data: event,
    });
  } catch (err) {
    next(err);
  }
};

// 📄 Tous les événements de l’organisateur
const getEvents = async (req, res, next) => {
  try {
    const events = await eventService.getEventsByOrganizer(req.user.id);

    res.json({
      success: true,
      data: events,
    });
  } catch (err) {
    next(err);
  }
};

// 📄 Un événement privé
const getEvent = async (req, res, next) => {
  try {
    const event = await eventService.getEventById(
      req.params.id,
      req.user.id
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Événement non trouvé',
      });
    }

    res.json({ success: true, data: event });
  } catch (err) {
    next(err);
  }
};

// ✏️ Mise à jour
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
      data: event,
    });
  } catch (err) {
    next(err);
  }
};

// 🗑 Suppression
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

// 📢 Publication
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
      invitationLink: `${process.env.FRONTEND_URL}${event.invitationLink}`,
    });
  } catch (err) {
    next(err);
  }
};

// 📝 Livre d’or (privé)
const addGuestBook = async (req, res, next) => {
  try {
    const { name, message } = req.body;

    if (!name || !message) {
      return res.status(400).json({
        success: false,
        message: 'Nom et message requis',
      });
    }

    const event = await eventService.addGuestBookMessage(
      req.params.id,
      {
        guestName: name,
        message,
      }
    );

    res.json({
      success: true,
      message: 'Message ajouté',
      data: event,
    });
  } catch (err) {
    next(err);
  }
};

// ==================== PUBLIC ====================

const getPublicEventBySlug = async (req, res, next) => {
  try {
    const event = await eventService.getEventBySlug(req.params.slug);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Événement non trouvé' });
    }

    // 🔐 Limiter les champs publics
    const publicEvent = {
      id: event.id,
      title: event.title,
      type: event.type,
      description: event.description,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      location: event.location,
      coverImage: event.coverImage,
      theme: event.theme,
      guestbook: event.guestbook.map(g => ({
        guestName: g.guestName,
        message: g.message,
        createdAt: g.createdAt,
      })),
    };

    res.json({ success: true, event: publicEvent });
  } catch (err) {
    next(err);
  }
};


// 🔓 Livre d’or public
const addGuestBookPublic = async (req, res, next) => {
  try {
    const { name, message } = req.body;

    if (!name || !message) {
      return res.status(400).json({
        success: false,
        message: 'Nom et message requis',
      });
    }

    const event = await eventService.addGuestBookBySlug(
      req.params.slug,
      {
        guestName: name,
        message,
      }
    );

    res.json({
      success: true,
      message: 'Message ajouté',
      data: event,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  publishEvent,
  addGuestBook,
  getPublicEventBySlug,
  addGuestBookPublic,
};
