"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FEATURES = void 0;
exports.isFeatureEnabled = isFeatureEnabled;
exports.getFeatureStatus = getFeatureStatus;
exports.FEATURES = {
    AI: {
        enabled: false,
        conditionScoring: false,
        smartRecommendations: false,
        pricePrediction: false,
        fraudDetection: false
    },
    CORE: {
        priceTracking: true,
        priceHistory: true,
        priceAlerts: true,
        multiCurrency: true,
        userDashboard: true
    },
    ADVANCED: {
        conditionScoring: true,
        couponStacking: true,
        globalArbitrage: true,
        priceGuarantees: true,
        automation: true,
        community: true
    },
    PLATFORMS: {
        amazon: false,
        ebay: false,
        walmart: false,
        target: false,
        bestbuy: false,
        homedepot: false,
        lowes: false
    },
    SERVICES: {
        emailNotifications: true,
        webhookSupport: true,
        cronJobs: true,
        realTimeUpdates: true
    }
};
function isFeatureEnabled(category, feature) {
    if (feature) {
        return exports.FEATURES[category][feature] === true;
    }
    return Object.values(exports.FEATURES[category]).some(v => v === true);
}
function getFeatureStatus() {
    return {
        ai: exports.FEATURES.AI,
        core: exports.FEATURES.CORE,
        advanced: exports.FEATURES.ADVANCED,
        platforms: exports.FEATURES.PLATFORMS,
        services: exports.FEATURES.SERVICES
    };
}
//# sourceMappingURL=features.js.map