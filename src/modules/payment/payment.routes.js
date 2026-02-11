const express = require('express');
const router = express.Router();
const paymentController = require('./payment.controller');
const { initiatePaymentValidation } = require('./payment.validation');
const { validate } = require('../../middlewares/validate.middleware');
const { protect } = require('../../middlewares/auth.middleware');

// Routes protégées (Organisateurs)
router.post('/initiate', protect, initiatePaymentValidation, validate, paymentController.initiatePayment);
router.get('/verify/:id', protect, paymentController.verifyPayment);

// Route publique (Webhook)
router.post('/webhook', paymentController.handleWebhook);

module.exports = router;
