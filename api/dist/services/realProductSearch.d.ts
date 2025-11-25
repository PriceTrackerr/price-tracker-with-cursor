export type ProviderName = 'brightdata' | 'apify' | 'scrapedo' | 'scrapingbee' | 'serper';
export interface ScrapedItem {
    id: string;
    title: string;
    price: number;
    currency: string;
    url: string;
    imageUrl?: string;
    platform: string;
    source: ProviderName;
}
export declare const realProductSearch: {
    searchProducts(query: string, limit?: number): Promise<ScrapedItem[]>;
};
//# sourceMappingURL=realProductSearch.d.ts.map