const express = require('express');
const router = express.Router();
const { register, login } = require('./auth.controller');
const { registerValidation, loginValidation } = require('./auth.validation');
const { validate } = require('../../middlewares/validate.middleware');

router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);

module.exports = router;
