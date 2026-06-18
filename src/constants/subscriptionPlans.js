const SUBSCRIPTION_PLANS = {
  free: {
    price: 0,
    maxEvents: 1,
    maxGuests: 10,
    customizableTemplates: false,
    advancedAnalytics: false,
    emailSupport: false,
    prioritySupport: false,
  },
  basic: {
    price: 0,
    maxEvents: 1,
    maxGuests: 10,
    customizableTemplates: false,
    advancedAnalytics: false,
    emailSupport: false,
    prioritySupport: false,
    legacy: true,
  },
  premium: {
    price: 79,
    maxEvents: 1,
    maxGuests: null,
    customizableTemplates: true,
    advancedAnalytics: true,
    emailSupport: true,
    prioritySupport: false,
  },
  enterprise: {
    price: 149,
    maxEvents: null,
    maxGuests: null,
    customizableTemplates: true,
    advancedAnalytics: true,
    emailSupport: true,
    prioritySupport: true,
  },
};

const PAYABLE_PLANS = ['premium', 'enterprise'];

function getPlanDefinition(plan) {
  return SUBSCRIPTION_PLANS[plan] || SUBSCRIPTION_PLANS.free;
}

function getPlanPrice(plan) {
  return getPlanDefinition(plan).price;
}

module.exports = {
  SUBSCRIPTION_PLANS,
  PAYABLE_PLANS,
  getPlanDefinition,
  getPlanPrice,
};
