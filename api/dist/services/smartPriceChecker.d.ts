interface PriceCheckResult {
    success: boolean;
    price?: number;
    error?: string;
    timestamp: string;
}
declare class SmartPriceChecker {
    private rateLimits;
    private delays;
    private checkRateLimit;
    private delay;
    private getRandomUserAgent;
    checkPrice(url: string): Promise<PriceCheckResult>;
    private getPlatformFromUrl;
    private extractPrice;
    getRateLimitStatus(): Promise<any>;
    resetRateLimits(): Promise<void>;
}
declare const _default: SmartPriceChecker;
export default _default;
//# sourceMappingURL=smartPriceChecker.d.ts.map