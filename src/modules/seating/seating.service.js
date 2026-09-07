const Event = require('../event/event.model');
const Guest = require('../guest/guest.model');
const Table = require('./table.model');
const GuestGroup = require('./guestGroup.model');
const marqueTableService = require('../marque-table/marque-table.service');

const TABLE_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#3b82f6',
  '#a855f7',
  '#ef4444',
];

const PRESET_GROUPS = [
  { name: 'Famille', type: 'family' },
  { name: 'VIP', type: 'vip' },
  { name: 'Sponsors', type: 'sponsors' },
  { name: 'Partenaires', type: 'partners' },
  { name: 'Presse', type: 'press' },
  { name: 'Équipe organisatrice', type: 'organizers' },
  { name: 'Amis', type: 'friends' },
  { name: 'Collègues', type: 'colleagues' },
  { name: 'Invités d\'honneur', type: 'honorees' },
];

class SeatingError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

async function assertEventAccess(user, eventId) {
  const event = await Event.findById(eventId);
  if (!event) throw new SeatingError('Événement non trouvé', 404);

  const isOwner = String(event.userId) === String(user.id || user._id);
  if (user.role !== 'superadmin' && !isOwner) {
    throw new SeatingError('Accès refusé. Vous n\'avez pas le droit de gérer cet événement.', 403);
  }

  return event;
}

async function countGuestsAtTable(tableId) {
  return Guest.countDocuments({ tableId });
}

async function enrichTablesWithCounts(tables) {
  const tableIds = tables.map((t) => t._id);
  const counts = await Guest.aggregate([
    { $match: { tableId: { $in: tableIds } } },
    { $group: { _id: '$tableId', count: { $sum: 1 } } },
  ]);

  const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.count]));

  return tables.map((table) => {
    const json = table.toJSON ? table.toJSON() : table;
    const guestCount = countMap[String(table._id || table.id)] || 0;
    return {
      ...json,
      guestCount,
      remainingSeats: Math.max(0, json.capacity - guestCount),
      isFull: guestCount >= json.capacity,
      fillRate: json.capacity > 0 ? Math.round((guestCount / json.capacity) * 100) : 0,
    };
  });
}

function computeTableStatus(guestCount, capacity) {
  if (guestCount >= capacity) return 'full';
  if (guestCount >= capacity * 0.8) return 'almost_full';
  return 'available';
}

async function buildStats(eventId, tables) {
  const enriched = await enrichTablesWithCounts(tables);
  const totalGuests = await Guest.countDocuments({ eventId });
  const assignedGuests = await Guest.countDocuments({ eventId, tableId: { $ne: null } });
  const totalCapacity = enriched.reduce((sum, t) => sum + t.capacity, 0);
  const totalOccupied = enriched.reduce((sum, t) => sum + t.guestCount, 0);
  const fullTables = enriched.filter((t) => t.isFull).length;
  const incompleteTables = enriched.filter((t) => t.guestCount > 0 && !t.isFull).length;
  const emptyTables = enriched.filter((t) => t.guestCount === 0).length;

  return {
    totalGuests,
    assignedGuests,
    unassignedGuests: totalGuests - assignedGuests,
    tableCount: enriched.length,
    totalCapacity,
    totalOccupied,
    totalRemainingSeats: Math.max(0, totalCapacity - totalOccupied),
    fullTables,
    incompleteTables,
    emptyTables,
    globalFillRate: totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0,
  };
}

async function getOverview(user, eventId) {
  const event = await assertEventAccess(user, eventId);
  const [tables, groups, guests] = await Promise.all([
    Table.find({ eventId }).sort({ number: 1 }),
    GuestGroup.find({ eventId }).sort({ name: 1 }),
    Guest.find({ eventId })
      .populate('tableId', 'name number capacity color')
      .populate('groupId', 'name type color')
      .sort({ name: 1 }),
  ]);

  const enrichedTables = await enrichTablesWithCounts(tables);
  const tablesWithStatus = enrichedTables.map((t) => ({
    ...t,
    status: computeTableStatus(t.guestCount, t.capacity),
  }));

  const stats = await buildStats(eventId, tables);

  return {
    event: {
      id: event._id,
      title: event.title,
      coverImage: event.coverImage,
      seating: event.seating || { configured: false },
    },
    tables: tablesWithStatus,
    groups,
    guests,
    stats,
  };
}

