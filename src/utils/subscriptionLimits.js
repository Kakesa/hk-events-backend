const Event = require('../modules/event/event.model');
const Guest = require('../modules/guest/guest.model');
const User = require('../modules/users/users.model');
const { getPlanDefinition } = require('../constants/subscriptionPlans');
const {
  getPlatformSettings,
  getEffectiveGuestPriceFc,
  calculateGuestBilling,
  NEGOTIATED_GUEST_PRICES_FC,
} = require('./guestPricing');
const { getPermissionsForRole } = require('../constants/permissions');

const ORGANIZER_QUOTA_MESSAGE =
  "Vous avez atteint le nombre maximal d'invités autorisé par votre abonnement. Veuillez contacter l'administrateur pour augmenter votre quota.";

function hasPremiumAdminAccess(user) {
  return user?.subscriptionType === 'premium' || user?.subscriptionType === 'enterprise';
}

function isLimitsBypassed(user) {
  if (!user) return false;
  if (user.role === 'superadmin') return true;
  return user.planLimitsBypass === true;
}

function getEffectiveLimits(user) {
  if (isLimitsBypassed(user)) {
    return {
      bypass: true,
      maxEvents: null,
      maxGuests: null,
      customizableTemplates: true,
      advancedAnalytics: true,
    };
  }

  const planDef = getPlanDefinition(user?.subscriptionType || 'free');

  return {
    bypass: false,
    plan: user?.subscriptionType || 'free',
    maxEvents: planDef.maxEvents,
    maxGuests: planDef.maxGuests,
    customizableTemplates: planDef.customizableTemplates,
    advancedAnalytics: planDef.advancedAnalytics,
  };
}

async function countOrganizerGuests(userId) {
  const userEvents = await Event.find({ userId }).select('_id');
  const eventIds = userEvents.map((e) => e._id);
  if (eventIds.length === 0) return 0;
  return Guest.countDocuments({ eventId: { $in: eventIds } });
}

function hasOrganizerGuestQuota(owner) {
  return owner?.maxGuests != null && owner.maxGuests >= 0;
}

function canAddGuestForOwner(owner, limits, totalGuestCount, eventGuestCount) {
  if (isLimitsBypassed(owner)) return true;

  if (hasOrganizerGuestQuota(owner)) {
    return totalGuestCount < owner.maxGuests;
  }

  if (limits.maxGuests === null) return true;
  return eventGuestCount < limits.maxGuests;
}

async function getSubscriptionLimitsStatus(user, eventId = null) {
  const limits = getEffectiveLimits(user);
  const platformSettings = await getPlatformSettings();
  const pricePerGuestFc = getEffectiveGuestPriceFc(user, platformSettings);
  const eventCount = await Event.countDocuments({ userId: user._id || user.id });
  const totalGuestCount = await countOrganizerGuests(user._id || user.id);

  const billing = calculateGuestBilling(totalGuestCount, pricePerGuestFc);

  const status = {
    plan: user.subscriptionType || 'free',
    planLimitsBypass: isLimitsBypassed(user),
    hasPremiumAdminAccess: hasPremiumAdminAccess(user),
    maxEvents: limits.maxEvents,
    maxGuests: limits.maxGuests,
    maxGuestsQuota: hasOrganizerGuestQuota(user) ? user.maxGuests : null,
    totalGuestCount,
    eventCount,
    canCreateEvent:
      limits.maxEvents === null || eventCount < limits.maxEvents,
    customizableTemplates: limits.customizableTemplates,
    advancedAnalytics: limits.advancedAnalytics,
    pricePerGuestFc,
    defaultGuestPriceFc: platformSettings.defaultGuestPriceFc,
    negotiatedPricesFc: NEGOTIATED_GUEST_PRICES_FC,
    billing,
  };

  if (eventId) {
    const event = await Event.findById(eventId);
    const isOwner =
      event && String(event.userId) === String(user._id || user.id);
    const guestCount = isOwner
      ? await Guest.countDocuments({ eventId })
      : 0;

    status.guestCount = guestCount;
    status.canAddGuest =
      !isOwner ||
      canAddGuestForOwner(user, limits, totalGuestCount, guestCount);
    status.eventBilling = calculateGuestBilling(guestCount, pricePerGuestFc);
  } else {
    status.canAddGuest = canAddGuestForOwner(user, limits, totalGuestCount, 0);
  }

  return status;
}

function createLimitError(message, code) {
  const error = new Error(message);
  error.statusCode = 403;
  error.code = code;
  return error;
}

async function assertCanCreateEvent(user) {
  const limits = getEffectiveLimits(user);
  if (limits.maxEvents === null) return;

  const eventCount = await Event.countDocuments({
    userId: user._id || user.id,
  });

  if (eventCount >= limits.maxEvents) {
    throw createLimitError(
      `Limite atteinte : votre plan autorise ${limits.maxEvents} événement(s) maximum. Passez à un plan supérieur ou demandez un déblocage au super admin.`,
      'PLAN_LIMIT_EVENTS'
    );
  }
}

async function assertCanAddGuest(actingUser, eventId) {
  const event = await Event.findById(eventId);
  if (!event) {
    throw createLimitError('Événement introuvable', 'EVENT_NOT_FOUND');
  }

  const ownerId = event.userId;
  const isSuperadmin = actingUser.role === 'superadmin';
  const isOwner = String(ownerId) === String(actingUser._id || actingUser.id);

  if (!isOwner && !isSuperadmin) {
    throw createLimitError(
      "Accès refusé. Vous n'avez pas le droit d'ajouter des invités à cet événement.",
      'FORBIDDEN'
    );
  }

  if (isSuperadmin) return;

  const owner = await User.findById(ownerId);
  if (!owner) {
    throw createLimitError('Organisateur introuvable', 'OWNER_NOT_FOUND');
  }

  if (isLimitsBypassed(owner)) return;

  const totalGuestCount = await countOrganizerGuests(ownerId);

  if (hasOrganizerGuestQuota(owner)) {
    if (totalGuestCount >= owner.maxGuests) {
      throw createLimitError(ORGANIZER_QUOTA_MESSAGE, 'ORGANIZER_QUOTA_GUESTS');
    }
    return;
  }

  const limits = getEffectiveLimits(owner);
  if (limits.maxGuests === null) return;

  const guestCount = await Guest.countDocuments({ eventId });
  if (guestCount >= limits.maxGuests) {
    throw createLimitError(
      `Limite atteinte : votre plan autorise ${limits.maxGuests} invité(s) par événement. Passez à un plan supérieur ou demandez un déblocage au super admin.`,
      'PLAN_LIMIT_GUESTS'
    );
  }
}

function assertAdvancedAnalytics(user) {
  const limits = getEffectiveLimits(user);
  if (!limits.advancedAnalytics) {
    throw createLimitError(
      'Les analytics avancés nécessitent le plan Premium ou Enterprise.',
      'PLAN_FEATURE_ANALYTICS'
    );
  }
}

function assertCustomTemplates(user) {
  const limits = getEffectiveLimits(user);
  if (!limits.customizableTemplates) {
    throw createLimitError(
      'Les templates personnalisés nécessitent le plan Premium ou Enterprise.',
      'PLAN_FEATURE_TEMPLATES'
    );
  }
}

module.exports = {
  ORGANIZER_QUOTA_MESSAGE,
  isLimitsBypassed,
  hasPremiumAdminAccess,
  getEffectiveLimits,
  countOrganizerGuests,
  getSubscriptionLimitsStatus,
  assertCanCreateEvent,
  assertCanAddGuest,
  assertAdvancedAnalytics,
  assertCustomTemplates,
};
