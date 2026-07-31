/**
 * Code d'invitation format INV-000245 (séquentiel par événement).
 */
const Guest = require('../modules/guest/guest.model');

const formatInvitationCode = (sequence) =>
  `INV-${String(sequence).padStart(6, '0')}`;

const parseInvitationCode = (value) => {
  const match = String(value || '').trim().toUpperCase().match(/^INV-(\d+)$/);
  return match ? match[1] : null;
};

const detectSearchType = (query) => {
  const q = String(query || '').trim();
  if (!q) return null;
  if (/^INV-\d+$/i.test(q)) return 'INVITATION_CODE';
  const digits = q.replace(/\D/g, '');
  if (digits.length >= 9 && digits.length <= 15 && /^[\d+\s()-]+$/.test(q)) {
    return 'PHONE';
  }
  return 'NAME';
};

const ensureGuestInvitationCode = async (guest) => {
  if (guest.invitationCode) return guest.invitationCode;

  const existing = await Guest.find({
    eventId: guest.eventId,
    invitationCode: { $exists: true, $nin: [null, ''] },
  }).select('invitationCode');

  let maxSeq = 0;
  for (const g of existing) {
    const parsed = parseInvitationCode(g.invitationCode);
    if (parsed) maxSeq = Math.max(maxSeq, Number(parsed));
  }

  guest.invitationCode = formatInvitationCode(maxSeq + 1);
  await guest.save();
  return guest.invitationCode;
};

module.exports = {
  formatInvitationCode,
  parseInvitationCode,
  detectSearchType,
  ensureGuestInvitationCode,
};
