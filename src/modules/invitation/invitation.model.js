const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },

    guestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Guest',
      required: true,
    },

    distributionMethod: {
      type: String,
      enum: ['email', 'whatsapp', 'sms'],
      required: true,
    },

    templateUrl: {
      type: String,
      default: null,
    },

    themeColor: {
      type: String,
      default: null,
    },

    sentAt: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Invitation', invitationSchema);
