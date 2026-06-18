const PlatformSettings = require('../modules/platform/platformSettings.model');

const NEGOTIATED_GUEST_PRICES_FC = [1500, 1200, 1000];
const GUEST_BILLING_BLOCK = 10;

async function getPlatformSettings() {
  let settings = await PlatformSettings.findById('platform');
  if (!settings) {
    settings = await PlatformSettings.create({
      _id: 'platform',
      defaultGuestPriceFc: 1500,
    });
  }
  return settings;
}

function getEffectiveGuestPriceFc(user, platformSettings) {
  if (user?.guestPriceFc && user.guestPriceFc > 0) {
    return user.guestPriceFc;
  }
  return platformSettings?.defaultGuestPriceFc ?? 1500;
}

function calculateGuestBilling(guestCount, pricePerGuestFc) {
  const totalFc = guestCount * pricePerGuestFc;
  const completedBlocks = Math.floor(guestCount / GUEST_BILLING_BLOCK);
  const blockTotalFc = completedBlocks * GUEST_BILLING_BLOCK * pricePerGuestFc;
  const guestsInCurrentBlock = guestCount % GUEST_BILLING_BLOCK;
  const nextBlockAt = completedBlocks * GUEST_BILLING_BLOCK + GUEST_BILLING_BLOCK;

  return {
    guestCount,
    pricePerGuestFc,
    totalFc,
    billingBlockSize: GUEST_BILLING_BLOCK,
    completedBlocks,
    blockTotalFc,
    guestsInCurrentBlock,
    nextBlockAt,
    currentBlockLabel: `${guestsInCurrentBlock || GUEST_BILLING_BLOCK} invités / ${(guestsInCurrentBlock || GUEST_BILLING_BLOCK) * pricePerGuestFc} FC`,
    displayLabel:
      guestCount === 0
        ? `0 invité / 0 FC (${pricePerGuestFc} FC / invité)`
        : `${guestCount} invité${guestCount > 1 ? 's' : ''} / ${totalFc.toLocaleString('fr-FR')} FC`,
    blockProgressLabel:
      guestCount === 0
        ? `Palier suivant : ${GUEST_BILLING_BLOCK} invités / ${(GUEST_BILLING_BLOCK * pricePerGuestFc).toLocaleString('fr-FR')} FC`
        : `${guestsInCurrentBlock} / ${GUEST_BILLING_BLOCK} invités du palier · ${(guestsInCurrentBlock * pricePerGuestFc).toLocaleString('fr-FR')} / ${(GUEST_BILLING_BLOCK * pricePerGuestFc).toLocaleString('fr-FR')} FC`,
  };
}

module.exports = {
  NEGOTIATED_GUEST_PRICES_FC,
  GUEST_BILLING_BLOCK,
  getPlatformSettings,
  getEffectiveGuestPriceFc,
  calculateGuestBilling,
};