async function generateTables(user, eventId, config) {
  const event = await assertEventAccess(user, eventId);
  const {
    expectedGuestCount,
    method,
    tableCount,
    capacityPerTable,
  } = config;

  if (!expectedGuestCount || expectedGuestCount < 1) {
    throw new SeatingError('Le nombre d\'invités attendus doit être supérieur à 0');
  }

  let finalTableCount;
  let finalCapacity;

  if (method === 'by_table_count') {
    if (!tableCount || tableCount < 1) {
      throw new SeatingError('Le nombre de tables doit être supérieur à 0');
    }
    finalTableCount = tableCount;
    finalCapacity = Math.ceil(expectedGuestCount / tableCount);
  } else if (method === 'by_capacity') {
    if (!capacityPerTable || capacityPerTable < 1) {
      throw new SeatingError('La capacité par table doit être supérieure à 0');
    }
    finalCapacity = capacityPerTable;
    finalTableCount = Math.ceil(expectedGuestCount / capacityPerTable);
  } else {
    throw new SeatingError('Méthode de configuration invalide');
  }

  const existingCount = await Table.countDocuments({ eventId });
  if (existingCount > 0) {
    throw new SeatingError('Des tables existent déjà pour cet événement. Supprimez-les ou modifiez-les manuellement.');
  }

  const tablesToCreate = [];
  for (let i = 1; i <= finalTableCount; i++) {
    tablesToCreate.push({
      eventId,
      name: `Table ${i}`,
      number: i,
      capacity: finalCapacity,
      color: TABLE_COLORS[(i - 1) % TABLE_COLORS.length],
      position: {
        x: ((i - 1) % 5) * 120 + 40,
        y: Math.floor((i - 1) / 5) * 120 + 40,
      },
    });
  }

  const created = await Table.insertMany(tablesToCreate);

  event.seating = {
    configured: true,
    expectedGuestCount,
    setupMethod: method,
  };
  await event.save();

  // Marque-tables générés automatiquement selon les noms des tables
  await marqueTableService.createManyFromSeatingTables(eventId, created);

  return enrichTablesWithCounts(created);
}

async function skipSetup(user, eventId) {
  const event = await assertEventAccess(user, eventId);
  event.seating = {
    ...(event.seating?.toObject?.() || event.seating || {}),
    skippedAt: new Date(),
  };
  await event.save();
  return event.seating;
}

async function createTable(user, eventId, data) {
  await assertEventAccess(user, eventId);

  const maxNumber = await Table.findOne({ eventId }).sort({ number: -1 }).select('number');
  const nextNumber = data.number || (maxNumber ? maxNumber.number + 1 : 1);

  const table = await Table.create({
    eventId,
    name: data.name?.trim() || `Table ${nextNumber}`,
    number: nextNumber,
    capacity: data.capacity || 10,
    color: data.color || TABLE_COLORS[(nextNumber - 1) % TABLE_COLORS.length],
    description: data.description || '',
    position: data.position || { x: 40, y: 40 },
  });

  const event = await Event.findById(eventId);
  if (event && !event.seating?.configured) {
    event.seating = { ...(event.seating?.toObject?.() || {}), configured: true, setupMethod: 'manual' };
    await event.save();
  }

  await marqueTableService.upsertFromSeatingTable(table);

  const enriched = await enrichTablesWithCounts([table]);
  return enriched[0];
}

async function updateTable(user, tableId, data) {
  const table = await Table.findById(tableId);
  if (!table) throw new SeatingError('Table introuvable', 404);

  await assertEventAccess(user, table.eventId);

  if (data.capacity !== undefined) {
    const guestCount = await countGuestsAtTable(table._id);
    if (data.capacity < guestCount) {
      throw new SeatingError(
        `Impossible de réduire la capacité à ${data.capacity}. Cette table contient déjà ${guestCount} invité(s).`
      );
    }
    table.capacity = data.capacity;
  }

  if (data.name !== undefined) table.name = data.name.trim();
  if (data.description !== undefined) table.description = data.description;
  if (data.color !== undefined) table.color = data.color;
  if (data.number !== undefined) table.number = data.number;
  if (data.position !== undefined) table.position = data.position;

  await table.save();

  if (data.name !== undefined) {
    await Guest.updateMany({ tableId: table._id }, { table: table.name });
  }

  if (data.name !== undefined || data.number !== undefined) {
    await marqueTableService.upsertFromSeatingTable(table);
  }

  const enriched = await enrichTablesWithCounts([table]);
  return enriched[0];
}

