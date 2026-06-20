const { body } = require('express-validator');

exports.contactValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Nom requis')
    .isLength({ max: 100 }).withMessage('Nom trop long'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email requis')
    .bail()
    .isEmail().withMessage('Email invalide'),

  body('subject')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 200 }).withMessage('Sujet trop long'),

  body('message')
    .trim()
    .notEmpty().withMessage('Message requis')
    .isLength({ min: 10, max: 5000 }).withMessage('Message entre 10 et 5000 caractères'),
];
