export interface FreeCoupon {
    code: string;
    description: string;
    discountType: 'percentage' | 'fixed' | 'shipping';
    discountValue: number;
    minPurchase?: number;
    expiryDate?: Date;
    store: string;
    source: string;
    successRate: number;
    lastTested: Date;
    isVerified: boolean;
    category?: string;
}
export declare class FreeCouponService {
    private rateLimitDelay;
    constructor();
    findCoupons(store: string, productTitle?: string): Promise<FreeCoupon[]>;
    private scrapeRetailMeNot;
    private getRedditCoupons;
    private getCommunityCoupons;
    private parseDiscount;
    private parseExpiryDate;
    private isLikelyCouponCode;
    private guessDiscountType;
    private extractDiscountValue;
    private deduplicateAndSort;
    validateCoupon(coupon: FreeCoupon, productUrl: string): Promise<{
        isValid: boolean;
        successRate: number;
        lastTested: Date;
        errorMessage?: string;
    }>;
    private delay;
    getStackableCoupons(store: string, productTitle?: string): Promise<FreeCoupon[][]>;
}
export default FreeCouponService;
//# sourceMappingURL=freeCouponService.d.ts.map