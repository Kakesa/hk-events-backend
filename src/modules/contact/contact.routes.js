const express = require('express');
const router = express.Router();
const { sendContactMessage } = require('./contact.controller');
const { contactValidation } = require('./contact.validation');
const { validate } = require('../../middlewares/validate.middleware');

router.post('/', contactValidation, validate, sendContactMessage);

module.exports = router;
