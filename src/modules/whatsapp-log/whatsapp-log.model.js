const mongoose = require('mongoose');

const whatsAppLogSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      index: true,
    },
    guestId: {
      type: String,
      required: true,
    },
    guestName: {
      type: String,
      required: true,
      trim: true,
    },
    copyCount: {
      type: Number,
      default: 0,
    },
    sendCount: {
      type: Number,
      default: 0,
    },
    copiedAt: Date,
    sentAt: Date,
    lastIdemKey: String,
  },
  { timestamps: true }
);

whatsAppLogSchema.index({ eventId: 1, guestId: 1 }, { unique: true });

module.exports = mongoose.model('WhatsAppLog', whatsAppLogSchema);
