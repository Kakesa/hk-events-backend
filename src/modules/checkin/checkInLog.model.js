const mongoose = require('mongoose');

const CHECK_IN_METHODS = [
  'QR_CODE',
  'SEARCH_NAME',
  'SEARCH_PHONE',
  'SEARCH_INVITATION_CODE',
];

const checkInLogSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    guestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Guest',
      required: true,
      index: true,
    },
    guestName: { type: String, trim: true },
    method: {
      type: String,
      enum: CHECK_IN_METHODS,
      required: true,
    },
    checkedInBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    checkedInByName: { type: String, trim: true, default: '' },
    checkedInAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

checkInLogSchema.index({ eventId: 1, checkedInAt: -1 });

module.exports = mongoose.model('CheckInLog', checkInLogSchema);
module.exports.CHECK_IN_METHODS = CHECK_IN_METHODS;