async function deleteTable(user, tableId) {
  const table = await Table.findById(tableId);
  if (!table) throw new SeatingError('Table introuvable', 404);

  await assertEventAccess(user, table.eventId);

  const guestCount = await countGuestsAtTable(table._id);
  if (guestCount > 0) {
    throw new SeatingError('Impossible de supprimer une table contenant des invités. Retirez d\'abord les invités.');
  }

  await Table.deleteOne({ _id: table._id });
  await marqueTableService.removeBySeatingTableId(table._id);
  return { deleted: true };
}

async function assignGuest(user, guestId, tableId) {
  const guest = await Guest.findById(guestId);
  if (!guest) throw new SeatingError('Invité introuvable', 404);

  await assertEventAccess(user, guest.eventId);

  if (!tableId) {
    guest.tableId = null;
    guest.table = '';
    await guest.save();
    return guest;
  }

  const table = await Table.findById(tableId);
  if (!table) throw new SeatingError('Table introuvable', 404);
  if (String(table.eventId) !== String(guest.eventId)) {
    throw new SeatingError('Cette table n\'appartient pas au même événement');
  }

  const guestCount = await countGuestsAtTable(table._id);
  const isSameTable = guest.tableId && String(guest.tableId) === String(table._id);
  if (!isSameTable && guestCount >= table.capacity) {
    throw new SeatingError('Cette table est complète. Veuillez sélectionner une autre table.');
  }

  guest.tableId = table._id;
  guest.table = table.name;
  await guest.save();
  return guest;
}

async function autoDistribute(user, eventId, options = {}) {
  await assertEventAccess(user, eventId);
  const { respectGroups = true, onlyUnassigned = true } = options;

  const tables = await Table.find({ eventId }).sort({ number: 1 });
  if (!tables.length) throw new SeatingError('Aucune table configurée pour cet événement');

  const enriched = await enrichTablesWithCounts(tables);
  const remaining = enriched.map((t) => ({
    table: tables.find((tb) => String(tb._id) === String(t.id || t._id)),
    remaining: t.remainingSeats,
    guestCount: t.guestCount,
  }));

  const query = { eventId };
  if (onlyUnassigned) query.tableId = null;

  let guests = await Guest.find(query).populate('groupId').sort({ name: 1 });

  if (!guests.length) {
    return { assigned: 0, unassigned: 0, message: 'Aucun invité à répartir' };
  }

  if (onlyUnassigned === false) {
    await Guest.updateMany({ eventId }, { $set: { tableId: null, table: '' } });
    remaining.forEach((r) => {
      r.remaining = r.table.capacity;
      r.guestCount = 0;
    });
    guests = await Guest.find({ eventId }).populate('groupId').sort({ name: 1 });
  }

  let assigned = 0;

  const assignToTable = async (guest, slot) => {
    if (slot.remaining <= 0) return false;
    guest.tableId = slot.table._id;
    guest.table = slot.table.name;
    await guest.save();
    slot.remaining -= 1;
    slot.guestCount += 1;
    assigned += 1;
    return true;
  };

  if (respectGroups) {
    const byGroup = new Map();
    const ungrouped = [];

    for (const guest of guests) {
      const gid = guest.groupId ? String(guest.groupId._id || guest.groupId) : null;
      if (gid) {
        if (!byGroup.has(gid)) byGroup.set(gid, []);
        byGroup.get(gid).push(guest);
      } else {
        ungrouped.push(guest);
      }
    }

    const sortedGroups = [...byGroup.entries()].sort((a, b) => b[1].length - a[1].length);

    for (const [, groupGuests] of sortedGroups) {
      let idx = 0;
      while (idx < groupGuests.length) {
        const slot = remaining
          .filter((r) => r.remaining > 0)
          .sort((a, b) => b.remaining - a.remaining)[0];

        if (!slot) break;

        const batch = groupGuests.slice(idx, idx + slot.remaining);
        for (const guest of batch) {
          await assignToTable(guest, slot);
        }
        idx += batch.length;
      }
    }

    for (const guest of ungrouped) {
      const slot = remaining.find((r) => r.remaining > 0);
      if (!slot) break;
      await assignToTable(guest, slot);
    }
  } else {
    for (const guest of guests) {
      const slot = remaining.find((r) => r.remaining > 0);
      if (!slot) break;
      await assignToTable(guest, slot);
    }
  }

  const unassigned = await Guest.countDocuments({ eventId, tableId: null });
  return { assigned, unassigned };
}

async function createGroup(user, eventId, data) {
  await assertEventAccess(user, eventId);
  const group = await GuestGroup.create({
    eventId,
    name: data.name.trim(),
    type: data.type || 'custom',
    color: data.color || '',
  });
  return group;
}

