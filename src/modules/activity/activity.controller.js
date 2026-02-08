const Guest = require('../guest/guest.model');
const Event = require('../event/event.model');

/* =====================================================
   ACTIVITÉS RÉCENTES (GLOBAL)
===================================================== */
exports.getRecentActivities = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // 1. Récupérer les dernières interactions invités (RSVP)
    const recentGuests = await Guest.find({
      status: { $in: ['confirmed', 'declined', 'pending'] },
      respondedAt: { $exists: true }
    })
      .sort({ respondedAt: -1 })
      .limit(limit)
      .populate('eventId', 'title');

    // 2. Transformer en format standard
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

    // 3. Récupérer les derniers messages du livre d'or (via Aggrégation)
    const recentMessages = await Event.aggregate([
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

    // 4. Transformer messages
    const messageActivities = recentMessages.map(m => ({
      id: m.guestbook._id,
      type: 'message',
      guestName: m.guestbook.guestName,
      guestId: null, // Pas de lien direct user/guest ici
      eventId: m._id,
      eventTitle: m.title,
      time: m.guestbook.createdAt,
      createdAt: m.guestbook.createdAt
    }));

    // 5. Fusionner et trier
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
