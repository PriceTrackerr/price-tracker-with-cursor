export declare const FEATURES: {
    AI: {
        enabled: boolean;
        conditionScoring: boolean;
        smartRecommendations: boolean;
        pricePrediction: boolean;
        fraudDetection: boolean;
    };
    CORE: {
        priceTracking: boolean;
        priceHistory: boolean;
        priceAlerts: boolean;
        multiCurrency: boolean;
        userDashboard: boolean;
    };
    ADVANCED: {
        conditionScoring: boolean;
        couponStacking: boolean;
        globalArbitrage: boolean;
        priceGuarantees: boolean;
        automation: boolean;
        community: boolean;
    };
    PLATFORMS: {
        amazon: boolean;
        ebay: boolean;
        walmart: boolean;
        target: boolean;
        bestbuy: boolean;
        homedepot: boolean;
        lowes: boolean;
    };
    SERVICES: {
        emailNotifications: boolean;
        webhookSupport: boolean;
        cronJobs: boolean;
        realTimeUpdates: boolean;
    };
};
export declare function isFeatureEnabled(category: keyof typeof FEATURES, feature?: string): boolean;
export declare function getFeatureStatus(): {
    ai: {
        enabled: boolean;
        conditionScoring: boolean;
        smartRecommendations: boolean;
        pricePrediction: boolean;
        fraudDetection: boolean;
    };
    core: {
        priceTracking: boolean;
        priceHistory: boolean;
        priceAlerts: boolean;
        multiCurrency: boolean;
        userDashboard: boolean;
    };
    advanced: {
        conditionScoring: boolean;
        couponStacking: boolean;
        globalArbitrage: boolean;
        priceGuarantees: boolean;
        automation: boolean;
        community: boolean;
    };
    platforms: {
        amazon: boolean;
        ebay: boolean;
        walmart: boolean;
        target: boolean;
        bestbuy: boolean;
        homedepot: boolean;
        lowes: boolean;
    };
    services: {
        emailNotifications: boolean;
        webhookSupport: boolean;
        cronJobs: boolean;
        realTimeUpdates: boolean;
    };
};
//# sourceMappingURL=features.d.ts.map