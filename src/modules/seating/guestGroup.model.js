const mongoose = require('mongoose');

const GUEST_GROUP_TYPES = [
  'family',
  'vip',
  'sponsors',
  'partners',
  'press',
  'organizers',
  'friends',
  'colleagues',
  'honorees',
  'custom',
];

const GuestGroupSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: GUEST_GROUP_TYPES,
      default: 'custom',
    },
    color: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

GuestGroupSchema.index({ eventId: 1, name: 1 }, { unique: true });

GuestGroupSchema.set('toJSON', {
  transform: (_, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  },
});

module.exports = mongoose.model('GuestGroup', GuestGroupSchema);
module.exports.GUEST_GROUP_TYPES = GUEST_GROUP_TYPES;
