const nodemailer = require('nodemailer');

const EmailLog = require('../modules/email/email.model');

const SMTP_TIMEOUT_MS = 20000;

const createTransporter = () => {
  const timeoutOptions = {
    connectionTimeout: SMTP_TIMEOUT_MS,
    greetingTimeout: SMTP_TIMEOUT_MS,
    socketTimeout: SMTP_TIMEOUT_MS,
  };

  if (process.env.SMTP_HOST) {
    const port = Number(process.env.SMTP_PORT || 587);
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: process.env.SMTP_SECURE === 'true' || port === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      ...timeoutOptions,
    });
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    ...timeoutOptions,
  });
};

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = createTransporter();
  }
  return transporter;
};

const getFromAddress = () => {
  const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  const fromName = process.env.EMAIL_FROM_NAME || 'HK Events';
  return `"${fromName}" <${fromEmail}>`;
};

const formatSmtpError = (err) => {
  const message = err?.message || String(err);

  if (/connection timeout|ETIMEDOUT|ESOCKET/i.test(message)) {
    return (
      'Connexion SMTP impossible (timeout). Sur un VPS Hetzner, Gmail est souvent bloqué. ' +
      'Utilisez Brevo/SendGrid (SMTP_HOST=smtp-relay.brevo.com, SMTP_PORT=587).'
    );
  }

  if (/EAUTH|authentication/i.test(message)) {
    return 'Authentification SMTP refusée. Vérifiez EMAIL_USER et EMAIL_PASS (mot de passe application).';
  }

  return message;
};

const verifyEmailTransport = async () => {
  console.log('🔍 Vérification de la configuration SMTP...');
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️  EMAIL_USER / EMAIL_PASS non configurés — envoi email désactivé');
    return false;
  }

  const host = process.env.SMTP_HOST || 'gmail (service par défaut)';
  console.log(`📬 SMTP configuré : ${host} → ${process.env.EMAIL_USER}`);

  try {
    await getTransporter().verify();
    console.log('✅ Connexion SMTP vérifiée');
    return true;
  } catch (err) {
    console.error('❌ Connexion SMTP échouée:', formatSmtpError(err));
    return false;
  }
};

async function sendEmail(to, subject, html, metadata = {}) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ Configuration email manquante : EMAIL_USER ou EMAIL_PASS');
    throw new Error('Configuration email manquante. Vérifiez votre fichier .env');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!to || !emailRegex.test(to)) {
    console.error(`❌ Adresse email invalide: ${to}`);
    throw new Error(`Adresse email invalide: ${to}`);
  }

  console.log(`📧 Préparation envoi email à ${to}`);
  console.log(`   Sujet: ${subject}`);

  const mailOptions = {
    from: getFromAddress(),
    to,
    subject,
    html,
    ...(metadata.replyTo ? { replyTo: metadata.replyTo } : {}),
  };

  try {
    const info = await getTransporter().sendMail(mailOptions);

    console.log(`✅ Email envoyé avec succès à ${to}`);
    console.log(`   Message ID: ${info.messageId}`);

    await EmailLog.create({
      recipientEmail: to,
      recipientName: metadata.recipientName,
      subject,
      content: 'Contenu HTML masqué',
      status: 'delivered',
      eventId: metadata.eventId,
      metadata: { messageId: info.messageId },
    });

    return info;
  } catch (err) {
    const friendlyError = formatSmtpError(err);
    console.error(`❌ Erreur envoi email à ${to}:`, friendlyError);

    await EmailLog.create({
      recipientEmail: to,
      recipientName: metadata.recipientName,
      subject,
      status: 'failed',
      eventId: metadata.eventId,
      error: friendlyError,
    });

    throw new Error(`Impossible d'envoyer l'email à ${to}: ${friendlyError}`);
  }
}

module.exports = { sendEmail, verifyEmailTransport };
