const { body } = require('express-validator');

exports.registerValidation = [
  body('fullName').notEmpty().withMessage('Nom requis'),
  body('email').isEmail().withMessage('Email invalide'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Mot de passe minimum 6 caractères')
];

exports.loginValidation = [
  body('email').isEmail(),
  body('password').notEmpty()
];
