const express = require('express');
const router = express.Router();
const { protect } = require('../../middlewares/auth.middleware');
const whatsappLogController = require('./whatsapp-log.controller');

router.use(protect);

router.get('/', whatsappLogController.getLogs);
router.post('/', whatsappLogController.logAction);
router.delete('/', whatsappLogController.clearLogs);

module.exports = router;
