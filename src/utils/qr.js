const crypto = require("crypto");
const mongoose = require("mongoose");

/** Token stable — même invité = même QR à chaque fois */
exports.generateQRCode = (eventId, guestId) => {
  const e = String(eventId);
  const g = String(guestId);
  return crypto.createHash("sha256").update(`hk-events:v1:${e}:${g}`).digest("hex");
};

/** Extrait le token depuis un scan (hash seul ou URL complète) */
exports.parseScanToken = (raw) => {
  let token = decodeURIComponent(String(raw || "").trim());
  const fromUrl = token.match(/\/checkin\/([a-fA-F0-9]{24,64})/);
  if (fromUrl) token = fromUrl[1];
  return token;
};

/** Regénère si absent ou ancien format (ID invité seulement) */
exports.needsQrRegeneration = (guest) => {
  if (!guest?.qrCode) return true;
  const code = String(guest.qrCode);
  const guestId = String(guest._id);
  if (code === guestId) return true;
  if (code.length === 24 && mongoose.Types.ObjectId.isValid(code)) return true;
  return false;
};

exports.ensureGuestQrCode = async (guest) => {
  if (guest.status !== "confirmed") return guest.qrCode || null;

  if (exports.needsQrRegeneration(guest)) {
    guest.qrCode = exports.generateQRCode(
      guest.eventId.toString(),
      guest._id.toString(),
    );
    guest.qrGeneratedAt = new Date();
  }

  await guest.save();
  return guest.qrCode;
};

module.exports = exports;
