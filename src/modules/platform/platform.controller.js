const {
  getPlatformSettings,
  NEGOTIATED_GUEST_PRICES_FC,
} = require('../../utils/guestPricing');
const { createAudit } = require('../audit/audit.service');
const {
  PURGE_CONFIRM_PHRASE,
  getPurgePreview,
  purgeAllTestData,
} = require('./maintenance.service');

const getSettings = async (req, res, next) => {
  try {
    const settings = await getPlatformSettings();
    res.json({
      success: true,
      data: {
        defaultGuestPriceFc: settings.defaultGuestPriceFc,
        negotiatedPricesFc: NEGOTIATED_GUEST_PRICES_FC,
      },
    });
  } catch (err) {
    next(err);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const { defaultGuestPriceFc } = req.body;
    const settings = await getPlatformSettings();

    if (defaultGuestPriceFc !== undefined) {
      const price = Number(defaultGuestPriceFc);
      if (!Number.isFinite(price) || price <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Prix par invité invalide',
        });
      }
      settings.defaultGuestPriceFc = price;
    }

    await settings.save();

    res.json({
      success: true,
      data: {
        defaultGuestPriceFc: settings.defaultGuestPriceFc,
        negotiatedPricesFc: NEGOTIATED_GUEST_PRICES_FC,
      },
    });
  } catch (err) {
    next(err);
  }
};

const getPurgePreviewHandler = async (req, res, next) => {
  try {
    const preview = await getPurgePreview();
    res.json({ success: true, data: preview });
  } catch (err) {
    next(err);
  }
};

const purgeTestDataHandler = async (req, res, next) => {
  try {
    const confirmPhrase = String(req.body.confirmPhrase || '').trim();

    if (confirmPhrase !== PURGE_CONFIRM_PHRASE) {
      return res.status(400).json({
        success: false,
        message: `Saisissez exactement « ${PURGE_CONFIRM_PHRASE} » pour confirmer`,
      });
    }

    const before = await getPurgePreview();
    const result = await purgeAllTestData();

    await createAudit({
      req,
      action: 'PURGE_TEST_DATA',
      target: { type: 'Platform', id: null },
      before,
      after: result.deleted,
    });

    res.json({
      success: true,
      message: 'Données de test supprimées. Seul le compte super admin est conservé.',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getSettings, updateSettings, getPurgePreviewHandler, purgeTestDataHandler };
