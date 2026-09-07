const Event = require('../event/event.model');
const MarqueTable = require('./marqueTable.model');

class MarqueTableError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

async function assertEventAccess(user, eventId) {
  const event = await Event.findById(eventId);
  if (!event) throw new MarqueTableError('Événement non trouvé', 404);

  const isOwner = String(event.userId) === String(user.id || user._id);
  if (user.role !== 'superadmin' && !isOwner) {
    throw new MarqueTableError(
      "Accès refusé. Vous n'avez pas le droit de gérer cet événement.",
      403,
    );
  }

  return event;
}

function sanitizePayload(body = {}) {
  const data = {};
  const fields = [
    'number',
    'label',
    'titleText',
    'displayNameOverride',
    'displayDateOverride',
    'order',
    'design',
    'tableId',
  ];

  for (const field of fields) {
    if (body[field] !== undefined) {
      data[field] = body[field];
    }
  }

  if (data.displayNameOverride === '') data.displayNameOverride = null;
  if (data.displayDateOverride === '') data.displayDateOverride = null;
  if (data.tableId === '') data.tableId = null;
  if (data.number !== undefined) data.number = String(data.number).trim();
  if (data.titleText === undefined && data.number !== undefined) {
    // keep titleText independent; caller may set both
  }

  return data;
}

/**
 * Déduit label / titleText depuis le nom d'une table seating.
 * Ex. "Table 3" → label "Table", titleText "3"
 * Ex. "VIP" → label "", titleText "VIP"
 */
function payloadFromSeatingTable(table, order) {
  const numberStr = String(table.number ?? '');
  const name = String(table.name || '').trim() || `Table ${numberStr}`;
  const tableId = table._id || table.id || null;

  const match = name.match(/^(.+?)\s+(\S+)$/);
  let label = 'Table';
  let titleText = numberStr || name;

  if (match) {
    const left = match[1].trim();
    const right = match[2].trim();
    if (/^table$/i.test(left)) {
      label = 'Table';
      titleText = right;
    } else {
      label = left;
      titleText = right;
    }
  } else {
    label = '';
    titleText = name;
  }

  return {
    tableId,
    number: numberStr || titleText,
    label,
    titleText,
    order:
      order !== undefined
        ? order
        : Math.max(0, Number(table.number || 1) - 1),
  };
}

/** Crée les marque-tables liés aux tables seating (après génération). */
async function createManyFromSeatingTables(eventId, tables = []) {
  if (!tables.length) return [];

  const tableIds = tables.map((t) => t._id).filter(Boolean);
  if (tableIds.length) {
    await MarqueTable.deleteMany({ eventId, tableId: { $in: tableIds } });
  }

  const docs = tables.map((table, index) => ({
    eventId,
    ...payloadFromSeatingTable(table, index),
    design: {},
  }));

  return MarqueTable.insertMany(docs);
}

async function upsertFromSeatingTable(table) {
  if (!table?._id) return null;

  const payload = payloadFromSeatingTable(table);
  const existing = await MarqueTable.findOne({ tableId: table._id });

  if (!existing) {
    const count = await MarqueTable.countDocuments({ eventId: table.eventId });
    return MarqueTable.create({
      eventId: table.eventId,
      ...payload,
      order: payload.order ?? count,
      design: {},
    });
  }

  existing.number = payload.number;
  existing.label = payload.label;
  existing.titleText = payload.titleText;
  existing.tableId = payload.tableId;
  await existing.save();
  return existing;
}

async function removeBySeatingTableId(tableId) {
  if (!tableId) return;
  await MarqueTable.deleteMany({ tableId });
}

async function listByEvent(user, eventId) {
  await assertEventAccess(user, eventId);
  return MarqueTable.find({ eventId }).sort({ order: 1, createdAt: 1 });
}

async function getById(user, id) {
  const doc = await MarqueTable.findById(id);
  if (!doc) throw new MarqueTableError('Marque-table introuvable', 404);
  await assertEventAccess(user, doc.eventId);
  return doc;
}

async function create(user, eventId, payload) {
  await assertEventAccess(user, eventId);

  const count = await MarqueTable.countDocuments({ eventId });
  const data = sanitizePayload(payload);

  if (!data.number) data.number = String(count + 1);
  if (!data.titleText) data.titleText = data.number;
  if (data.order === undefined) data.order = count;

  const doc = await MarqueTable.create({
    ...data,
    eventId,
  });

  return doc;
}

