const { body } = require('express-validator');

exports.loginValidation = [
  body('email')
    .notEmpty().withMessage('Email requis')
    .bail() // ⛔ stop ici si vide
    .isEmail().withMessage('Email invalide'),

  body('password')
    .notEmpty().withMessage('Mot de passe requis'),
];

exports.registerValidation = [
  body('name')
    .notEmpty().withMessage('Nom requis'),

  body('email')
    .notEmpty().withMessage('Email requis')
    .bail()
    .isEmail().withMessage('Email invalide'),

  body('phone')
    .notEmpty().withMessage('Numéro de téléphone requis')
    .bail()
    .custom((value) => {
      const { normalizePhoneToE164 } = require('../../utils/phone');
      if (!normalizePhoneToE164(value)) {
        throw new Error('Numéro invalide. Utilisez 9 chiffres RDC (ex: 812345678)');
      }
      return true;
    }),

  body('password')
    .notEmpty().withMessage('Mot de passe requis')
    .bail()
    .isLength({ min: 6 }).withMessage('Mot de passe minimum 6 caractères'),
];

exports.forgotPasswordValidation = [
  body('email')
    .notEmpty().withMessage('Email requis')
    .bail()
    .isEmail().withMessage('Email invalide'),
];

exports.resetPasswordValidation = [
  body('token')
    .notEmpty().withMessage('Token requis'),
  body('password')
    .notEmpty().withMessage('Mot de passe requis')
    .bail()
    .isLength({ min: 6 }).withMessage('Mot de passe minimum 6 caractères'),
];

exports.googleAuthValidation = [
  body('credential')
    .notEmpty().withMessage('Token Google requis'),
];
