const { body } = require('express-validator');

exports.registerValidation = [
  body('name').notEmpty().withMessage('Nom requis'),
  body('email').isEmail().withMessage('Email invalide'),
  body('phone').optional().isMobilePhone().withMessage('Numéro de téléphone invalide'),
  body('password').isLength({ min: 6 }).withMessage('Mot de passe minimum 6 caractères'),
  ];

exports.loginValidation = [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Mot de passe requis')
];
