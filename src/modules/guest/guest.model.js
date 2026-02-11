const mongoose = require('mongoose');
const Analytics = require('../analytics/analytics.model');

const guestSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: ['invited', 'confirmed', 'declined', 'pending'],
      default: 'invited',
      index: true,
    },

    // RSVP DATA
    drinkPreference: {
      type: String,
      enum: ['champagne', 'wine', 'cocktail', 'beer', 'soft', 'none', ''],
      default: '',
    },

    dietaryRestrictions: {
      type: String,
      default: '',
      trim: true,
    },

    message: {
      type: String,
      default: '',
      trim: true,
    },

    respondedAt: {
      type: Date,
    },

    qrCode: String,
    qrGeneratedAt: Date,

    checkedIn: {
      type: Boolean,
      default: false,
    },
    checkedInAt: Date,

    table: {
      type: String,
      trim: true,
      default: "",
    },

  },
  { timestamps: true }
);

/* =====================================================
   ANALYTICS AUTO UPDATE (POST SAVE)
===================================================== */
guestSchema.post('save', async function (doc) {
  try {
    const analytics = await Analytics.findOne({ eventId: doc.eventId });
    if (!analytics) return;

    const Guest = mongoose.model('Guest');

    const [confirmed, declined, pending] = await Promise.all([
      Guest.countDocuments({ eventId: doc.eventId, status: 'confirmed' }),
      Guest.countDocuments({ eventId: doc.eventId, status: 'declined' }),
      Guest.countDocuments({ eventId: doc.eventId, status: 'pending' }),
    ]);

    analytics.totalConfirmed = confirmed;
    analytics.totalDeclined = declined;
    analytics.totalPending = pending;
    analytics.lastUpdated = new Date();

    await analytics.save();
  } catch (err) {
    console.error('Erreur mise à jour Analytics:', err.message);
  }
});

module.exports = mongoose.model('Guest', guestSchema);
