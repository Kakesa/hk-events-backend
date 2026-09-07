const service = require('./marque-table.service');
const { MarqueTableError } = service;

const handle = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (err) {
    const status = err instanceof MarqueTableError ? err.statusCode : 500;
    res.status(status).json({
      success: false,
      message: err.message || 'Erreur serveur',
    });
  }
};

exports.listByEvent = handle(async (req, res) => {
  const data = await service.listByEvent(req.user, req.params.eventId);
  res.json({ success: true, data });
});

exports.create = handle(async (req, res) => {
  const data = await service.create(req.user, req.params.eventId, req.body);
  res.status(201).json({ success: true, data });
});

exports.getById = handle(async (req, res) => {
  const data = await service.getById(req.user, req.params.id);
  res.json({ success: true, data });
});

exports.update = handle(async (req, res) => {
  const data = await service.update(req.user, req.params.id, req.body);
  res.json({ success: true, data });
});

exports.remove = handle(async (req, res) => {
  const data = await service.remove(req.user, req.params.id);
  res.json({ success: true, data, message: 'Marque-table supprimé' });
});

exports.duplicate = handle(async (req, res) => {
  const data = await service.duplicate(req.user, req.params.id);
  res.status(201).json({ success: true, data });
});

exports.reorder = handle(async (req, res) => {
  const data = await service.reorder(req.user, req.params.eventId, req.body.items);
  res.json({ success: true, data });
});

exports.syncFromTables = handle(async (req, res) => {
  const data = await service.syncFromEventTables(req.user, req.params.eventId);
  res.json({
    success: true,
    data,
    message: 'Marque-tables synchronisés depuis les tables',
  });
});
