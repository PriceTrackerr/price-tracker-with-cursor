interface Coupon {
    code: string;
    description: string;
    discount?: string;
    successRate?: number;
    source: 'Honey' | 'CouponFollow' | 'Reddit';
}
export declare class FreeCouponService {
    findCoupons(query: string): Promise<Coupon[]>;
    private extractStoreName;
    private scrapeCouponFollow;
    private scrapeReddit;
    getStackableCoupons(store: string, title: string): Promise<any[]>;
    validateCoupon(coupon: any, productUrl: string): Promise<{
        isValid: boolean;
        errorMessage?: string;
    }>;
}
declare const _default: FreeCouponService;
export default _default;
//# sourceMappingURL=freeCouponService.d.ts.map