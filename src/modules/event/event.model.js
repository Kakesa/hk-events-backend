const mongoose = require('mongoose');

const GuestbookSchema = new mongoose.Schema({
  name: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const EventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    type: { type: String, required: true }, // Mariage, Anniversaire, Corporate, etc.
    description: { type: String },
    date: { type: Date, required: true },
    startTime: { type: String },
    endTime: { type: String },
    location: { type: String, required: true },
    organizerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    coverImage: { type: String }, // URL S3 ou chemin local
    theme: { type: String, default: 'elegant' },
    guestbook: [GuestbookSchema], // Livre d’or
  },
  { timestamps: true } // createdAt et updatedAt automatiques
);

module.exports = mongoose.model('Event', EventSchema);
