const { body } = require('express-validator');
const { PAYABLE_PLANS, getPlanPrice } = require('../../constants/subscriptionPlans');

exports.initiatePaymentValidation = [
  body('amount')
    .notEmpty().withMessage('Montant requis')
    .isNumeric().withMessage('Le montant doit être un nombre')
    .custom((value) => value > 0).withMessage('Le montant doit être supérieur à 0'),

  body('plan')
    .notEmpty().withMessage('Plan requis')
    .isIn(PAYABLE_PLANS).withMessage('Plan invalide')
    .custom((plan, { req }) => {
      const expected = getPlanPrice(plan);
      if (Number(req.body.amount) !== expected) {
        throw new Error(`Montant incorrect pour le plan ${plan}`);
      }
      return true;
    }),

  body('currency')
    .optional()
    .isIn(['XOF', 'USD', 'EUR']).withMessage('Devise non supportée'),
];
