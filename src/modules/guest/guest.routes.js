const express = require('express');
const router = express.Router();
const { createGuest, getGuestsByEvent, updateGuest, deleteGuest } = require('./guest.controller');

router.post('/', createGuest);
router.get('/event/:eventId', getGuestsByEvent);
router.patch('/:id', updateGuest);
router.delete('/:id', deleteGuest);

module.exports = router;
