const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/* =====================================================
   PERMISSION SCHEMA
===================================================== */
const permissionSchema = new mongoose.Schema(
  {
    module: {
      type: String,
      required: true,
      trim: true,
    },
    create: { type: Boolean, default: false },
    read: { type: Boolean, default: false },
    update: { type: Boolean, default: false },
    delete: { type: Boolean, default: false },
  },
  { _id: false }
);

/* =====================================================
   USER SCHEMA
===================================================== */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    phone: {
      type: String,
      default: '',
      trim: true,
    },

    password: {
      type: String,
      required: true,
      select: false, // 🔒 jamais exposer
    },

    role: {
      type: String,
      enum: ['superadmin', 'admin', 'user'],
      default: 'user',
      index: true,
    },

    permissions: {
      type: [permissionSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/* =====================================================
   HASH PASSWORD (FIX CRITIQUE)
===================================================== */
userSchema.pre('save', async function () {
  // ⚠️ IMPORTANT : ne re-hasher que si modifié
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

/* =====================================================
   COMPARE PASSWORD
===================================================== */
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!candidatePassword || !this.password) {
    return false;
  }

  return bcrypt.compare(candidatePassword, this.password);
};

/* =====================================================
   EXPORT
===================================================== */
module.exports = mongoose.model('User', userSchema);
