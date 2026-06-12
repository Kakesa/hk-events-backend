const express = require('express');
const router = express.Router();
const { protect } = require('../../middlewares/auth.middleware');

const {
  createInvitation,
  getInvitationsByEvent,
  markSent,
  deleteInvitation,
  sendInvitation,
  sendBulkInvitations,
} = require('./invitation.controller');

// ==================== CRUD Invitations ====================
// Protéger toutes les routes sauf public
router.use(protect);

router.post('/', createInvitation);
router.get('/event/:eventId', getInvitationsByEvent);
router.patch('/:id/sent', markSent);
router.delete('/:id', deleteInvitation);

// ==================== Envoi Invitations ====================
router.post('/send', sendInvitation);           // Envoi à un invité
router.post('/send-bulk', sendBulkInvitations); // Envoi à plusieurs invités

module.exports = router;
