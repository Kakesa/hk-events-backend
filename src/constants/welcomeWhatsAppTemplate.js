/**
 * Template Meta WhatsApp — message automatique après inscription.
 *
 * Créer dans Meta Business → WhatsApp Manager → Message templates :
 *   Nom      : hk_events_welcome_fr  (ou WHATSAPP_TEMPLATE_NAME dans .env)
 *   Langue   : French (fr)
 *   Catégorie: Utility
 *
 * Corps du message (variable {{1}} = nom de l'utilisateur) :
 * ───────────────────────────────────────────────────────────
 * Merci beaucoup {{1}},
 *
 * Nous avons bien reçu l'activation de votre compte sur HK Events.
 * Dites-nous comment nous pouvons vous aider ?
 * ───────────────────────────────────────────────────────────
 */
const WELCOME_TEMPLATE = {
  name: 'hk_events_welcome_fr',
  language: 'fr',
  bodyParameterCount: 1,
  bodyExample: [
    'Merci beaucoup {{1}},',
    '',
    "Nous avons bien reçu l'activation de votre compte sur HK Events.",
    'Dites-nous comment nous pouvons vous aider ?',
  ].join('\n'),
};

const formatGuestName = (name) => {
  const trimmed = String(name || '').trim();
  return trimmed || 'cher client';
};

module.exports = {
  WELCOME_TEMPLATE,
  formatGuestName,
};
