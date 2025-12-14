const mongoose = require('mongoose');
const slugify = require('slugify');

// ===================== GUESTBOOK =====================
const GuestbookSchema = new mongoose.Schema(
  {
    guestName: { type: String, required: true },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

// ===================== EVENT =====================
const EventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    type: { type: String, required: true }, // wedding, birthday...

    description: String,

    date: { type: Date, required: true },
    startTime: String,
    endTime: String,

    location: { type: String, required: true },

    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organizer',
      required: true,
    },

    coverImage: String,
    theme: { type: String, default: 'elegant' },

    published: { type: Boolean, default: false },

    slug: { type: String, unique: true },
    invitationLink: String,

    guestbook: [GuestbookSchema],
  },
  { timestamps: true }
);

// ===================== SLUG AUTO =====================
EventSchema.pre('save', function (next) {
  if (!this.slug) {
    this.slug = slugify(`${this.title}-${Date.now()}`, {
      lower: true,
      strict: true,
    });
  }

  if (!this.invitationLink) {
    this.invitationLink = `/invite/${this.slug}`;
  }

  next();
});

// ===================== _id → id =====================
EventSchema.set('toJSON', {
  transform: (_, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  },
});

module.exports = mongoose.model('Event', EventSchema);
