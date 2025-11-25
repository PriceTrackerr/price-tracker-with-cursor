export type StoreKey = 'amazon' | 'aliexpress' | 'bestbuy' | 'ebay' | 'walmart' | 'target' | 'shein';
export interface ScrapedProduct {
    id: string;
    title: string;
    price: number;
    currency: string;
    platform: StoreKey;
    url: string;
    imageUrl?: string;
    source: 'serper';
}
export declare function scrapeWithHybrid(query: string, store: StoreKey, limit?: number): Promise<ScrapedProduct[]>;
export declare const SUPPORTED_STORES: StoreKey[];
//# sourceMappingURL=hybridScraper.d.ts.map