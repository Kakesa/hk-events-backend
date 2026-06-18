const mongoose = require('mongoose');

const platformSettingsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: 'platform' },
    defaultGuestPriceFc: { type: Number, default: 1500 },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model('PlatformSettings', platformSettingsSchema);
