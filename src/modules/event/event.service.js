const Event = require('./event.model');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const slugify = require('slugify');
const Analytics = require('../analytics/analytics.model');
const Guest = require('../guest/guest.model');

const UPLOAD_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// =======================
// FILE HANDLING
// =======================
const saveFileLocal = async (file) => {
  if (!file) return null;

  const fileName = `${uuidv4()}-${file.originalname}`;
  const filePath = path.join(UPLOAD_DIR, fileName);

  if (file.buffer) await fs.promises.writeFile(filePath, file.buffer);
  else if (file.path) await fs.promises.copyFile(file.path, filePath);
  else throw new Error('Fichier invalide');

  return `/uploads/${fileName}`;
};

// =======================
// SLUG GENERATOR
// =======================
const generateUniqueSlug = async (title) => {
  const baseSlug = slugify(title, { lower: true, strict: true });
  let slug = baseSlug;
  let counter = 1;

  while (await Event.exists({ slug })) {
    slug = `${baseSlug}-${counter++}`;
  }

  return slug;
};

// =======================
// MAPPER POUR FRONT
// =======================
const mapEvent = (event) => {
  const obj = event.toObject();
  obj.id = obj._id.toString();
  return obj;
};

// =======================
// CREATE EVENT
// =======================
const createEvent = async (eventData, file) => {
  const data = {
    ...eventData,
    published: false,
    slug: await generateUniqueSlug(eventData.title),
  };

  if (file) data.coverImage = await saveFileLocal(file);

  const event = await Event.create(data);
  
  // Create empty analytics for new event
  await Analytics.create({ eventId: event._id });
  
  return mapEvent(event);
};

// =======================
// READ EVENTS
// =======================
const getEventsByUser = async (userId) => {
  const events = await Event.find({ userId }).sort({ createdAt: -1 });
  return events.map(mapEvent);
};

// ✨ SUPERADMIN: Get all events from all users
const getAllEvents = async () => {
  const events = await Event.find().sort({ createdAt: -1 }).populate('userId', 'name email');
  return events.map(mapEvent);
};

const getEventById = async (eventId, userId) => {
  const event = await Event.findOne({ _id: eventId, userId });
  if (!event) throw new Error('Événement non trouvé');
  return mapEvent(event);
};

// =======================
// UPDATE EVENT
// =======================
const updateEvent = async (eventId, userId, data, file) => {
  if (file) data.coverImage = await saveFileLocal(file);
  delete data.slug;
  delete data.invitationLink;

  const event = await Event.findOneAndUpdate({ _id: eventId, userId }, data, { new: true });
  if (!event) throw new Error('Événement non trouvé');
  return mapEvent(event);
};

// =======================
// DELETE EVENT
// =======================
const deleteEvent = async (eventId, userId) => {
  const event = await Event.findOneAndDelete({ _id: eventId, userId });
  if (!event) throw new Error('Événement non trouvé');
  return mapEvent(event);
};

// =======================
// PUBLISH EVENT
// =======================
const publishEvent = async (eventId, userId) => {
  const event = await Event.findOneAndUpdate({ _id: eventId, userId }, { published: true }, { new: true });
  if (!event) throw new Error('Événement non trouvé');
  return mapEvent(event);
};

// =======================
// PUBLIC EVENT
// =======================
const getPublicEventBySlug = async (slug) => {
  const event = await Event.findOne({ slug, published: true });
  if (!event) throw new Error('Événement non disponible');
  return mapEvent(event);
};

// =======================
// GUESTBOOK
// =======================
const addGuestBookPublic = async (slug, { guestName, message }) => {
  const event = await Event.findOne({ slug, published: true });
  if (!event) throw new Error('Événement non trouvé');

  event.guestbook.push({ guestName, message });
  await event.save();
  return mapEvent(event);
};

const addGuestBook = async (eventId, userId, { guestName, message }) => {
  const event = await Event.findOne({ _id: eventId, userId });
  if (!event) throw new Error('Événement non trouvé');

  event.guestbook.push({ guestName, message });
  await event.save();
  event.guestbook.push({ guestName, message });
  await event.save();
  return mapEvent(event);
};

// =======================
// ANALYTICS
// =======================
const getEventAnalytics = async (eventId, userId) => {
  // 1. Verify event exists and belongs to user
  const event = await Event.findOne({ _id: eventId, userId });
  if (!event) throw new Error('Événement non trouvé');

  // 2. Find Analytics document
  let analytics = await Analytics.findOne({ eventId });

  // 3. If not found, create it (backfill)
  if (!analytics) {
    const [confirmed, declined, pending] = await Promise.all([
      Guest.countDocuments({ eventId, status: 'confirmed' }),
      Guest.countDocuments({ eventId, status: 'declined' }),
      Guest.countDocuments({ eventId, status: 'pending' }),
    ]);

    analytics = await Analytics.create({
      eventId,
      totalConfirmed: confirmed,
      totalDeclined: declined,
      totalPending: pending,
      lastUpdated: new Date(),
    });
  }

  return analytics;
};

// =======================
// EXPORTS
// =======================
module.exports = {
  createEvent,
  getEventsByUser,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  publishEvent,
  getPublicEventBySlug,
  addGuestBookPublic,
  addGuestBookPublic,
  addGuestBookPublic,
  addGuestBook,
  getGuestBook,
  getEventAnalytics,
};
