const mongoose = require('mongoose');

const TextStyleSchema = new mongoose.Schema(
  {
    fontFamily: { type: String, default: 'Georgia, "Times New Roman", serif' },
    fontSize: { type: Number, default: 14 },
    fontWeight: { type: Number, default: 400 },
    letterSpacing: { type: String, default: '0.02em' },
    align: {
      type: String,
      enum: ['left', 'center', 'right'],
      default: 'center',
    },
    offsetX: { type: Number, default: 0 },
    offsetY: { type: Number, default: 0 },
    color: { type: String, default: '' },
  },
  { _id: false },
);

const DesignSchema = new mongoose.Schema(
  {
    templateId: {
      type: String,
      enum: ['classic-floral', 'minimal', 'centered-serif'],
      default: 'classic-floral',
    },
    orientation: {
      type: String,
      enum: ['portrait', 'landscape'],
      default: 'portrait',
    },
    widthMm: { type: Number, default: 160 },
    heightMm: { type: Number, default: 95 },
    tentFold: { type: Boolean, default: true },
    backgroundColor: { type: String, default: '#ffffff' },
    textColor: { type: String, default: '#3d3d3d' },
    accentColor: { type: String, default: '#8f6fad' },
    border: {
      enabled: { type: Boolean, default: false },
      color: { type: String, default: '#d4c4b0' },
      widthMm: { type: Number, default: 0.4 },
      radiusMm: { type: Number, default: 0 },
    },
    decoration: {
      enabled: { type: Boolean, default: true },
      motif: {
        type: String,
        enum: ['event-cover', 'floral', 'floral-left', 'none'],
        default: 'event-cover',
      },
      opacity: { type: Number, default: 0.98 },
    },
    label: {
      type: TextStyleSchema,
      default: () => ({
        fontSize: 16,
        fontWeight: 400,
        letterSpacing: '0.12em',
        align: 'center',
        offsetY: -8,
      }),
    },
    title: {
      type: TextStyleSchema,
      default: () => ({
        fontSize: 56,
        fontWeight: 600,
        letterSpacing: '0.02em',
        align: 'center',
        offsetY: 4,
      }),
    },
    names: {
      type: TextStyleSchema,
      default: () => ({
        fontSize: 12,
        fontWeight: 400,
        letterSpacing: '0.04em',
        align: 'right',
        offsetX: 0,
        offsetY: 0,
      }),
    },
    date: {
      type: TextStyleSchema,
      default: () => ({
        fontSize: 11,
        fontWeight: 400,
        letterSpacing: '0.06em',
        align: 'right',
        offsetX: 0,
        offsetY: 2,
      }),
    },
  },
  { _id: false },
);

const MarqueTableSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    number: {
      type: String,
      required: true,
      trim: true,
      default: '1',
    },
    label: {
      type: String,
      trim: true,
      default: 'Table',
    },
    titleText: {
      type: String,
      trim: true,
      default: '',
    },
    /** Lien optionnel vers une table seating (sync auto à la génération) */
    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Table',
      default: null,
      index: true,
    },
    displayNameOverride: {
      type: String,
      trim: true,
      default: null,
    },
    displayDateOverride: {
      type: String,
      trim: true,
      default: null,
    },
    order: {
      type: Number,
      default: 0,
      index: true,
    },
    design: {
      type: DesignSchema,
      default: () => ({}),
    },
  },
  { timestamps: true },
);

MarqueTableSchema.index({ eventId: 1, order: 1 });

MarqueTableSchema.set('toJSON', {
  transform: (_, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  },
});

module.exports = mongoose.model('MarqueTable', MarqueTableSchema);
