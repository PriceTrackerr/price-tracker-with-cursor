import { Product, CouponInfo, CouponStack } from '../config/storage';
export interface CouponSearchResult {
    coupons: CouponInfo[];
    bestStack: CouponStack;
    totalSavings: number;
    confidence: number;
}
export interface CouponValidationResult {
    isValid: boolean;
    errorMessage?: string;
    finalPrice: number;
    appliedDiscount: number;
    validationDate: string;
}
export declare class CouponStackingService {
    private readonly couponSources;
    findCoupons(product: Product): Promise<CouponSearchResult>;
    validateStack(stack: CouponStack, product: Product): Promise<CouponValidationResult>;
    autoApplyCoupons(product: Product, coupons: CouponInfo[]): Promise<{
        appliedCoupons: CouponInfo[];
        finalPrice: number;
        totalSavings: number;
        failedCoupons: {
            coupon: CouponInfo;
            reason: string;
        }[];
    }>;
    private fetchCouponsFromSource;
    private deduplicateCoupons;
    private filterValidCoupons;
    private findBestStack;
    private findBestStackableCombination;
    private getCombinations;
    private validateStackingRules;
    private estimateDiscount;
    private calculateTotalDiscount;
    private calculateStackedPrice;
    private calculateStackConfidence;
    private applyCouponToCart;
    private updateCouponStats;
}
export declare const couponStackingService: CouponStackingService;
//# sourceMappingURL=couponStackingService.d.ts.map