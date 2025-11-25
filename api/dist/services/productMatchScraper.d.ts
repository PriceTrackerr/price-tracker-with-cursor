export declare class ProductMatchScraper {
    private db;
    private serperApiKey;
    constructor();
    scrapeAndStoreMatches(sourceProduct: any): Promise<void>;
    findAndStoreExternalMatches(userId: string, sourceProduct: any, limit?: number): Promise<any[]>;
    getStoredExternalMatches(userId: string, productId: string): Promise<any[]>;
    enrichStoredZeroPriceMatches(userId: string, productId: string, cap?: number): Promise<number>;
    private extractPrice;
    private detectCurrency;
    private parsePriceCurrency;
    private fetchPriceFromProductPage;
    private fetchFromSerper;
    private detectPlatform;
    private extractSearchTerm;
    rescrapeAllMatches(): Promise<void>;
    getStoredMatches(sourceProductId: string): Promise<any[]>;
}
export declare const productMatchScraper: ProductMatchScraper;
//# sourceMappingURL=productMatchScraper.d.ts.map