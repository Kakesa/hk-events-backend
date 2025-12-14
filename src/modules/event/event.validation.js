const { body } = require('express-validator');

exports.createEventValidation = [
  body('title').notEmpty().withMessage('Titre requis'),
  body('type').notEmpty().withMessage('Type requis'),
  body('date').notEmpty().withMessage('Date requise').isISO8601().toDate(),
  body('location').notEmpty().withMessage('Lieu requis')  
];
