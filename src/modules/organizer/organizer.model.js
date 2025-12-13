const mongoose = require('mongoose');

const organizerSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true,
      unique: true
    },
    phone: {
      type: String
    },
    password: {
      type: String,
      required: true
    },
    passwordConfirm: {
      type: String,
      required: true 
    },
    role: {
      type: String,
      enum: ['admin', 'organizer'],
      default: 'organizer'
    }
  },
  { timestamps: true }
);

// Middleware pour valider la confirmation du mot de passe
organizerSchema.pre('save', function(next) {
  if (this.password !== this.passwordConfirm) {
    return next(new Error('Les mots de passe ne correspondent pas.'));
  }
  next();
});

module.exports = mongoose.model('Organizer', organizerSchema);