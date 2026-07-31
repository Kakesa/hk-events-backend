const mongoose = require('mongoose');
const Event = require('../modules/event/event.model');
const Guest = require('../modules/guest/guest.model');
const User = require('../modules/users/users.model');
const CheckInLog = require('../modules/checkin/checkInLog.model');
const { parseScanToken, ensureGuestQrCode } = require('../utils/qr');
const { getEventEndDateTime } = require('../utils/eventTime');
const {
  detectSearchType,
  ensureGuestInvitationCode,
  formatInvitationCode,
} = require('../utils/invitationCode');
const { normalizePhoneToE164 } = require('../utils/phone');

class CheckInError extends Error {
  constructor(message, statusCode = 400, data = null) {
    super(message);
    this.statusCode = statusCode;
    this.data = data;
  }
}

async function assertEventAccess(user, eventId) {
  if (!mongoose.Types.ObjectId.isValid(eventId)) {
    throw new CheckInError('ID événement invalide', 400);
  }
  const event = await Event.findById(eventId);
  if (!event) throw new CheckInError('Événement introuvable', 404);

  const isSuperadmin = user.role === 'superadmin';
  const isOwner = String(event.userId) === String(user.id || user._id);
  if (!isOwner && !isSuperadmin) {
    throw new CheckInError('Accès refusé à cet événement', 403);
  }
  return event;
}

async function populateGuestForCheckIn(guest) {
  await guest.populate([
    { path: 'eventId', select: 'title date endTime userId' },
    { path: 'tableId', select: 'name number capacity' },
    { path: 'checkedInBy', select: 'name email' },
  ]);
}

function getTableLabel(guest) {
  if (guest.tableId?.name) {
    const num = guest.tableId.number ? ` ${guest.tableId.number}` : '';
    return `${guest.tableId.name}${num}`;
  }
  return guest.table || null;
}

function getSeatCount(guest) {
  if (guest.plusOne === true) return 2;
  const n = Number(guest.plusOneCount);
  return Number.isFinite(n) && n > 0 ? n + 1 : 1;
}

function mapGuestCheckInCard(guest, event) {
  const invitationStatus = guest.checkedIn
    ? 'CHECKED_IN'
    : guest.status === 'declined'
      ? 'CANCELLED'
      : guest.status === 'confirmed'
        ? 'CONFIRMED'
        : guest.status?.toUpperCase() || 'PENDING';

  return {
    id: guest._id,
    name: guest.name,
    phone: guest.phone || null,
    invitationCode: guest.invitationCode,
    eventId: guest.eventId?._id || guest.eventId,
    eventName: event?.title || guest.eventId?.title || '',
    table: getTableLabel(guest),
    seatCount: getSeatCount(guest),
    status: guest.status,
    invitationStatus,
    checkedIn: guest.checkedIn === true,
    checkedInAt: guest.checkedInAt || null,
    checkedInBy: guest.checkedInBy
      ? {
          id: guest.checkedInBy._id || guest.checkedInBy,
          name: guest.checkedInBy.name || guest.checkedInByName || '',
        }
      : guest.checkedInByName
        ? { id: null, name: guest.checkedInByName }
        : null,
    checkedInMethod: guest.checkedInMethod || null,
    canCheckIn:
      guest.status === 'confirmed' &&
      !guest.checkedIn &&
      invitationStatus !== 'CANCELLED',
    declineReason:
      guest.status === 'declined'
        ? 'Invitation annulée ou refusée'
        : guest.status !== 'confirmed'
          ? 'Invitation non confirmée'
          : null,
  };
}

async function resolveControllerName(user) {
  if (!user) return '';
  if (user.name) return user.name;
  const dbUser = await User.findById(user.id || user._id).select('name');
  return dbUser?.name || '';
}

async function writeCheckInLog({ eventId, guest, method, user }) {
  const controllerName = await resolveControllerName(user);
  await CheckInLog.create({
    eventId,
    guestId: guest._id,
    guestName: guest.name,
    method,
    checkedInBy: user ? user.id || user._id : null,
    checkedInByName: controllerName,
    checkedInAt: guest.checkedInAt || new Date(),
  });
}

async function performGuestCheckIn(guest, event, { method, user } = {}) {
  if (!guest || !event) {
    throw new CheckInError('Invitation introuvable', 404);
  }

  const eventEnd = getEventEndDateTime(event);
  if (eventEnd && new Date() > eventEnd) {
    throw new CheckInError('Événement terminé — entrée impossible', 403);
  }

  if (guest.status === 'declined') {
    throw new CheckInError('Invitation annulée', 403);
  }

  if (guest.status !== 'confirmed') {
    throw new CheckInError('Invitation non confirmée', 403);
  }

  if (guest.checkedIn) {
    await populateGuestForCheckIn(guest);
    throw new CheckInError('Cette invitation a déjà été utilisée.', 400, {
      alreadyCheckedIn: true,
      guest: mapGuestCheckInCard(guest, event),
    });
  }

  guest.checkedIn = true;
  guest.checkedInAt = new Date();
  guest.checkedInMethod = method || 'QR_CODE';
  if (user) {
    guest.checkedInBy = user.id || user._id;
  }
  await guest.save();

  await writeCheckInLog({
    eventId: event._id || event.id,
    guest,
    method: method || 'QR_CODE',
    user,
  });

  await populateGuestForCheckIn(guest);
  return mapGuestCheckInCard(guest, event);
}

