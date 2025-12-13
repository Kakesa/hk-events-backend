const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const organizerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
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
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// 🔑 Méthode pour comparer le mot de passe
organizerSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Organizer', organizerSchema);
