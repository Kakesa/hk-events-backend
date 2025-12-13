const express = require('express');
const router = express.Router();
const eventController = require('./event.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { restrictTo } = require('../../middlewares/role.middleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer configuration pour stocker les fichiers en mémoire
const upload = multer({ storage: multer.memoryStorage() });

// Créer le dossier uploads si inexistant
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Middleware pour servir les fichiers statiques du dossier uploads
router.use('/uploads', express.static(UPLOAD_DIR));

router.use(protect);

// Création d'événement
router.post(
  '/',
  restrictTo('organizer'),
  upload.single('coverImage'),
  eventController.createEvent
);

// Récupération des événements
router.get('/', restrictTo('organizer'), eventController.getEvents);
router.get('/:id', restrictTo('organizer'), eventController.getEvent);

// Mise à jour d'un événement
router.put(
  '/:id',
  restrictTo('organizer'),
  upload.single('coverImage'),
  eventController.updateEvent
);

// Supprimer un événement
router.delete('/:id', restrictTo('organizer'), eventController.deleteEvent);

// Ajouter un message au livre d'or
router.post('/:id/guestbook', eventController.addGuestBook);

module.exports = router;
