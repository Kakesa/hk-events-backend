const express = require('express');
const router = express.Router();
const eventController = require('./event.controller');
const { protect } = require('../../middlewares/auth.middleware');
const { restrictTo } = require('../../middlewares/role.middleware');
const { checkPermission } = require('../../middlewares/permission.middleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`)
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.get('/public/:slug', eventController.getPublicEventBySlug);
router.post('/public/:slug/guestbook', eventController.addGuestBookPublic);

router.use(protect);

router.post('/', restrictTo('admin', 'user'), checkPermission('events', 'create'), upload.single('coverImage'), eventController.createEvent);
router.get('/', restrictTo('admin', 'user'), checkPermission('events', 'read'), eventController.getEvents);
router.get('/:id', restrictTo('admin', 'user'), checkPermission('events', 'read'), eventController.getEvent);
router.put('/:id', restrictTo('admin', 'user'), checkPermission('events', 'update'), upload.single('coverImage'), eventController.updateEvent);
router.delete('/:id', restrictTo('admin', 'user'), checkPermission('events', 'delete'), eventController.deleteEvent);
router.patch('/:id/publish', restrictTo('admin', 'user'), checkPermission('events', 'update'), eventController.publishEvent);
router.post('/:id/guestbook', restrictTo('admin', 'user'), checkPermission('events', 'update'), eventController.addGuestBook);

module.exports = router;
