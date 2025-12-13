const Event = require('./event.model');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Dossier local pour stocker les images
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Fonction utilitaire pour sauvegarder un fichier localement
const saveFileLocal = async (file) => {
  if (!file || !file.buffer) throw new Error('Fichier invalide');
  
  const fileName = `${uuidv4()}-${file.originalname}`;
  const filePath = path.join(UPLOAD_DIR, fileName);
  
  await fs.promises.writeFile(filePath, file.buffer);
  
  // Retourne le chemin relatif pour accéder à l'image depuis le serveur
  return `/uploads/${fileName}`;
};

// ==================== SERVICES ====================

// Créer un événement
const createEvent = async (data, organizerId, file) => {
  const eventData = { ...data, organizerId };

  if (file) {
    eventData.coverImage = await saveFileLocal(file);
  }

  const event = new Event(eventData);
  await event.save();
  return event;
};

// Récupérer tous les événements d’un organisateur
const getEventsByOrganizer = async (organizerId) => {
  return Event.find({ organizerId }).sort({ date: 1 });
};

// Récupérer un événement par ID et organisateur
const getEventById = async (id, organizerId) => {
  return Event.findOne({ _id: id, organizerId });
};

// Ajouter un message au livre d’or
const addGuestBookMessage = async (eventId, { name, message }) => {
  const event = await Event.findById(eventId);
  if (!event) throw new Error('Événement non trouvé');

  event.guestbook = event.guestbook || [];
  event.guestbook.push({ name, message, createdAt: new Date() });

  await event.save();
  return event;
};

// Supprimer un événement
const deleteEvent = async (eventId, organizerId) => {
  const event = await Event.findOneAndDelete({ _id: eventId, organizerId });
  if (!event) throw new Error('Événement non trouvé');
  return event;
};

// Mettre à jour un événement
const updateEvent = async (eventId, organizerId, data, file) => {
  if (file) {
    data.coverImage = await saveFileLocal(file);
  }

  const event = await Event.findOneAndUpdate(
    { _id: eventId, organizerId },
    { ...data, updatedAt: new Date() },
    { new: true }
  );

  if (!event) throw new Error('Événement non trouvé');
  return event;
};

module.exports = {
  createEvent,
  getEventsByOrganizer,
  getEventById,
  addGuestBookMessage,
  deleteEvent,
  updateEvent,
};
