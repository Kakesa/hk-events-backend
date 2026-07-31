const {
  searchInvitations,
  checkInGuestById,
  checkInGuestByQrToken,
  CheckInError,
} = require('../../services/checkin.service');

exports.searchInvitations = async (req, res) => {
  try {
    const { eventId } = req.params;
    const q = req.query.q || req.query.query || '';
    const data = await searchInvitations(req.user, eventId, q);
    res.json({ success: true, data });
  } catch (err) {
    const status = err instanceof CheckInError ? err.statusCode : 500;
    res.status(status).json({
      success: false,
      message: err.message || 'Erreur serveur',
      data: err.data || undefined,
    });
  }
};

exports.checkInGuest = async (req, res) => {
  try {
    const { eventId, guestId } = req.params;
    const method = req.body?.method || 'SEARCH_NAME';
    const guest = await checkInGuestById(req.user, eventId, guestId, method);
    res.json({
      success: true,
      message: 'Entrée enregistrée avec succès.',
      data: { guest },
    });
  } catch (err) {
    const status = err instanceof CheckInError ? err.statusCode : 500;
    res.status(status).json({
      success: false,
      message: err.message || 'Erreur serveur',
      data: err.data || undefined,
    });
  }
};

exports.checkInByQrToken = async (req, res) => {
  try {
    const { eventId } = req.params;
    const token = req.body?.token || req.body?.qrCode || req.body?.code;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Token QR requis' });
    }
    const guest = await checkInGuestByQrToken(req.user, eventId, token);
    res.json({
      success: true,
      message: 'Entrée enregistrée avec succès.',
      data: { guest },
    });
  } catch (err) {
    const status = err instanceof CheckInError ? err.statusCode : 500;
    res.status(status).json({
      success: false,
      message: err.message || 'Erreur serveur',
      data: err.data || undefined,
    });
  }
};
