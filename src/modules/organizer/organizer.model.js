const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const organizerSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['admin', 'organizer'], default: 'organizer' }
  },
  { timestamps: true }
);

// 🔐 Hash du mot de passe avant sauvegarde
organizerSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

module.exports = mongoose.model('Organizer', organizerSchema);
