interface ScrapingResult {
    success: boolean;
    price?: number;
    title?: string;
    imageUrl?: string;
    stockStatus?: string;
    error?: string;
    source: 'api' | 'scraping' | 'cache';
    timestamp: string;
}
declare class ScrapingManager {
    private platformConfigs;
    private requestCounts;
    private userAgents;
    private checkRateLimit;
    private delay;
    private getRandomUserAgent;
    private getProxy;
    private checkCache;
    private saveToCache;
    private getPlatformFromUrl;
    scrapeProduct(url: string): Promise<ScrapingResult>;
    private attemptScraping;
    private extractProductData;
    private extractAmazonData;
    private extractEbayData;
    private extractBestBuyData;
    private extractTargetData;
    private extractWalmartData;
    private extractSheinData;
    private extractGenericData;
    getRateLimitStatus(): Promise<Record<string, any>>;
    resetRateLimits(): Promise<void>;
}
declare const _default: ScrapingManager;
export default _default;
//# sourceMappingURL=scrapingManager.d.ts.map