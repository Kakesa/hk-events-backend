const nodemailer = require('nodemailer');

// ⚡ Configure ton compte email ici (ex: Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // ton email
    pass: process.env.EMAIL_PASS, // mot de passe ou App Password
  },
});

const EmailLog = require('../modules/email/email.model');

/**
 * sendEmail - envoie un email simple et le loggue en base
 * @param {string} to - destinataire
 * @param {string} subject - sujet de l'email
 * @param {string} html - contenu HTML de l'email
 * @param {object} metadata - options (eventId, recipientName...)
 */
async function sendEmail(to, subject, html, metadata = {}) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    
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
    // Log erreur
    await EmailLog.create({
      recipientEmail: to,
      recipientName: metadata.recipientName,
      subject,
      status: 'failed',
      eventId: metadata.eventId,
      error: err.message
    });
    throw err;
  }
}

module.exports = { sendEmail };
