const express = require('express');
const router = express.Router();
const {
  createInvitation,
  getInvitationsByEvent,
  markSent,
  deleteInvitation,
} = require('./invitation.controller');

// CRUD Invitations
router.post('/', createInvitation);
router.get('/event/:eventId', getInvitationsByEvent);
router.patch('/:id/sent', markSent);
router.delete('/:id', deleteInvitation);

module.exports = router;
