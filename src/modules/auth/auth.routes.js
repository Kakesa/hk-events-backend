const express = require('express');
const router = express.Router();
const controller = require('./auth.controller');
const validation = require('./auth.validation');
const { validate } = require('../../middlewares/validate.middleware');

router.post('/register', validation.registerValidation, validate, controller.register);
router.post('/login', validation.loginValidation, validate, controller.login);

module.exports = router;
