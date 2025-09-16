// Feature configuration for the price tracker
// Easily enable/disable features for different deployment stages

export const FEATURES = {
  // AI Features (can be enabled later)
  AI: {
    enabled: false, // Set to true when you have OpenAI credits
    conditionScoring: false,
    smartRecommendations: false,
    pricePrediction: false,
    fraudDetection: false
  },

  // Core Features (always enabled)
  CORE: {
    priceTracking: true,
    priceHistory: true,
    priceAlerts: true,
    multiCurrency: true,
    userDashboard: true
  },

  // Advanced Features (rule-based, no AI required)
  ADVANCED: {
    conditionScoring: true, // Rule-based scoring
    couponStacking: true,
    globalArbitrage: true,
    priceGuarantees: true,
    automation: true,
    community: true
  },

  // Platform Integrations
  PLATFORMS: {
    amazon: false, // Enable when you get API keys
    ebay: false,   // Enable when review is complete
    walmart: false,
    target: false,
    bestbuy: false,
    homedepot: false,
    lowes: false
  },

  // External Services
  SERVICES: {
    emailNotifications: true,
    webhookSupport: true,
    cronJobs: true,
    realTimeUpdates: true
  }
};

// Helper function to check if a feature is enabled
export function isFeatureEnabled(category: keyof typeof FEATURES, feature?: string): boolean {
  if (feature) {
    return FEATURES[category][feature as keyof typeof FEATURES[typeof category]] === true;
  }
  return Object.values(FEATURES[category]).some(v => v === true);
}

// Get feature status for frontend
export function getFeatureStatus() {
  return {
    ai: FEATURES.AI,
    core: FEATURES.CORE,
    advanced: FEATURES.ADVANCED,
    platforms: FEATURES.PLATFORMS,
    services: FEATURES.SERVICES
  };
}
