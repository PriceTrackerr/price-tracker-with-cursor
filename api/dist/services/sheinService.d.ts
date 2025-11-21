import { Product } from '../config/storage';
export interface SheinProduct {
    id: string;
    title: string;
    price: number;
    currency: string;
    imageUrl?: string;
    url: string;
    stockStatus: 'in_stock' | 'out_of_stock' | 'unknown';
    condition?: string;
    sellerRating?: number;
}
export declare class SheinService {
    private readonly baseUrl;
    private readonly searchUrl;
    private requestCount;
    private lastRequestTime;
    private readonly maxRequestsPerHour;
    private readonly delayBetweenRequests;
    private checkRateLimit;
    private delay;
    private getRandomUserAgent;
    searchProducts(query: string, limit?: number): Promise<Product[]>;
    getProductDetails(url: string): Promise<SheinProduct | null>;
    private extractPrice;
    private extractStockStatus;
    getRateLimitStatus(): {
        count: number;
        lastReset: number;
        maxPerHour: number;
    };
    resetRateLimit(): void;
}
export default SheinService;
//# sourceMappingURL=sheinService.d.ts.map