async function createPresetGroups(user, eventId) {
  await assertEventAccess(user, eventId);
  const existing = await GuestGroup.countDocuments({ eventId });
  if (existing > 0) return GuestGroup.find({ eventId });

  const created = await GuestGroup.insertMany(
    PRESET_GROUPS.map((g, i) => ({
      eventId,
      ...g,
      color: TABLE_COLORS[i % TABLE_COLORS.length],
    }))
  );
  return created;
}

async function updateGroup(user, groupId, data) {
  const group = await GuestGroup.findById(groupId);
  if (!group) throw new SeatingError('Groupe introuvable', 404);
  await assertEventAccess(user, group.eventId);

  if (data.name !== undefined) group.name = data.name.trim();
  if (data.type !== undefined) group.type = data.type;
  if (data.color !== undefined) group.color = data.color;
  await group.save();
  return group;
}

async function deleteGroup(user, groupId) {
  const group = await GuestGroup.findById(groupId);
  if (!group) throw new SeatingError('Groupe introuvable', 404);
  await assertEventAccess(user, group.eventId);

  await Guest.updateMany({ groupId: group._id }, { $set: { groupId: null } });
  await GuestGroup.deleteOne({ _id: group._id });
  return { deleted: true };
}

async function assignGuestToGroup(user, guestId, groupId) {
  const guest = await Guest.findById(guestId);
  if (!guest) throw new SeatingError('Invité introuvable', 404);
  await assertEventAccess(user, guest.eventId);

  if (!groupId) {
    guest.groupId = null;
    await guest.save();
    return guest;
  }

  const group = await GuestGroup.findById(groupId);
  if (!group || String(group.eventId) !== String(guest.eventId)) {
    throw new SeatingError('Groupe invalide pour cet invité');
  }

  guest.groupId = group._id;
  await guest.save();
  return guest;
}

async function search(user, eventId, query) {
  await assertEventAccess(user, eventId);
  const q = String(query || '').trim().toLowerCase();
  if (!q) return { guests: [], tables: [] };

  const [guests, tables] = await Promise.all([
    Guest.find({ eventId, name: { $regex: q, $options: 'i' } })
      .populate('tableId', 'name number')
      .limit(20),
    Table.find({
      eventId,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ],
    }).limit(20),
  ]);

  return { guests, tables };
}

async function updatePositions(user, eventId, positions) {
  await assertEventAccess(user, eventId);

  for (const item of positions) {
    if (!item.id) continue;
    await Table.updateOne(
      { _id: item.id, eventId },
      { $set: { position: { x: item.x ?? 0, y: item.y ?? 0 } } }
    );
  }

  return Table.find({ eventId }).sort({ number: 1 });
}

async function getPrintData(user, eventId, tableId) {
  await assertEventAccess(user, eventId);
  const event = await Event.findById(eventId);

  if (tableId) {
    const table = await Table.findOne({ _id: tableId, eventId });
    if (!table) throw new SeatingError('Table introuvable', 404);

    const guests = await Guest.find({ tableId: table._id }).sort({ name: 1 });
    const guestCount = guests.length;

    return {
      event: { title: event.title, coverImage: event.coverImage },
      table: {
        ...table.toJSON(),
        guestCount,
        remainingSeats: Math.max(0, table.capacity - guestCount),
      },
      guests,
    };
  }

  const tables = await Table.find({ eventId }).sort({ number: 1 });
  const enriched = await enrichTablesWithCounts(tables);
  const allGuests = await Guest.find({ eventId }).populate('tableId', 'name number').sort({ name: 1 });

  return {
    event: { title: event.title, coverImage: event.coverImage },
    tables: enriched,
    guests: allGuests,
  };
}

async function cleanupEventSeating(eventId) {
  await Guest.updateMany({ eventId }, { $set: { tableId: null, table: '' } });
  const tables = await Table.find({ eventId }).select('_id');
  const tableIds = tables.map((t) => t._id);
  await Table.deleteMany({ eventId });
  await GuestGroup.deleteMany({ eventId });
  if (tableIds.length) {
    const MarqueTable = require('../marque-table/marqueTable.model');
    await MarqueTable.deleteMany({ eventId, tableId: { $in: tableIds } });
  }
}

module.exports = {
  SeatingError,
  PRESET_GROUPS,
  getOverview,
  generateTables,
  skipSetup,
  createTable,
  updateTable,
  deleteTable,
  assignGuest,
  autoDistribute,
  createGroup,
  createPresetGroups,
  updateGroup,
  deleteGroup,
  assignGuestToGroup,
  search,
  updatePositions,
  getPrintData,
  cleanupEventSeating,
  enrichTablesWithCounts,
};
