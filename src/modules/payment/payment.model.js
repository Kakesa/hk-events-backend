const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'XOF',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'successful', 'failed', 'canceled'],
      default: 'pending',
    },
    transactionId: {
      type: String,
      unique: true,
      sparse: true,
    },
    paymentMethod: {
      type: String, // e.g., 'mtn', 'moov', 'card'
    },
    provider: {
      type: String, // e.g., 'fedapay', 'cinetpay'
    },
    plan: {
      type: String,
      enum: ['basic', 'premium', 'enterprise'],
      required: true,
    },
    metadata: {
      type: Map,
      of: String,
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  },
});

paymentSchema.set('toObject', {
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  },
});

module.exports = mongoose.model('Payment', paymentSchema);
