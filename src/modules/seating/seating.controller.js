const seatingService = require('./seating.service');

const handleError = (res, err) => {
  console.error('Seating error:', err);
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Erreur serveur',
  });
};

exports.getOverview = async (req, res) => {
  try {
    const data = await seatingService.getOverview(req.user, req.params.eventId);
    res.json({ success: true, data });
  } catch (err) {
    handleError(res, err);
  }
};

exports.generateTables = async (req, res) => {
  try {
    const tables = await seatingService.generateTables(req.user, req.params.eventId, req.body);
    res.status(201).json({ success: true, data: tables });
  } catch (err) {
    handleError(res, err);
  }
};

exports.skipSetup = async (req, res) => {
  try {
    const seating = await seatingService.skipSetup(req.user, req.params.eventId);
    res.json({ success: true, data: seating });
  } catch (err) {
    handleError(res, err);
  }
};

exports.createTable = async (req, res) => {
  try {
    const table = await seatingService.createTable(req.user, req.params.eventId, req.body);
    res.status(201).json({ success: true, data: table });
  } catch (err) {
    handleError(res, err);
  }
};

exports.updateTable = async (req, res) => {
  try {
    const table = await seatingService.updateTable(req.user, req.params.tableId, req.body);
    res.json({ success: true, data: table });
  } catch (err) {
    handleError(res, err);
  }
};

exports.deleteTable = async (req, res) => {
  try {
    const result = await seatingService.deleteTable(req.user, req.params.tableId);
    res.json({ success: true, data: result });
  } catch (err) {
    handleError(res, err);
  }
};

exports.assignGuest = async (req, res) => {
  try {
    const { tableId } = req.body;
    const guest = await seatingService.assignGuest(req.user, req.params.guestId, tableId || null);
    res.json({ success: true, data: guest });
  } catch (err) {
    handleError(res, err);
  }
};

exports.autoDistribute = async (req, res) => {
  try {
    const result = await seatingService.autoDistribute(req.user, req.params.eventId, req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    handleError(res, err);
  }
};

exports.createGroup = async (req, res) => {
  try {
    const group = await seatingService.createGroup(req.user, req.params.eventId, req.body);
    res.status(201).json({ success: true, data: group });
  } catch (err) {
    handleError(res, err);
  }
};

exports.createPresetGroups = async (req, res) => {
  try {
    const groups = await seatingService.createPresetGroups(req.user, req.params.eventId);
    res.json({ success: true, data: groups });
  } catch (err) {
    handleError(res, err);
  }
};

exports.updateGroup = async (req, res) => {
  try {
    const group = await seatingService.updateGroup(req.user, req.params.groupId, req.body);
    res.json({ success: true, data: group });
  } catch (err) {
    handleError(res, err);
  }
};

exports.deleteGroup = async (req, res) => {
  try {
    const result = await seatingService.deleteGroup(req.user, req.params.groupId);
    res.json({ success: true, data: result });
  } catch (err) {
    handleError(res, err);
  }
};

exports.assignGuestToGroup = async (req, res) => {
  try {
    const { groupId } = req.body;
    const guest = await seatingService.assignGuestToGroup(req.user, req.params.guestId, groupId || null);
    res.json({ success: true, data: guest });
  } catch (err) {
    handleError(res, err);
  }
};

exports.search = async (req, res) => {
  try {
    const data = await seatingService.search(req.user, req.params.eventId, req.query.q);
    res.json({ success: true, data });
  } catch (err) {
    handleError(res, err);
  }
};

exports.updatePositions = async (req, res) => {
  try {
    const tables = await seatingService.updatePositions(req.user, req.params.eventId, req.body.positions || []);
    res.json({ success: true, data: tables });
  } catch (err) {
    handleError(res, err);
  }
};

exports.getPrintData = async (req, res) => {
  try {
    const data = await seatingService.getPrintData(
      req.user,
      req.params.eventId,
      req.query.tableId || null
    );
    res.json({ success: true, data });
  } catch (err) {
    handleError(res, err);
  }
};
