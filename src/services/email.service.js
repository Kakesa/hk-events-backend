const nodemailer = require('nodemailer');

// ⚡ Configure ton compte email ici (ex: Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const EmailLog = require('../modules/email/email.model');

// ==================== sendEmail Function ====================
async function sendEmail(to, subject, html, metadata = {}) {
  // 1. Validation de la configuration
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ Configuration email manquante : EMAIL_USER ou EMAIL_PASS');
    throw new Error("Configuration email manquante. Vérifiez votre fichier .env");
  }

  // 2. Validation de l'adresse email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!to || !emailRegex.test(to)) {
    console.error(`❌ Adresse email invalide: ${to}`);
    throw new Error(`Adresse email invalide: ${to}`);
  }

  console.log(`📧 Préparation envoi email à ${to}`);
  console.log(`   Sujet: ${subject}`);

  const mailOptions = {
    from: `"HK Events" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    
    console.log(`✅ Email envoyé avec succès à ${to}`);
    console.log(`   Message ID: ${info.messageId}`);
    
    // Log succès
    await EmailLog.create({
      recipientEmail: to,
      recipientName: metadata.recipientName,
      subject,
      content: 'Contenu HTML masqué', // Évite de stocker tout le HTML
      status: 'delivered', // Simulation (Google renvoie 250 OK)
      eventId: metadata.eventId,
      metadata: { messageId: info.messageId }
    });
    
    return info;
  } catch (err) {
    console.error(`❌ Erreur envoi email à ${to}:`, err.message);
    
    // Log erreur
    await EmailLog.create({
      recipientEmail: to,
      recipientName: metadata.recipientName,
      subject,
      status: 'failed',
      eventId: metadata.eventId,
      error: err.message
    });
    
    throw new Error(`Impossible d'envoyer l'email à ${to}: ${err.message}`);
  }
}

module.exports = { sendEmail };