async function update(user, id, payload) {
  const doc = await MarqueTable.findById(id);
  if (!doc) throw new MarqueTableError('Marque-table introuvable', 404);
  await assertEventAccess(user, doc.eventId);

  const data = sanitizePayload(payload);

  if (data.design && typeof data.design === 'object') {
    doc.design = {
      ...(doc.design?.toObject?.() || doc.design || {}),
      ...data.design,
      border: {
        ...(doc.design?.border || {}),
        ...(data.design.border || {}),
      },
      decoration: {
        ...(doc.design?.decoration || {}),
        ...(data.design.decoration || {}),
      },
      label: { ...(doc.design?.label || {}), ...(data.design.label || {}) },
      title: { ...(doc.design?.title || {}), ...(data.design.title || {}) },
      names: { ...(doc.design?.names || {}), ...(data.design.names || {}) },
      date: { ...(doc.design?.date || {}), ...(data.design.date || {}) },
    };
    delete data.design;
  }

  Object.assign(doc, data);
  await doc.save();
  return doc;
}

async function remove(user, id) {
  const doc = await MarqueTable.findById(id);
  if (!doc) throw new MarqueTableError('Marque-table introuvable', 404);
  await assertEventAccess(user, doc.eventId);
  await doc.deleteOne();
  return { id: String(doc._id) };
}

async function duplicate(user, id) {
  const source = await MarqueTable.findById(id);
  if (!source) throw new MarqueTableError('Marque-table introuvable', 404);
  await assertEventAccess(user, source.eventId);

  const maxOrder = await MarqueTable.findOne({ eventId: source.eventId })
    .sort({ order: -1 })
    .select('order');

  const nextOrder = (maxOrder?.order ?? 0) + 1;
  const numeric = Number(source.number);
  const nextNumber = Number.isFinite(numeric)
    ? String(numeric + 1)
    : `${source.number}-copie`;

  const design =
    source.design?.toObject?.() ||
    (source.design ? JSON.parse(JSON.stringify(source.design)) : {});

  const copy = await MarqueTable.create({
    eventId: source.eventId,
    number: nextNumber,
    label: source.label,
    titleText: source.titleText === source.number ? nextNumber : source.titleText,
    displayNameOverride: source.displayNameOverride,
    displayDateOverride: source.displayDateOverride,
    tableId: null,
    order: nextOrder,
    design,
  });

  return copy;
}

/** Crée / met à jour les marque-tables à partir des tables seating existantes. */
async function syncFromEventTables(user, eventId) {
  await assertEventAccess(user, eventId);
  const Table = require('../seating/table.model');
  const tables = await Table.find({ eventId }).sort({ number: 1 });

  if (!tables.length) {
    throw new MarqueTableError(
      'Aucune table seating trouvée. Générez d’abord les tables.',
      400,
    );
  }

  const results = [];
  for (let i = 0; i < tables.length; i += 1) {
    const payload = payloadFromSeatingTable(tables[i], i);
    const existing = await MarqueTable.findOne({ tableId: tables[i]._id });
    if (existing) {
      existing.number = payload.number;
      existing.label = payload.label;
      existing.titleText = payload.titleText;
      existing.order = i;
      await existing.save();
      results.push(existing);
    } else {
      const created = await MarqueTable.create({
        eventId,
        ...payload,
        order: i,
        design: {},
      });
      results.push(created);
    }
  }

  return MarqueTable.find({ eventId }).sort({ order: 1, createdAt: 1 });
}

async function reorder(user, eventId, items) {
  await assertEventAccess(user, eventId);

  if (!Array.isArray(items) || items.length === 0) {
    throw new MarqueTableError('Liste de réordonnancement requise', 400);
  }

  const ops = items.map((item, index) => ({
    updateOne: {
      filter: { _id: item.id, eventId },
      update: { $set: { order: item.order ?? index } },
    },
  }));

  await MarqueTable.bulkWrite(ops);
  return MarqueTable.find({ eventId }).sort({ order: 1, createdAt: 1 });
}

module.exports = {
  MarqueTableError,
  assertEventAccess,
  listByEvent,
  getById,
  create,
  update,
  remove,
  duplicate,
  reorder,
  payloadFromSeatingTable,
  createManyFromSeatingTables,
  upsertFromSeatingTable,
  removeBySeatingTableId,
  syncFromEventTables,
};
