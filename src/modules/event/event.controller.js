const eventService = require('./event.service');

// Créer un événement
const createEvent = async (req, res, next) => {
  try {
    const file = req.file || null; // Multer ajoute le fichier ici
    const event = await eventService.createEvent(req.body, req.user.id, file);
    res.status(201).json({ success: true, message: 'Événement créé', event });
  } catch (err) {
    next(err);
  }
};

// Récupérer tous les événements de l'organisateur
const getEvents = async (req, res, next) => {
  try {
    const events = await eventService.getEventsByOrganizer(req.user.id);
    res.json({ success: true, events });
  } catch (err) {
    next(err);
  }
};

// Récupérer un événement par ID
const getEvent = async (req, res, next) => {
  try {
    const event = await eventService.getEventById(req.params.id, req.user.id);
    if (!event) return res.status(404).json({ success: false, message: 'Événement non trouvé' });
    res.json({ success: true, event });
  } catch (err) {
    next(err);
  }
};

// Mettre à jour un événement
const updateEvent = async (req, res, next) => {
  try {
    const file = req.file || null;
    const event = await eventService.updateEvent(req.params.id, req.user.id, req.body, file);
    res.json({ success: true, message: 'Événement mis à jour', event });
  } catch (err) {
    next(err);
  }
};

// Supprimer un événement
const deleteEvent = async (req, res, next) => {
  try {
    await eventService.deleteEvent(req.params.id, req.user.id);
    res.json({ success: true, message: 'Événement supprimé' });
  } catch (err) {
    next(err);
  }
};

// Ajouter un message au livre d'or
const addGuestBook = async (req, res, next) => {
  try {
    const { name, message } = req.body;
    if (!name || !message) {
      return res.status(400).json({ success: false, message: 'Nom et message requis' });
    }

    const event = await eventService.addGuestBookMessage(req.params.id, { name, message });
    res.json({ success: true, message: 'Message ajouté au livre d’or', event });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createEvent,
  getEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  addGuestBook,
};
