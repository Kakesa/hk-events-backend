const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { protect } = require('../../middlewares/auth.middleware');
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
} = require('./event.controller');

/* =======================
   UPLOAD CONFIGURATION
======================= */
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

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
  restrictTo('admin', 'user'),
  checkPermission('events', 'create'),
  upload.single('coverImage'),
  createEvent
);

// GET ALL EVENTS (doit être avant /:id pour éviter le Cast to ObjectId)
router.get(
  '/all',
  restrictTo('admin', 'user'),
  checkPermission('events', 'read'),
  getAllEvents
);

// GET EVENTS (seulement ceux de l’utilisateur connecté)
router.get(
  '/',
  restrictTo('admin', 'user'),
  checkPermission('events', 'read'),
  getEvents
);

// GET SINGLE EVENT
router.get(
  '/:id',
  restrictTo('admin', 'user'),
  checkPermission('events', 'read'),
  getEvent
);

// UPDATE EVENT
router.put(
  '/:id',
  restrictTo('admin', 'user'),
  checkPermission('events', 'update'),
  upload.single('coverImage'),
  updateEvent
);

// DELETE EVENT
router.delete(
  '/:id',
  restrictTo('admin', 'user'),
  checkPermission('events', 'delete'),
  deleteEvent
);

// PUBLISH EVENT
router.patch(
  '/:id/publish',
  restrictTo('admin', 'user'),
  checkPermission('events', 'update'),
  publishEvent
);

// ADD GUESTBOOK ENTRY
router.post(
  '/:id/guestbook',
  restrictTo('admin', 'user'),
  checkPermission('events', 'update'),
  addGuestBook
);

module.exports = router;
