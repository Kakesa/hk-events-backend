const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema(
  {
    eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    totalInvitationsSent: { type: Number, default: 0 },
    totalConfirmed: { type: Number, default: 0 },
    totalDeclined: { type: Number, default: 0 },
    totalPending: { type: Number, default: 0 },
    preferredDrinksStats: { type: Map, of: Number, default: {} },
    lastUpdated: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Analytics', analyticsSchema);
