const Event = require('../modules/event/event.model');
const Guest = require('../modules/guest/guest.model');
const { getPlanDefinition } = require('../constants/subscriptionPlans');

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

async function getSubscriptionLimitsStatus(user, eventId = null) {
  const limits = getEffectiveLimits(user);
  const eventCount = await Event.countDocuments({ userId: user._id || user.id });

  const status = {
    plan: user.subscriptionType || 'free',
    planLimitsBypass: isLimitsBypassed(user),
    maxEvents: limits.maxEvents,
    maxGuests: limits.maxGuests,
    eventCount,
    canCreateEvent:
      limits.maxEvents === null || eventCount < limits.maxEvents,
    customizableTemplates: limits.customizableTemplates,
    advancedAnalytics: limits.advancedAnalytics,
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
      limits.maxGuests === null ||
      guestCount < limits.maxGuests;
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

async function assertCanAddGuest(user, eventId) {
  const limits = getEffectiveLimits(user);
  if (limits.maxGuests === null) return;

  const event = await Event.findById(eventId);
  if (!event) {
    throw createLimitError('Événement introuvable', 'EVENT_NOT_FOUND');
  }

  const isOwner = String(event.userId) === String(user._id || user.id);
  const isSuperadmin = user.role === 'superadmin';

  if (!isOwner && !isSuperadmin) {
    throw createLimitError(
      "Accès refusé. Vous n'avez pas le droit d'ajouter des invités à cet événement.",
      'FORBIDDEN'
    );
  }

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
  isLimitsBypassed,
  getEffectiveLimits,
  getSubscriptionLimitsStatus,
  assertCanCreateEvent,
  assertCanAddGuest,
  assertAdvancedAnalytics,
  assertCustomTemplates,
};
