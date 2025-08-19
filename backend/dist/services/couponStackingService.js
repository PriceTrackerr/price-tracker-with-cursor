"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.couponStackingService = exports.CouponStackingService = void 0;
class CouponStackingService {
    constructor() {
        this.couponSources = [
            'retailer_api',
            'honey',
            'rakuten',
            'capital_one_shopping',
            'browser_extension_data',
            'community_submissions'
        ];
    }
    async findCoupons(product) {
        const coupons = [];
        for (const source of this.couponSources) {
            const sourceCoupons = await this.fetchCouponsFromSource(source, product);
            coupons.push(...sourceCoupons);
        }
        const uniqueCoupons = this.deduplicateCoupons(coupons);
        const validCoupons = await this.filterValidCoupons(uniqueCoupons, product);
        const bestStack = await this.findBestStack(validCoupons, product);
        const totalSavings = bestStack.savings;
        const confidence = this.calculateStackConfidence(bestStack);
        return {
            coupons: validCoupons,
            bestStack,
            totalSavings,
            confidence
        };
    }
    async validateStack(stack, product) {
        try {
            for (const coupon of stack.coupons) {
                if (new Date(coupon.expiresAt) < new Date()) {
                    return {
                        isValid: false,
                        errorMessage: `Coupon ${coupon.code} has expired`,
                        finalPrice: product.price,
                        appliedDiscount: 0,
                        validationDate: new Date().toISOString()
                    };
                }
            }
            const stackingValidation = this.validateStackingRules(stack.coupons);
            if (!stackingValidation.isValid) {
                return {
                    isValid: false,
                    errorMessage: stackingValidation.error || 'Stacking validation failed',
                    finalPrice: product.price,
                    appliedDiscount: 0,
                    validationDate: new Date().toISOString()
                };
            }
            const finalPrice = this.calculateStackedPrice(product.price, stack.coupons);
            const appliedDiscount = product.price - finalPrice;
            return {
                isValid: true,
                finalPrice,
                appliedDiscount,
                validationDate: new Date().toISOString()
            };
        }
        catch (error) {
            return {
                isValid: false,
                errorMessage: 'Validation failed due to technical error',
                finalPrice: product.price,
                appliedDiscount: 0,
                validationDate: new Date().toISOString()
            };
        }
    }
    async autoApplyCoupons(product, coupons) {
        const appliedCoupons = [];
        const failedCoupons = [];
        let currentPrice = product.price;
        const sortedCoupons = coupons.sort((a, b) => {
            const aDiscount = this.estimateDiscount(a, currentPrice);
            const bDiscount = this.estimateDiscount(b, currentPrice);
            return bDiscount - aDiscount;
        });
        for (const coupon of sortedCoupons) {
            try {
                const applicationResult = await this.applyCouponToCart(coupon, currentPrice);
                if (applicationResult.success) {
                    appliedCoupons.push(coupon);
                    currentPrice = applicationResult.newPrice;
                    await this.updateCouponStats(coupon.id, true);
                }
                else {
                    failedCoupons.push({
                        coupon,
                        reason: applicationResult.error || 'Unknown error'
                    });
                    await this.updateCouponStats(coupon.id, false);
                }
            }
            catch (error) {
                failedCoupons.push({
                    coupon,
                    reason: 'Application failed'
                });
            }
        }
        return {
            appliedCoupons,
            finalPrice: currentPrice,
            totalSavings: product.price - currentPrice,
            failedCoupons
        };
    }
    async fetchCouponsFromSource(source, product) {
        const mockCoupons = [
            {
                id: `${source}-1`,
                code: 'SAVE10',
                description: '10% off orders over $50',
                discountType: 'percentage',
                discountValue: 10,
                minPurchase: 50,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                isStackable: true,
                isVerified: true,
                platform: product.platform,
                usageCount: 1250,
                successRate: 85
            },
            {
                id: `${source}-2`,
                code: 'FREESHIP',
                description: 'Free shipping on any order',
                discountType: 'shipping',
                discountValue: 9.99,
                expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
                isStackable: true,
                isVerified: true,
                platform: product.platform,
                usageCount: 890,
                successRate: 92
            }
        ];
        await new Promise(resolve => setTimeout(resolve, 100));
        return mockCoupons;
    }
    deduplicateCoupons(coupons) {
        const seen = new Set();
        return coupons.filter(coupon => {
            const key = `${coupon.code}-${coupon.platform}`;
            if (seen.has(key))
                return false;
            seen.add(key);
            return true;
        });
    }
    async filterValidCoupons(coupons, product) {
        return coupons.filter(coupon => {
            if (new Date(coupon.expiresAt) < new Date())
                return false;
            if (coupon.platform !== product.platform)
                return false;
            if (coupon.minPurchase && product.price < coupon.minPurchase)
                return false;
            if (coupon.successRate < 50)
                return false;
            return true;
        });
    }
    async findBestStack(coupons, product) {
        const stackableCoupons = coupons.filter(c => c.isStackable);
        const nonStackableCoupons = coupons.filter(c => !c.isStackable);
        let bestStack = {
            coupons: [],
            totalDiscount: 0,
            finalPrice: product.price,
            savings: 0,
            isValid: true,
            validationDate: new Date().toISOString()
        };
        for (const coupon of nonStackableCoupons) {
            const discount = this.estimateDiscount(coupon, product.price);
            if (discount > bestStack.totalDiscount) {
                bestStack = {
                    coupons: [coupon],
                    totalDiscount: discount,
                    finalPrice: product.price - discount,
                    savings: discount,
                    isValid: true,
                    validationDate: new Date().toISOString()
                };
            }
        }
        if (stackableCoupons.length > 0) {
            const stackResult = this.findBestStackableCombination(stackableCoupons, product.price);
            if (stackResult.totalDiscount > bestStack.totalDiscount) {
                bestStack = stackResult;
            }
        }
        return bestStack;
    }
    findBestStackableCombination(coupons, originalPrice) {
        let bestCombination = [];
        let bestDiscount = 0;
        const maxCombinationSize = Math.min(coupons.length, 4);
        for (let size = 1; size <= maxCombinationSize; size++) {
            const combinations = this.getCombinations(coupons, size);
            for (const combination of combinations) {
                if (this.validateStackingRules(combination).isValid) {
                    const totalDiscount = this.calculateTotalDiscount(combination, originalPrice);
                    if (totalDiscount > bestDiscount) {
                        bestDiscount = totalDiscount;
                        bestCombination = combination;
                    }
                }
            }
        }
        return {
            coupons: bestCombination,
            totalDiscount: bestDiscount,
            finalPrice: originalPrice - bestDiscount,
            savings: bestDiscount,
            isValid: true,
            validationDate: new Date().toISOString()
        };
    }
    getCombinations(arr, size) {
        if (size === 1)
            return arr.map(item => [item]);
        const combinations = [];
        for (let i = 0; i <= arr.length - size; i++) {
            const smaller = this.getCombinations(arr.slice(i + 1), size - 1);
            smaller.forEach(combination => {
                combinations.push([arr[i], ...combination]);
            });
        }
        return combinations;
    }
    validateStackingRules(coupons) {
        const discountTypes = coupons.map(c => c.discountType);
        const hasMultipleShipping = discountTypes.filter(t => t === 'shipping').length > 1;
        if (hasMultipleShipping) {
            return { isValid: false, error: 'Cannot stack multiple shipping discounts' };
        }
        const percentageCoupons = coupons.filter(c => c.discountType === 'percentage');
        if (percentageCoupons.length > 2) {
            return { isValid: false, error: 'Too many percentage discounts' };
        }
        return { isValid: true };
    }
    estimateDiscount(coupon, price) {
        switch (coupon.discountType) {
            case 'percentage':
                const percentageDiscount = (price * coupon.discountValue) / 100;
                return coupon.maxDiscount ? Math.min(percentageDiscount, coupon.maxDiscount) : percentageDiscount;
            case 'fixed':
                return Math.min(coupon.discountValue, price);
            case 'shipping':
                return coupon.discountValue;
            case 'bogo':
                return price / 2;
            default:
                return 0;
        }
    }
    calculateTotalDiscount(coupons, originalPrice) {
        let currentPrice = originalPrice;
        let totalDiscount = 0;
        const percentageCoupons = coupons.filter(c => c.discountType === 'percentage');
        for (const coupon of percentageCoupons) {
            const discount = this.estimateDiscount(coupon, currentPrice);
            currentPrice -= discount;
            totalDiscount += discount;
        }
        const fixedCoupons = coupons.filter(c => c.discountType === 'fixed');
        for (const coupon of fixedCoupons) {
            const discount = Math.min(coupon.discountValue, currentPrice);
            currentPrice -= discount;
            totalDiscount += discount;
        }
        const shippingCoupons = coupons.filter(c => c.discountType === 'shipping');
        for (const coupon of shippingCoupons) {
            totalDiscount += coupon.discountValue;
        }
        return totalDiscount;
    }
    calculateStackedPrice(originalPrice, coupons) {
        const totalDiscount = this.calculateTotalDiscount(coupons, originalPrice);
        return Math.max(0, originalPrice - totalDiscount);
    }
    calculateStackConfidence(stack) {
        if (stack.coupons.length === 0)
            return 0;
        const avgSuccessRate = stack.coupons.reduce((sum, c) => sum + c.successRate, 0) / stack.coupons.length;
        const stackingPenalty = Math.max(0, (stack.coupons.length - 1) * 10);
        return Math.max(0, avgSuccessRate - stackingPenalty);
    }
    async applyCouponToCart(coupon, currentPrice) {
        const simulatedSuccessRate = coupon.successRate / 100;
        const isSuccessful = Math.random() < simulatedSuccessRate;
        if (isSuccessful) {
            const discount = this.estimateDiscount(coupon, currentPrice);
            return {
                success: true,
                newPrice: currentPrice - discount
            };
        }
        else {
            return {
                success: false,
                newPrice: currentPrice,
                error: 'Coupon code not valid or expired'
            };
        }
    }
    async updateCouponStats(couponId, wasSuccessful) {
        console.log(`Updating stats for coupon ${couponId}: ${wasSuccessful ? 'success' : 'failure'}`);
    }
}
exports.CouponStackingService = CouponStackingService;
exports.couponStackingService = new CouponStackingService();
//# sourceMappingURL=couponStackingService.js.map