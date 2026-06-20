const { sendEmail } = require('../../services/email.service');
const { EVENT_TYPE_LABELS } = require('./contact.validation');

const CONTACT_RECIPIENT = process.env.CONTACT_EMAIL || 'espoirkakesa2@gmail.com';

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

exports.sendContactMessage = async (req, res, next) => {
  try {
    const type = req.body.type === 'demo' ? 'demo' : 'contact';
    const name = req.body.name.trim();
    const email = req.body.email.trim().toLowerCase();
    const phone = req.body.phone?.trim() || '';
    const eventType = req.body.eventType?.trim() || '';
    const message = req.body.message?.trim() || '';

    if (type === 'demo') {
      const eventLabel = EVENT_TYPE_LABELS[eventType] || eventType || 'Non précisé';
      const subject = `Demande de démonstration — ${name}`;

      const html = `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #4a5a44;">
          <h2 style="color: #4a5a44; border-bottom: 2px solid #b8956c; padding-bottom: 8px;">
            Nouvelle demande de démonstration
          </h2>
          <p><strong>Nom :</strong> ${escapeHtml(name)}</p>
          <p><strong>Email :</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
          <p><strong>Téléphone :</strong> ${phone ? escapeHtml(phone) : 'Non renseigné'}</p>
          <p><strong>Type d'événement :</strong> ${escapeHtml(eventLabel)}</p>
          ${
            message
              ? `<hr style="border: none; border-top: 1px solid #e8e0d8; margin: 20px 0;" />
                 <p><strong>Besoins / message :</strong></p>
                 <p style="white-space: pre-wrap; line-height: 1.6;">${escapeHtml(message)}</p>`
              : ''
          }
          <hr style="border: none; border-top: 1px solid #e8e0d8; margin: 20px 0;" />
          <p style="font-size: 12px; color: #7a8b72;">
            Demande envoyée depuis le site HK Event — répondez à ${escapeHtml(email)} pour planifier la démo.
          </p>
        </div>
      `;

      await sendEmail(CONTACT_RECIPIENT, `[HK Event Démo] ${subject}`, html, {
        recipientName: name,
        replyTo: email,
      });

      return res.status(200).json({
        success: true,
        message: 'Demande de démonstration envoyée avec succès',
      });
    }

    const subject = req.body.subject?.trim() || 'Message depuis le site HK Event';

    const html = `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #4a5a44;">
        <h2 style="color: #4a5a44; border-bottom: 2px solid #b8956c; padding-bottom: 8px;">
          Nouveau message de contact
        </h2>
        <p><strong>Nom :</strong> ${escapeHtml(name)}</p>
        <p><strong>Email :</strong> <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
        <p><strong>Sujet :</strong> ${escapeHtml(subject)}</p>
        <hr style="border: none; border-top: 1px solid #e8e0d8; margin: 20px 0;" />
        <p style="white-space: pre-wrap; line-height: 1.6;">${escapeHtml(message)}</p>
        <hr style="border: none; border-top: 1px solid #e8e0d8; margin: 20px 0;" />
        <p style="font-size: 12px; color: #7a8b72;">
          Envoyé depuis le formulaire de contact HK Event — répondez directement à ${escapeHtml(email)}.
        </p>
      </div>
    `;

    await sendEmail(CONTACT_RECIPIENT, `[HK Event Contact] ${subject}`, html, {
      recipientName: name,
      replyTo: email,
    });

    res.status(200).json({
      success: true,
      message: 'Message envoyé avec succès',
    });
  } catch (err) {
    next(err);
  }
};
