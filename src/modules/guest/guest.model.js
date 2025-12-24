const mongoose = require('mongoose');
const Analytics = require('../analytics/analytics.model'); // Assure-toi que le modèle existe

const guestSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    status: {
      type: String,
      enum: ['invited', 'confirmed', 'declined', 'pending'],
      default: 'invited',
    },
    drinkPreference: String,
    qrCode: String,
  },
  { timestamps: true }
);

// Hook post-save pour mettre à jour les stats Analytics
guestSchema.post('save', async function(doc) {
  try {
    const analytics = await Analytics.findOne({ eventId: doc.eventId });
    if (!analytics) return;

    // Compter les statuts
    const totalConfirmed = await mongoose.model('Guest').countDocuments({ eventId: doc.eventId, status: 'confirmed' });
    const totalDeclined = await mongoose.model('Guest').countDocuments({ eventId: doc.eventId, status: 'declined' });
    const totalPending = await mongoose.model('Guest').countDocuments({ eventId: doc.eventId, status: 'pending' });

    analytics.totalConfirmed = totalConfirmed;
    analytics.totalDeclined = totalDeclined;
    analytics.totalPending = totalPending;
    analytics.lastUpdated = new Date();

    await analytics.save();
  } catch (err) {
    console.error('Erreur mise à jour Analytics:', err.message);
  }
});

module.exports = mongoose.model('Guest', guestSchema);
