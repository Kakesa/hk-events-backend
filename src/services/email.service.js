const nodemailer = require('nodemailer');

// ⚡ Configure ton compte email ici (ex: Gmail)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // ton email
    pass: process.env.EMAIL_PASS, // mot de passe ou App Password
  },
});

/**
 * sendEmail - envoie un email simple
 * @param {string} to - destinataire
 * @param {string} subject - sujet de l'email
 * @param {string} html - contenu HTML de l'email
 */
async function sendEmail(to, subject, html) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
  };

  return transporter.sendMail(mailOptions);
}

module.exports = { sendEmail };
