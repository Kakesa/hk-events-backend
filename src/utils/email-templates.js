/**
 * Email Templates for HK Events
 * Professional HTML email templates for invitations and notifications
 */

/**
 * Generate a professional invitation email with RSVP functionality
 * @param {Object} guest - Guest information (name, email)
 * @param {Object} event - Event information (title, date, time, location, description, coverImage)
 * @param {String} rsvpLink - Full URL to RSVP page
 * @returns {String} HTML email content
 */
exports.generateInvitationEmail = (guest, event, rsvpLink) => {
  const eventDate = new Date(event.date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitation - ${event.title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f4f4f4;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 20px;
      text-align: center;
      color: white;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .cover-image {
      width: 100%;
      height: 250px;
      object-fit: cover;
      display: block;
    }
    .content {
      padding: 40px 30px;
    }
    .greeting {
      font-size: 18px;
      color: #333;
      margin-bottom: 20px;
    }
    .event-details {
      background-color: #f8f9fa;
      border-left: 4px solid #667eea;
      padding: 20px;
      margin: 25px 0;
    }
    .event-details h2 {
      margin: 0 0 15px 0;
      color: #667eea;
      font-size: 24px;
    }
    .detail-row {
      display: flex;
      align-items: flex-start;
      margin: 12px 0;
      color: #555;
    }
    .detail-icon {
      width: 24px;
      margin-right: 12px;
      color: #667eea;
      font-size: 18px;
    }
    .detail-text {
      flex: 1;
      line-height: 1.5;
    }
    .description {
      color: #666;
      line-height: 1.6;
      margin: 20px 0;
    }
    .cta-section {
      text-align: center;
      margin: 35px 0;
    }
    .cta-text {
      font-size: 16px;
      color: #333;
      margin-bottom: 20px;
      font-weight: 500;
    }
    .button-group {
      display: flex;
      gap: 15px;
      justify-content: center;
      flex-wrap: wrap;
    }
    .btn {
      display: inline-block;
      padding: 14px 32px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      font-size: 16px;
      transition: all 0.3s ease;
    }
    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
    .footer {
      background-color: #2d3748;
      color: #a0aec0;
      padding: 30px;
      text-align: center;
      font-size: 14px;
    }
    .footer p {
      margin: 8px 0;
    }
    .divider {
      height: 1px;
      background-color: #e2e8f0;
      margin: 30px 0;
    }
    @media only screen and (max-width: 600px) {
      .content {
        padding: 30px 20px;
      }
      .header h1 {
        font-size: 24px;
      }
      .event-details h2 {
        font-size: 20px;
      }
      .button-group {
        flex-direction: column;
      }
      .btn {
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <!-- Header -->
    <div class="header">
      <h1>✨ Vous êtes invité(e) ! ✨</h1>
    </div>

    <!-- Cover Image (if available) -->
    ${event.coverImage ? `<img src="${event.coverImage}" alt="${event.title}" class="cover-image">` : ''}

    <!-- Content -->
    <div class="content">
      <p class="greeting">Bonjour <strong>${guest.name}</strong>,</p>
      
      <p class="description">
        Nous avons le plaisir de vous inviter à un événement spécial. 
        Votre présence serait un honneur pour nous !
      </p>

      <!-- Event Details -->
      <div class="event-details">
        <h2>${event.title}</h2>
        
        <div class="detail-row">
          <span class="detail-icon">📅</span>
          <div class="detail-text">
            <strong>Date :</strong> ${eventDate}
          </div>
        </div>

        ${event.startTime ? `
        <div class="detail-row">
          <span class="detail-icon">🕐</span>
          <div class="detail-text">
            <strong>Heure :</strong> ${event.startTime}${event.endTime ? ` - ${event.endTime}` : ''}
          </div>
        </div>
        ` : ''}

        <div class="detail-row">
          <span class="detail-icon">📍</span>
          <div class="detail-text">
            <strong>Lieu :</strong> ${event.location}
          </div>
        </div>

        ${event.description ? `
        <div class="detail-row">
          <span class="detail-icon">ℹ️</span>
          <div class="detail-text">
            ${event.description}
          </div>
        </div>
        ` : ''}
      </div>

      <div class="divider"></div>

      <!-- Call to Action -->
      <div class="cta-section">
        <p class="cta-text">Merci de confirmer votre présence :</p>
        <div class="button-group">
          <a href="${rsvpLink}" class="btn btn-primary">
            Confirmer ma présence
          </a>
        </div>
        <p style="margin-top: 20px; color: #666; font-size: 14px;">
          En cliquant sur le bouton, vous pourrez confirmer ou décliner votre invitation<br>
          et nous faire part de vos préférences.
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p><strong>HK Events</strong></p>
      <p>Gestion d'événements professionnelle</p>
      <p style="margin-top: 15px; font-size: 12px;">
        Cet email a été envoyé à ${guest.email}
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
};

/**
 * Generate a confirmation email after RSVP submission
 * @param {Object} guest - Guest information
 * @param {Object} event - Event information
 * @param {String} status - RSVP status (confirmed/declined)
 * @param {String} qrCode - QR code for check-in (if confirmed)
 * @returns {String} HTML email content
 */
exports.generateConfirmationEmail = (guest, event, status, qrCode = null) => {
  const eventDate = new Date(event.date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const isConfirmed = status === 'confirmed';
  const title = isConfirmed ? 'Confirmation reçue !' : 'Réponse enregistrée';
  const message = isConfirmed 
    ? 'Merci d\'avoir confirmé votre présence. Nous avons hâte de vous voir !'
    : 'Nous avons bien enregistré votre réponse. Nous espérons vous voir à une prochaine occasion.';

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f4f4f4;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: ${isConfirmed ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'linear-gradient(135deg, #718096 0%, #4a5568 100%)'};
      padding: 40px 20px;
      text-align: center;
      color: white;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
      text-align: center;
    }
    .message {
      font-size: 18px;
      color: #333;
      margin: 20px 0;
      line-height: 1.6;
    }
    .qr-section {
      margin: 30px 0;
      padding: 20px;
      background-color: #f8f9fa;
      border-radius: 8px;
    }
    .qr-code {
      max-width: 200px;
      margin: 20px auto;
      display: block;
    }
    .footer {
      background-color: #2d3748;
      color: #a0aec0;
      padding: 30px;
      text-align: center;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>${isConfirmed ? '✅' : '📝'} ${title}</h1>
    </div>
    
    <div class="content">
      <p class="message">Bonjour <strong>${guest.name}</strong>,</p>
      <p class="message">${message}</p>
      
      ${isConfirmed && qrCode ? `
      <div class="qr-section">
        <h2 style="color: #667eea; margin-top: 0;">Votre QR Code</h2>
        <p>Présentez ce QR code à l'entrée de l'événement :</p>
        <img src="${qrCode}" alt="QR Code" class="qr-code">
        <p style="font-size: 14px; color: #666;">
          <strong>${event.title}</strong><br>
          ${eventDate}
        </p>
      </div>
      ` : ''}
    </div>
    
    <div class="footer">
      <p><strong>HK Events</strong></p>
      <p>Gestion d'événements professionnelle</p>
    </div>
  </div>
</body>
</html>
  `.trim();
};
