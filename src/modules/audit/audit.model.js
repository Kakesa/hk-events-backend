const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema(
  {
    actor: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      name: String,
      role: String,
    },

    action: {
      type: String,
      required: true,
      enum: [
        'CREATE_USER',
        'UPDATE_USER',
        'UPDATE_PERMISSIONS',
        'DELETE_USER',
        'LOGIN',
      ],
    },

    target: {
      type: {
        type: String, // User, Event, etc.
      },
      id: {
        type: mongoose.Schema.Types.ObjectId,
      },
    },

    before: Object,
    after: Object,

    ip: String,
    userAgent: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('AuditLog', auditSchema);
