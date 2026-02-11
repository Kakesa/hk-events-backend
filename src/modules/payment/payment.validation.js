const { body } = require('express-validator');

exports.initiatePaymentValidation = [
  body('amount')
    .notEmpty().withMessage('Montant requis')
    .isNumeric().withMessage('Le montant doit être un nombre')
    .custom((value) => value > 0).withMessage('Le montant doit être supérieur à 0'),

  body('plan')
    .notEmpty().withMessage('Plan requis')
    .isIn(['basic', 'premium', 'enterprise']).withMessage('Plan invalide'),

  body('currency')
    .optional()
    .isIn(['XOF', 'USD', 'EUR']).withMessage('Devise non supportée'),
];
