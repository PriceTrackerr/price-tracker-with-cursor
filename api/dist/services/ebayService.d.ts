export interface EbayProduct {
    itemId: string;
    title: string;
    price: number;
    currency: string;
    condition: string;
    conditionDescription?: string;
    seller: {
        username: string;
        feedbackPercentage: number;
        feedbackScore: number;
    };
    shipping: {
        cost: number;
        type: string;
    };
    location: {
        country: string;
        postalCode?: string;
    };
    returnPolicy?: {
        returnsAccepted: boolean;
        returnPeriod: string;
    };
}
export declare class EbayService {
    private clientId;
    private clientSecret;
    private accessToken?;
    private tokenExpiry?;
    private baseUrl;
    constructor();
    private getAccessToken;
    searchProducts(query: string, limit?: number): Promise<EbayProduct[]>;
    searchProductsInMarketplace(query: string, marketplaceId: string, limit?: number): Promise<EbayProduct[]>;
    getProductDetails(itemId: string): Promise<EbayProduct | null>;
    getConditionAnalysis(itemId: string): Promise<{
        condition: string;
        conditionScore: number;
        sellerTrustScore: number;
        riskLevel: 'low' | 'medium' | 'high';
        returnPolicy: any;
    } | null>;
    private calculateConditionScore;
    private calculateSellerTrustScore;
    private calculateRiskLevel;
    private mapToEbayProduct;
    getUsedAlternatives(productTitle: string): Promise<EbayProduct[]>;
}
export default EbayService;
//# sourceMappingURL=ebayService.d.ts.map