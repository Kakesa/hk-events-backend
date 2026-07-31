const { normalizePhoneToE164 } = require('../utils/phone');
const { formatGuestName } = require('../constants/welcomeWhatsAppTemplate');

/**
 * Équivalent Node.js de :
 * curl -X POST https://graph.facebook.com/v25.0/{PHONE_NUMBER_ID}/messages \
 *   -H 'Authorization: Bearer <token>' \
 *   -H 'Content-Type: application/json' \
 *   -d '{ "messaging_product": "whatsapp", "to": "...", "type": "template", ... }'
 */
const formatWhatsAppTo = (phone) => {
  const e164 = normalizePhoneToE164(phone);
  if (!e164) return null;
  return e164.replace(/\D/g, '');
};

const sendWhatsAppTemplateMessage = async ({ to, bodyParameters }) => {
  const token = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  if (!token) {
    throw new Error('WHATSAPP_ACCESS_TOKEN manquant dans .env');
  }

  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '1145290298677490';
  const apiVersion = process.env.WHATSAPP_API_VERSION || 'v25.0';
  const templateName =
    process.env.WHATSAPP_TEMPLATE_NAME || 'hk_events_welcome_fr';
  const templateLang = process.env.WHATSAPP_TEMPLATE_LANG || 'fr';

  const recipient = formatWhatsAppTo(to);
  if (!recipient) {
    throw new Error('Numéro WhatsApp invalide');
  }

  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    to: recipient,
    type: 'template',
    template: {
      name: templateName,
      language: { code: templateLang },
      components: [
        {
          type: 'body',
          parameters: (bodyParameters || []).map((text) => ({
            type: 'text',
            text: String(text),
          })),
        },
      ],
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const err = data?.error || {};
    const message = err.message || response.statusText || 'Erreur API WhatsApp';
    const code = err.code != null ? ` (#${err.code})` : '';
    const hint =
      err.code === 190 || /authentication/i.test(message)
        ? ' — Token expiré ou invalide. Regénérez un token permanent dans Meta Business (System User).'
        : err.code === 131030
          ? ' — Ajoutez ce numéro dans Meta → WhatsApp → API Setup → liste des numéros de test.'
          : err.code === 132001
            ? ' — Template introuvable ou non approuvé. Vérifiez WHATSAPP_TEMPLATE_NAME.'
            : '';
    throw new Error(`${message}${code}${hint}`);
  }

  return data;
};

/** Message automatique après inscription (variable {{1}} = nom sur Meta). */
const sendWelcomeToNewUser = async ({ name, phone }) => {
  if (process.env.WHATSAPP_WELCOME_ENABLED === 'false') {
    return { sent: false, reason: 'disabled' };
  }

  if (!phone) {
    return { sent: false, reason: 'no_phone' };
  }

  const guestName = formatGuestName(name);

  const result = await sendWhatsAppTemplateMessage({
    to: phone,
    bodyParameters: [guestName],
  });

  console.log(`✅ WhatsApp bienvenue envoyé à ${guestName} (${phone})`);
  return { sent: true, data: result };
};

module.exports = {
  sendWhatsAppTemplateMessage,
  sendWelcomeToNewUser,
  formatWhatsAppTo,
};
