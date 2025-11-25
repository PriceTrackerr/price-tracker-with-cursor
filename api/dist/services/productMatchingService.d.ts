export type Currency = string;
export interface Product {
    id: string;
    title: string;
    price: number;
    platform: string;
    url: string;
    imageUrl?: string;
    currency?: Currency;
    stockStatus?: string;
    discountInfo?: string;
}
export interface MatchResult {
    product: Product;
    score: number;
    confidence: 'high' | 'medium' | 'low';
    matchReason: string;
    priceDifference: number;
    priceDifferencePercent: number;
    savings?: string;
}
export interface MatchResponse {
    algorithm: 'buyhatke-enhanced';
    targetProduct: Product;
    matches: MatchResult[];
    bestMatch: {
        id: string;
        platform: string;
        url: string;
        price: number;
        priceDifference: number;
        confidence: number;
    } | null;
}
export interface MatchingConfig {
    minScore: number;
    maxResults: number;
    priceTolerancePercent: number;
    weights: {
        titleFuzzy: number;
        brandMatch: number;
        modelVariant: number;
        priceCloseness: number;
        attributeSimilarity?: number;
        tfidfSimilarity?: number;
    };
}
export declare const DEFAULT_CONFIG: MatchingConfig;
export declare function matchProducts(source: Product, candidates: Product[], config?: MatchingConfig): MatchResult[];
export declare function findProductMatches(source: Product, candidates: Product[], config?: MatchingConfig): MatchResponse;
//# sourceMappingURL=productMatchingService.d.ts.map