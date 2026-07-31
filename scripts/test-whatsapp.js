/**
 * Test envoi WhatsApp template (sans inscription).
 *
 * Usage :
 *   node scripts/test-whatsapp.js
 *   node scripts/test-whatsapp.js 243828863897
 *   node scripts/test-whatsapp.js 243828863897 "Espoir"
 *
 * Prérequis : WHATSAPP_ACCESS_TOKEN + template hk_events_welcome_fr (fr) sur Meta
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { sendWhatsAppTemplateMessage } = require('../src/services/whatsapp.service');
const { formatGuestName } = require('../src/constants/welcomeWhatsAppTemplate');

const to = process.argv[2] || '243828863897';
const name = formatGuestName(process.argv[3] || 'Espoir');

async function main() {
  console.log('🔍 Configuration :');
  console.log('   Token        :', process.env.WHATSAPP_ACCESS_TOKEN ? '✅ défini' : '❌ manquant');
  console.log('   Phone ID     :', process.env.WHATSAPP_PHONE_NUMBER_ID || '1145290298677490 (défaut)');
  console.log('   Template     :', process.env.WHATSAPP_TEMPLATE_NAME || 'hk_events_welcome_fr');
  console.log('   Langue       :', process.env.WHATSAPP_TEMPLATE_LANG || 'fr');
  console.log('   Destinataire :', to);
  console.log('   Nom ({{1}})  :', name);
  console.log('');

  if (!process.env.WHATSAPP_ACCESS_TOKEN) {
    console.error('❌ Ajoutez WHATSAPP_ACCESS_TOKEN dans .env');
    process.exit(1);
  }

  try {
    const result = await sendWhatsAppTemplateMessage({
      to,
      bodyParameters: [name],
    });
    console.log('✅ Message envoyé avec succès !');
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('❌ Échec :', err.message);
    process.exit(1);
  }
}

main();
