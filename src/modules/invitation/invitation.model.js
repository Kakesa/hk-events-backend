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
      enum: ['whatsapp', 'sms', 'email'],
      required: true,
    },

    templateUrl: String,
    themeColor: String,

    sentAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Invitation', invitationSchema);
