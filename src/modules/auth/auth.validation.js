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
    .optional()
    .isMobilePhone().withMessage('Numéro de téléphone invalide'),

  body('password')
    .notEmpty().withMessage('Mot de passe requis')
    .bail()
    .isLength({ min: 6 }).withMessage('Mot de passe minimum 6 caractères'),
];