async function searchInvitations(user, eventId, query) {
  const event = await assertEventAccess(user, eventId);
  const q = String(query || '').trim();
  if (!q) {
    throw new CheckInError('Terme de recherche requis', 400);
  }

  const searchType = detectSearchType(q);
  let guests = [];

  if (searchType === 'INVITATION_CODE') {
    const code = q.toUpperCase();
    guests = await Guest.find({ eventId, invitationCode: code })
      .populate('tableId', 'name number capacity')
      .populate('checkedInBy', 'name email')
      .limit(5);
    if (guests.length === 0) {
      const seq = q.toUpperCase().replace(/^INV-/, '');
      if (/^\d+$/.test(seq)) {
        guests = await Guest.find({
          eventId,
          invitationCode: formatInvitationCode(Number(seq)),
        })
          .populate('tableId', 'name number capacity')
          .populate('checkedInBy', 'name email')
          .limit(5);
      }
    }
  } else if (searchType === 'PHONE') {
    const normalized = normalizePhoneToE164(q);
    const digits = (normalized || q).replace(/\D/g, '');
    const tail = digits.slice(-9);
    guests = await Guest.find({
      eventId,
      $or: [
        { phone: normalized },
        { phone: { $regex: tail + '$' } },
        { phone: { $regex: digits.slice(-12) } },
      ],
    })
      .populate('tableId', 'name number capacity')
      .populate('checkedInBy', 'name email')
      .limit(10);
  } else {
    guests = await Guest.find({
      eventId,
      name: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' },
    })
      .populate('tableId', 'name number capacity')
      .populate('checkedInBy', 'name email')
      .limit(10);
  }

  for (const guest of guests) {
    if (!guest.invitationCode) {
      await ensureGuestInvitationCode(guest);
    }
  }

  const methodMap = {
    INVITATION_CODE: 'SEARCH_INVITATION_CODE',
    PHONE: 'SEARCH_PHONE',
    NAME: 'SEARCH_NAME',
  };

  return {
    searchType,
    method: methodMap[searchType] || 'SEARCH_NAME',
    results: guests.map((g) => mapGuestCheckInCard(g, event)),
  };
}

async function checkInGuestById(user, eventId, guestId, method) {
  const event = await assertEventAccess(user, eventId);
  if (!mongoose.Types.ObjectId.isValid(guestId)) {
    throw new CheckInError('ID invité invalide', 400);
  }

  const guest = await Guest.findOne({ _id: guestId, eventId });
  if (!guest) {
    throw new CheckInError('Invitation introuvable pour cet événement', 404);
  }

  if (!guest.invitationCode) {
    await ensureGuestInvitationCode(guest);
  }

  return performGuestCheckIn(guest, event, { method, user });
}

async function checkInGuestByQrToken(user, eventId, rawToken) {
  const event = await assertEventAccess(user, eventId);
  const token = parseScanToken(rawToken);
  if (!token) throw new CheckInError('QR code invalide', 400);

  let guest = await Guest.findOne({ qrCode: token, eventId });

  if (!guest && mongoose.Types.ObjectId.isValid(token)) {
    guest = await Guest.findOne({ _id: token, eventId });
    if (guest?.status === 'confirmed') {
      await ensureGuestQrCode(guest);
    }
  }

  if (!guest) {
    throw new CheckInError('Invitation introuvable pour cet événement', 404);
  }

  if (!guest.invitationCode) {
    await ensureGuestInvitationCode(guest);
  }

  return performGuestCheckIn(guest, event, { method: 'QR_CODE', user });
}

async function performPublicQrCheckIn(rawToken) {
  const token = parseScanToken(rawToken);
  if (!token) throw new CheckInError('QR code invalide', 400);

  let guest = await Guest.findOne({ qrCode: token }).populate('eventId');

  if (!guest && mongoose.Types.ObjectId.isValid(token)) {
    guest = await Guest.findById(token).populate('eventId');
    if (guest?.status === 'confirmed') {
      await ensureGuestQrCode(guest);
    }
  }

  if (!guest) throw new CheckInError('QR code invalide', 404);

  const event = guest.eventId;
  if (!guest.invitationCode) {
    await ensureGuestInvitationCode(guest);
  }

  const card = await performGuestCheckIn(guest, event, {
    method: 'QR_CODE',
    user: null,
  });

  return { guest: card, event: { id: event._id, title: event.title } };
}

module.exports = {
  assertEventAccess,
  searchInvitations,
  checkInGuestById,
  checkInGuestByQrToken,
  performPublicQrCheckIn,
  performGuestCheckIn,
  mapGuestCheckInCard,
  ensureGuestInvitationCode,
  CheckInError,
};
