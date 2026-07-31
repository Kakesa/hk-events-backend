/**
 * Template Meta WhatsApp — message automatique après inscription.
 *
 * Créer dans Meta Business → WhatsApp Manager → Message templates :
 *   Nom      : hk_events_welcome_fr  (ou WHATSAPP_TEMPLATE_NAME dans .env)
 *   Langue   : French (fr)
 *   Catégorie: Utility
 *
 * Corps du message (variable {{1}} = prénom ou nom de l'utilisateur) :
 * ───────────────────────────────────────────────────────────
 * Bonjour {{1}} 👋
 *
 * 🎉 Félicitations !
 *
 * Votre inscription sur HK Events est confirmée avec succès.
 *
 * Vous êtes désormais prêt(e) à vivre une nouvelle expérience dans la gestion de vos événements.
 *
 * Avec HK Events, vous pouvez :
 * ✅ Recevoir vos invitations instantanément.
 * ✅ Confirmer votre présence (RSVP).
 * ✅ Présenter votre QR Code à l'entrée des événements.
 * ✅ Suivre tous vos événements en un seul endroit.
 *
 * 🔐 Pour obtenir les autorisations nécessaires à l'utilisation complète de votre compte, veuillez contacter notre équipe via WhatsApp à l'un des numéros suivants :
 *
 * 📞 +243 828 863 897
 * 📞 +243 858 726 825
 *
 * Notre équipe activera les permissions correspondant à votre profil.
 *
 * Merci de faire confiance à HK Events. Nous vous souhaitons une excellente expérience !
 * ───────────────────────────────────────────────────────────
 */
const WELCOME_TEMPLATE = {
  name: 'hk_events_welcome_fr',
  language: 'fr',
  bodyParameterCount: 1,
  bodyExample: [
    'Bonjour {{1}} 👋',
    '',
    '🎉 Félicitations !',
    '',
    'Votre inscription sur HK Events est confirmée avec succès.',
    '',
    'Vous êtes désormais prêt(e) à vivre une nouvelle expérience dans la gestion de vos événements.',
    '',
    'Avec HK Events, vous pouvez :',
    '✅ Recevoir vos invitations instantanément.',
    '✅ Confirmer votre présence (RSVP).',
    "✅ Présenter votre QR Code à l'entrée des événements.",
    '✅ Suivre tous vos événements en un seul endroit.',
    '',
    "🔐 Pour obtenir les autorisations nécessaires à l'utilisation complète de votre compte, veuillez contacter notre équipe via WhatsApp à l'un des numéros suivants :",
    '',
    '📞 +243 828 863 897',
    '📞 +243 858 726 825',
    '',
    'Notre équipe activera les permissions correspondant à votre profil.',
    '',
    'Merci de faire confiance à HK Events. Nous vous souhaitons une excellente expérience !',
  ].join('\n'),
};

const formatGuestName = (name) => {
  const trimmed = String(name || '').trim();
  if (!trimmed) return 'cher client';
  return trimmed.split(/\s+/)[0];
};

module.exports = {
  WELCOME_TEMPLATE,
  formatGuestName,
};
