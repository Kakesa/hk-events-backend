const { ALCOHOLIC_DRINKS, SOFT_DRINKS } = require('../constants/drinks');

const alcoholicLookup = new Map(
  ALCOHOLIC_DRINKS.map((d) => [d.toLowerCase(), d]),
);
const softLookup = new Map(
  SOFT_DRINKS.map((d) => [d.toLowerCase(), d]),
);

function parseDrinkPreferences(drinkPreference) {
  if (!drinkPreference || !String(drinkPreference).trim()) return [];
  return String(drinkPreference)
    .split(',')
    .map((d) => d.trim())
    .filter(Boolean);
}

function resolveDrinkCategory(drink) {
  const key = drink.toLowerCase();
  if (alcoholicLookup.has(key)) return { category: 'alcoholic', label: alcoholicLookup.get(key) };
  if (softLookup.has(key)) return { category: 'soft', label: softLookup.get(key) };
  return { category: 'other', label: drink };
}

function computeDrinkStats(guests) {
  const preferredDrinksStats = {};
  const alcoholicDrinksStats = {};
  const softDrinksStats = {};

  let alcoholic = 0;
  let soft = 0;
  let other = 0;
  let guestsWithDrinks = 0;

  for (const guest of guests) {
    if (guest.status !== 'confirmed') continue;

    const drinks = parseDrinkPreferences(guest.drinkPreference);
    if (drinks.length === 0) continue;

    guestsWithDrinks += 1;

    for (const drink of drinks) {
      const { category, label } = resolveDrinkCategory(drink);

      preferredDrinksStats[label] = (preferredDrinksStats[label] || 0) + 1;

      if (category === 'alcoholic') {
        alcoholic += 1;
        alcoholicDrinksStats[label] = (alcoholicDrinksStats[label] || 0) + 1;
      } else if (category === 'soft') {
        soft += 1;
        softDrinksStats[label] = (softDrinksStats[label] || 0) + 1;
      } else {
        other += 1;
      }
    }
  }

  return {
    preferredDrinksStats,
    alcoholicDrinksStats,
    softDrinksStats,
    drinkCategoryStats: {
      alcoholic,
      soft,
      other,
      totalChoices: alcoholic + soft + other,
      guestsWithDrinks,
    },
  };
}

module.exports = {
  computeDrinkStats,
  parseDrinkPreferences,
};
