declare function injectScript(): void;
interface ProductInfo {
    id: string;
    url: string;
    title: string;
    price: number | null;
    currency: string;
    platform: 'amazon' | 'aliexpress' | 'ebay' | 'walmart' | 'shein' | 'bestbuy' | 'target';
    imageUrl?: string;
    stockStatus: 'in_stock' | 'out_of_stock' | 'unknown';
    discountInfo?: string;
}
declare function trackProductToBackend(productInfo: ProductInfo): Promise<any>;
declare function showTrackingNotification(message: string, isSuccess?: boolean): void;
//# sourceMappingURL=content.d.ts.map