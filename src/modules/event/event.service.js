const Event = require('./event.model');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const slugify = require('slugify');

// ==================== UPLOAD LOCAL ====================

const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const saveFileLocal = async (file) => {
  if (!file || !file.buffer) throw new Error('Fichier invalide');

  const fileName = `${uuidv4()}-${file.originalname}`;
  const filePath = path.join(UPLOAD_DIR, fileName);

  await fs.promises.writeFile(filePath, file.buffer);

  return `/uploads/${fileName}`;
};

// ==================== UTILITAIRE SLUG ====================

const generateUniqueSlug = async (title) => {
  const baseSlug = slugify(title, { lower: true, strict: true });
  let slug = baseSlug;
  let counter = 1;

  while (await Event.findOne({ slug })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
};

// ==================== SERVICES ====================

// ✅ CRÉER UN ÉVÉNEMENT (avec slug)
const createEvent = async (data, organizerId, file) => {
  const eventData = {
    ...data,
    organizerId,
    slug: await generateUniqueSlug(data.title),
    published: false,
  };

  if (file) {
    eventData.coverImage = await saveFileLocal(file);
  }

  const event = new Event(eventData);
  await event.save();
  return event;
};

// ✅ RÉCUPÉRER TOUS LES ÉVÉNEMENTS D’UN ORGANISATEUR
const getEventsByOrganizer = async (organizerId) => {
  return Event.find({ organizerId }).sort({ date: 1 });
};

// ✅ RÉCUPÉRER UN ÉVÉNEMENT PAR ID
const getEventById = async (id, organizerId) => {
  return Event.findOne({ _id: id, organizerId });
};

// ✅ AJOUTER MESSAGE AU LIVRE D’OR
const addGuestBookMessage = async (eventId, { name, message }) => {
  const event = await Event.findById(eventId);
  if (!event) throw new Error('Événement non trouvé');

  event.guestbook = event.guestbook || [];
  event.guestbook.push({
    guestName: name,
    message,
    createdAt: new Date(),
  });

  await event.save();
  return event;
};

// ✅ SUPPRIMER UN ÉVÉNEMENT
const deleteEvent = async (eventId, organizerId) => {
  const event = await Event.findOneAndDelete({ _id: eventId, organizerId });
  if (!event) throw new Error('Événement non trouvé');
  return event;
};

// ✅ METTRE À JOUR (⚠️ slug inchangé)
const updateEvent = async (eventId, organizerId, data, file) => {
  if (file) {
    data.coverImage = await saveFileLocal(file);
  }

  // ⚠️ Interdiction de modifier le slug manuellement
  delete data.slug;

  const event = await Event.findOneAndUpdate(
    { _id: eventId, organizerId },
    { ...data, updatedAt: new Date() },
    { new: true }
  );

  if (!event) throw new Error('Événement non trouvé');
  return event;
};

// ✅ PUBLIER UN ÉVÉNEMENT
const publishEvent = async (eventId, organizerId) => {
  const event = await Event.findOneAndUpdate(
    { _id: eventId, organizerId },
    { published: true },
    { new: true }
  );

  if (!event) throw new Error('Événement non trouvé');
  return event;
};

// ✅ ÉVÉNEMENT PUBLIC (LIEN D’INVITATION)
const getPublicEventBySlug = async (slug) => {
  const event = await Event.findOne({ slug, published: true });
  if (!event) throw new Error('Événement non disponible');
  return event;
};

module.exports = {
  createEvent,
  getEventsByOrganizer,
  getEventById,
  addGuestBookMessage,
  deleteEvent,
  updateEvent,
  publishEvent,
  getPublicEventBySlug,
};
