const {
  getPlatformSettings,
  NEGOTIATED_GUEST_PRICES_FC,
} = require('../../utils/guestPricing');

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

module.exports = { getSettings, updateSettings };
