const Event = require('./event.model');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const slugify = require('slugify');

const UPLOAD_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const saveFileLocal = async (file) => {
  if (!file) throw new Error('Fichier invalide');
  const fileName = `${uuidv4()}-${file.originalname}`;
  const filePath = path.join(UPLOAD_DIR, fileName);
  if (file.buffer) await fs.promises.writeFile(filePath, file.buffer);
  else if (file.path) await fs.promises.copyFile(file.path, filePath);
  else throw new Error('Fichier invalide');
  return `/uploads/${fileName}`;
};

const generateUniqueSlug = async (title) => {
  const baseSlug = slugify(title, { lower: true, strict: true });
  let slug = baseSlug;
  let counter = 1;
  while (await Event.exists({ slug })) {
    slug = `${baseSlug}-${counter++}`;
  }
  return slug;
};

const createEvent = async (data, userId, file) => {
  const eventData = { ...data, userId, published: false, slug: await generateUniqueSlug(data.title) };
  if (file) eventData.coverImage = await saveFileLocal(file);
  return Event.create(eventData);
};

const getEventsByUser = async (userId) => Event.find({ userId }).sort({ createdAt: -1 });
const getEventById = async (eventId, userId) => {
  const event = await Event.findOne({ _id: eventId, userId });
  if (!event) throw new Error('Événement non trouvé');
  return event;
};
const addGuestBookMessage = async (eventId, { name, message }) => {
  const event = await Event.findById(eventId);
  if (!event) throw new Error('Événement non trouvé');
  event.guestbook.push({ guestName: name, message });
  await event.save();
  return event;
};
const addGuestBookBySlug = async (slug, { guestName, message }) => {
  const event = await Event.findOne({ slug, published: true });
  if (!event) throw new Error('Événement non trouvé');
  event.guestbook.push({ guestName, message });
  await event.save();
  return event;
};
const updateEvent = async (eventId, userId, data, file) => {
  if (file) data.coverImage = await saveFileLocal(file);
  delete data.slug;
  delete data.invitationLink;
  const event = await Event.findOneAndUpdate({ _id: eventId, userId }, data, { new: true });
  if (!event) throw new Error('Événement non trouvé');
  return event;
};
const deleteEvent = async (eventId, userId) => {
  const event = await Event.findOneAndDelete({ _id: eventId, userId });
  if (!event) throw new Error('Événement non trouvé');
  return event;
};
const publishEvent = async (eventId, userId) => {
  const event = await Event.findOneAndUpdate({ _id: eventId, userId }, { published: true }, { new: true });
  if (!event) throw new Error('Événement non trouvé');
  return event;
};
const getPublicEventBySlug = async (slug) => {
  const event = await Event.findOne({ slug, published: true });
  if (!event) throw new Error('Événement non disponible');
  return event;
};

module.exports = {
  createEvent,
  getEventsByUser,
  getEventById,
  addGuestBookMessage,
  addGuestBookBySlug,
  updateEvent,
  deleteEvent,
  publishEvent,
  getPublicEventBySlug,
};
