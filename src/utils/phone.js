const DEFAULT_COUNTRY_CODE = '243';

const normalizePhoneToE164 = (phone) => {
  if (!phone || !String(phone).trim()) return undefined;

  let digits = String(phone).replace(/\D/g, '');

  if (digits.startsWith('00')) {
    digits = digits.slice(2);
  }

  if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  if (digits.startsWith(DEFAULT_COUNTRY_CODE)) {
    const national = digits.slice(3);
    if (national.length === 9) {
      return `+${DEFAULT_COUNTRY_CODE}${national}`;
    }
  }

  if (digits.length === 9) {
    return `+${DEFAULT_COUNTRY_CODE}${digits}`;
  }

  return undefined;
};

module.exports = {
  normalizePhoneToE164,
};
