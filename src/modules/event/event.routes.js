const express = require('express');
const router = express.Router();
const eventController = require('./event.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { restrictTo } = require('../../middlewares/role.middleware');
const multer = require('multer');

// ==================== MULTER ====================
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// ==================== ROUTES PUBLIQUES ====================

// 🔓 Accès public à un événement via slug (invitation)
router.get('/public/:slug', eventController.getPublicEventBySlug);

// 🔓 Livre d’or public
router.post('/public/:slug/guestbook', eventController.addGuestBookPublic);

// ==================== MIDDLEWARE AUTH ====================
router.use(protect);

// ==================== ROUTES ORGANIZER ====================

// ➕ Créer un événement
router.post(
  '/',
  restrictTo('organizer'),
  upload.single('coverImage'),
  eventController.createEvent
);

// 📄 Liste des événements de l’organisateur
router.get(
  '/',
  restrictTo('organizer'),
  eventController.getEvents
);

// 📄 Détails d’un événement (privé)
router.get(
  '/:id',
  restrictTo('organizer'),
  eventController.getEvent
);

// ✏️ Mettre à jour un événement
router.put(
  '/:id',
  restrictTo('organizer'),
  upload.single('coverImage'),
  eventController.updateEvent
);

// 🗑 Supprimer un événement
router.delete(
  '/:id',
  restrictTo('organizer'),
  eventController.deleteEvent
);

// 📢 Publier un événement
router.patch(
  '/:id/publish',
  restrictTo('organizer'),
  eventController.publishEvent
);

// 📝 Ajouter un message au livre d’or (privé)
router.post(
  '/:id/guestbook',
  restrictTo('organizer'),
  eventController.addGuestBook
);

module.exports = router;
