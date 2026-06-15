const express = require('express');
const router = express.Router();

const { protect } = require('../../middlewares/auth.middleware');
const upload = require('../../middlewares/upload');
const { restrictTo } = require('../../middlewares/role.middleware');
const { checkPermission } = require('../../middlewares/permission.middleware');

const {
  getPublicEventBySlug,
  addGuestBookPublic,
  createEvent,
  getEvents,
  getAllEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  publishEvent,
  addGuestBook,
  getEventAnalytics,
  getGuestBook,
} = require('./event.controller');

/* =======================
   PUBLIC ROUTES
======================= */
router.get('/public/:slug', getPublicEventBySlug);
router.post('/public/:slug/guestbook', addGuestBookPublic);

/* =======================
   PROTECTED ROUTES
======================= */
router.use(protect);

// CREATE EVENT
router.post(
  '/',
  restrictTo('admin', 'user', 'organizer'),
  checkPermission('events', 'create'),
  upload.single('coverImage'),
  createEvent
);

// GET ALL EVENTS - ✨ SUPERADMIN ONLY (doit être avant /:id pour éviter le Cast to ObjectId)
router.get(
  '/all',
  restrictTo('superadmin'),
  getAllEvents
);

// GET EVENTS (seulement ceux de l’utilisateur connecté)
router.get(
  '/',
  restrictTo('admin', 'user', 'organizer'),
  checkPermission('events', 'read'),
  getEvents
);

// GET SINGLE EVENT
router.get(
  '/:id',
  restrictTo('admin', 'user', 'organizer'),
  checkPermission('events', 'read'),
  getEvent
);

// GET EVENT ANALYTICS
router.get(
  '/:id/analytics',
  restrictTo('admin', 'user', 'organizer'),
  checkPermission('events', 'read'),
  getEventAnalytics
);

// UPDATE EVENT
router.put(
  '/:id',
  restrictTo('admin', 'user', 'organizer'),
  checkPermission('events', 'update'),
  upload.single('coverImage'),
  updateEvent
);

// DELETE EVENT
router.delete(
  '/:id',
  restrictTo('admin', 'user', 'organizer'),
  checkPermission('events', 'delete'),
  deleteEvent
);

// PUBLISH EVENT
router.patch(
  '/:id/publish',
  restrictTo('admin', 'user', 'organizer'),
  checkPermission('events', 'update'),
  publishEvent
);

// ADD GUESTBOOK ENTRY
router.post(
  '/:id/guestbook',
  restrictTo('admin', 'user', 'organizer'),
  checkPermission('guestbook', 'update'),
  addGuestBook
);

// GET GUESTBOOK ENTRIES
router.get(
  '/:id/guestbook',
  restrictTo('admin', 'user', 'organizer'),
  checkPermission('guestbook', 'read'),
  getGuestBook
);

// REPLY TO A GUESTBOOK MESSAGE
router.post(
  '/:id/guestbook/:messageId/reply',
  restrictTo('admin', 'user', 'organizer'),
  checkPermission('guestbook', 'update'),
  (req, res, next) => require('./event.controller').replyGuestBook(req, res, next),
);

// DOWNLOAD GUESTBOOK (CSV)
router.get(
  '/:id/guestbook/download',
  restrictTo('admin', 'user', 'organizer'),
  checkPermission('guestbook', 'read'),
  (req, res, next) => require('./event.controller').downloadGuestBook(req, res, next),
);

module.exports = router;
