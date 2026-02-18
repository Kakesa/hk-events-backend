const mongoose = require('mongoose');
const slugify = require('slugify');

// ===================== GUESTBOOK =====================
const GuestbookSchema = new mongoose.Schema(
  {
    guestName: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

// ===================== EVENT =====================
const EventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      required: true, // wedding, birthday, conference...
    },

    description: {
      type: String,
      trim: true,
    },

    date: {
      type: Date,
      required: true,
    },

    startTime: String,
    endTime: String,

    location: {
      type: String,
      required: true,
      trim: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    coverImage: String,

    theme: {
      type: String,
      default: 'elegant',
    },

    primaryColor: {
      type: String,
      default: '#D4AF37', // Gold default
    },

    accentColor: {
      type: String,
      default: '#ffffff',
    },

    published: {
      type: Boolean,
      default: false,
    },

    slug: {
      type: String,
      unique: true,
      index: true,
    },

    invitationLink: String,

    guestbook: [GuestbookSchema],
  },
  { timestamps: true }
);

// ===================== SLUG & INVITATION LINK =====================
EventSchema.pre('save', async function () {
  // Générer le slug uniquement à la création
  if (!this.slug) {
    this.slug = slugify(`${this.title}-${Date.now()}`, {
      lower: true,
      strict: true,
    });
  }

  // Générer le lien d’invitation
  if (!this.invitationLink) {
    this.invitationLink = `/invite/${this.slug}`;
  }
});

// ===================== _id → id (API propre) =====================
EventSchema.set('toJSON', {
  transform: (_, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  },
});

module.exports = mongoose.model('Event', EventSchema);
