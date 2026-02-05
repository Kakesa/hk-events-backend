const crypto = require("crypto");

exports.generateQRCode = (eventId, guestId) => {
  return crypto
    .createHash("sha256")
    .update(`${eventId}:${guestId}:${Date.now()}`)
    .digest("hex");
};
