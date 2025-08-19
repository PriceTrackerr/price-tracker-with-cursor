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
declare class ProductExtractor {
    private platform;
    constructor();
    private detectPlatform;
    extractProductInfo(): Promise<ProductInfo | null>;
    extractAmazonProductInfo(): Promise<ProductInfo | null>;
    extractAliExpressProductInfo(): Promise<ProductInfo | null>;
    extractEbayProductInfo(): Promise<ProductInfo | null>;
    extractWalmartProductInfo(): Promise<ProductInfo | null>;
    extractSheinProductInfo(): Promise<ProductInfo | null>;
    getCurrentPrice(): number | null;
    private getAmazonCurrentPrice;
    private getAliExpressCurrentPrice;
    extractBestBuyProductInfo(): Promise<ProductInfo | null>;
    extractTargetProductInfo(): Promise<ProductInfo | null>;
    private extractBestBuyProductId;
    private extractBestBuyTitle;
    private extractBestBuyPrice;
    private extractBestBuyImage;
    private extractBestBuyStockStatus;
    private extractTargetProductId;
    private extractTargetTitle;
    private extractTargetPrice;
    private extractTargetImage;
    private extractTargetStockStatus;
}
declare const productExtractor: ProductExtractor;
declare function waitForElement(selector: string, timeout?: number): Promise<HTMLElement | null>;
declare function extractPriceNumber(priceString: string): number | null;
//# sourceMappingURL=injected.d.ts.map