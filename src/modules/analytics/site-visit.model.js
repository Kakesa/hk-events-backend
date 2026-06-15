const mongoose = require('mongoose');

const siteVisitSchema = new mongoose.Schema(
  {
    visitorId: { type: String, required: true, index: true },
    path: { type: String, default: '/' },
    referrer: { type: String, default: '' },
  },
  { timestamps: true }
);

siteVisitSchema.index({ createdAt: -1 });

module.exports = mongoose.model('SiteVisit', siteVisitSchema);
