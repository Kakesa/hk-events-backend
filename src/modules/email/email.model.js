const mongoose = require('mongoose');

const emailSchema = new mongoose.Schema(
  {
    recipientEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    recipientName: {
      type: String,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
    },
    content: {
      type: String, // Peut être stocké si besoin, ou juste un résumé
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'failed', 'opened', 'clicked', 'bounced'],
      default: 'sent',
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      index: true,
    },
    metadata: {
      type: Map,
      of: String,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    error: String, // Message d'erreur si échec
  },
  { timestamps: true }
);

module.exports = mongoose.model('EmailLog', emailSchema);
