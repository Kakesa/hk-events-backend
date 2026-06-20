const { body } = require('express-validator');

const EVENT_TYPE_LABELS = {
  mariage: 'Mariage',
  anniversaire: 'Anniversaire',
  corporate: 'Événement corporate',
  conference: 'Conférence / Gala',
  autre: 'Autre',
};

exports.EVENT_TYPE_LABELS = EVENT_TYPE_LABELS;

exports.contactValidation = [
  body('type')
    .optional()
    .isIn(['contact', 'demo'])
    .withMessage('Type de demande invalide'),

  body('name')
    .trim()
    .notEmpty().withMessage('Nom requis')
    .isLength({ max: 100 }).withMessage('Nom trop long'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email requis')
    .bail()
    .isEmail().withMessage('Email invalide'),

  body('phone')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 30 }).withMessage('Téléphone trop long'),

  body('eventType')
    .optional({ checkFalsy: true })
    .isIn(Object.keys(EVENT_TYPE_LABELS))
    .withMessage('Type d\'événement invalide'),

  body('subject')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 200 }).withMessage('Sujet trop long'),

  body('message')
    .custom((value, { req }) => {
      const type = req.body.type === 'demo' ? 'demo' : 'contact';
      const msg = (value || '').trim();

      if (type === 'contact') {
        if (!msg) throw new Error('Message requis');
        if (msg.length < 10) throw new Error('Message entre 10 et 5000 caractères');
      }

      if (msg.length > 5000) throw new Error('Message trop long (max 5000 caractères)');
      return true;
    }),
];
