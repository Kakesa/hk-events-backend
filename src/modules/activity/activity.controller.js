const Guest = require('../guest/guest.model');
const Event = require('../event/event.model');

/* =====================================================
   ACTIVITÉS RÉCENTES (GLOBAL)
===================================================== */
exports.getRecentActivities = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const isSuperadmin = req.user.role === 'superadmin';
    const userId = req.user.id;

    // 1. Définir le filtre de base pour les invités
    let guestFilter = {
      status: { $in: ['confirmed', 'declined', 'pending'] },
      respondedAt: { $exists: true }
    };

    // 2. Définir le filtre pour l'agrégation des messages
    let eventMatch = {};

    // Si pas superadmin, on filtre par les événements de l'user
    if (!isSuperadmin) {
      const userEvents = await Event.find({ userId }).select('_id');
      const eventIds = userEvents.map(e => e._id);
      guestFilter.eventId = { $in: eventIds };
      eventMatch.userId = userId;
    }

    // 3. Récupérer les dernières interactions invités
    const recentGuests = await Guest.find(guestFilter)
      .sort({ respondedAt: -1 })
      .limit(limit)
      .populate('eventId', 'title');

    // 4. Transformer en format standard
    const guestActivities = recentGuests.map(g => ({
      id: g._id,
      type: g.status, // confirmed, declined, pending
      guestName: g.name,
      guestId: g._id,
      eventId: g.eventId?._id,
      eventTitle: g.eventId?.title || 'Événement supprimé',
      time: g.respondedAt,
      createdAt: g.createdAt
    }));

    // 5. Récupérer les derniers messages du livre d'or via agrégation
    const recentMessages = await Event.aggregate([
      { $match: eventMatch },
      { $unwind: '$guestbook' },
      { $sort: { 'guestbook.createdAt': -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          title: 1,
          guestbook: 1
        }
      }
    ]);

    // 6. Transformer messages
    const messageActivities = recentMessages.map(m => ({
      id: m.guestbook._id,
      type: 'message',
      guestName: m.guestbook.guestName,
      guestId: null,
      eventId: m._id,
      eventTitle: m.title,
      time: m.guestbook.createdAt,
      createdAt: m.guestbook.createdAt
    }));

    // 7. Fusionner et trier
    const allActivities = [...guestActivities, ...messageActivities]
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, limit);

    res.json({
      success: true,
      data: allActivities
    });

  } catch (err) {
    next(err);
  }
};

/* =====================================================
   ACTIVITÉS PAR ÉVÉNEMENT
===================================================== */
exports.getActivitiesByEvent = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    // 1. Invités
    const guests = await Guest.find({ eventId })
      .sort({ updatedAt: -1 })
      .limit(20);

    const guestActivities = guests.map(g => ({
      id: g._id,
      type: g.status === 'invited' ? 'invited' : g.status,
      guestName: g.name,
      time: g.updatedAt
    }));

    // 2. Messages
    const event = await Event.findById(eventId);
    const messageActivities = (event?.guestbook || []).map(m => ({
      id: m._id,
      type: 'message',
      guestName: m.guestName,
      time: m.createdAt
    }));

    // 3. Fusion
    const activities = [...guestActivities, ...messageActivities]
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 20);

    res.json({
      success: true,
      data: activities
    });

  } catch (err) {
    next(err);
  }
};
