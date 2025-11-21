import { Product, CouponInfo, CouponStack } from '../config/storage';

export interface CouponSearchResult {
  coupons: CouponInfo[];
  bestStack: CouponStack;
  totalSavings: number;
  confidence: number; // How confident we are these coupons will work
}

export interface CouponValidationResult {
  isValid: boolean;
  errorMessage?: string;
  finalPrice: number;
  appliedDiscount: number;
  validationDate: string;
}

export class CouponStackingService {
  private readonly couponSources = [
    'retailer_api',
    'honey',
    'rakuten',
    'capital_one_shopping',
    'browser_extension_data',
    'community_submissions'
  ];

  /**
   * Find all available coupons for a product
   */
  public async findCoupons(product: Product): Promise<CouponSearchResult> {
    const coupons: CouponInfo[] = [];
    
    // Fetch coupons from various sources
    for (const source of this.couponSources) {
      const sourceCoupons = await this.fetchCouponsFromSource(source, product);
      coupons.push(...sourceCoupons);
    }

    // Remove duplicates and filter valid coupons
    const uniqueCoupons = this.deduplicateCoupons(coupons);
    const validCoupons = await this.filterValidCoupons(uniqueCoupons, product);

    // Find the best stacking combination
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

  /**
   * Pre-validate a coupon stack without actually applying it
   */
  public async validateStack(stack: CouponStack, product: Product): Promise<CouponValidationResult> {
    try {
      // Check if coupons are still valid
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

      // Check stacking rules
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

      // Calculate final price
      const finalPrice = this.calculateStackedPrice(product.price, stack.coupons);
      const appliedDiscount = product.price - finalPrice;

      return {
        isValid: true,
        finalPrice,
        appliedDiscount,
        validationDate: new Date().toISOString()
      };
    } catch (error) {
      return {
        isValid: false,
        errorMessage: 'Validation failed due to technical error',
        finalPrice: product.price,
        appliedDiscount: 0,
        validationDate: new Date().toISOString()
      };
    }
  }

  /**
   * Apply coupons automatically in the browser
   */
  public async autoApplyCoupons(product: Product, coupons: CouponInfo[]): Promise<{
    appliedCoupons: CouponInfo[];
    finalPrice: number;
    totalSavings: number;
    failedCoupons: { coupon: CouponInfo; reason: string }[];
  }> {
    const appliedCoupons: CouponInfo[] = [];
    const failedCoupons: { coupon: CouponInfo; reason: string }[] = [];
    let currentPrice = product.price;

    // Sort coupons by expected impact (largest discounts first)
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
          
          // Update coupon success rate
          await this.updateCouponStats(coupon.id, true);
        } else {
          failedCoupons.push({
            coupon,
            reason: applicationResult.error || 'Unknown error'
          });
          
          // Update coupon failure rate
          await this.updateCouponStats(coupon.id, false);
        }
      } catch (error) {
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

  private async fetchCouponsFromSource(source: string, product: Product): Promise<CouponInfo[]> {
    // Mock implementation - in reality, this would integrate with various coupon APIs
    const mockCoupons: CouponInfo[] = [
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

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return mockCoupons;
  }

  private deduplicateCoupons(coupons: CouponInfo[]): CouponInfo[] {
    const seen = new Set<string>();
    return coupons.filter(coupon => {
      const key = `${coupon.code}-${coupon.platform}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private async filterValidCoupons(coupons: CouponInfo[], product: Product): Promise<CouponInfo[]> {
    return coupons.filter(coupon => {
      // Check expiration
      if (new Date(coupon.expiresAt) < new Date()) return false;
      
      // Check platform compatibility
      if (coupon.platform !== product.platform) return false;
      
      // Check minimum purchase requirement
      if (coupon.minPurchase && product.price < coupon.minPurchase) return false;
      
      // Check success rate threshold
      if (coupon.successRate < 50) return false;
      
      return true;
    });
  }

  private async findBestStack(coupons: CouponInfo[], product: Product): Promise<CouponStack> {
    const stackableCoupons = coupons.filter(c => c.isStackable);
    const nonStackableCoupons = coupons.filter(c => !c.isStackable);

    let bestStack: CouponStack = {
      coupons: [],
      totalDiscount: 0,
      finalPrice: product.price,
      savings: 0,
      isValid: true,
      validationDate: new Date().toISOString()
    };

    // Try single non-stackable coupons
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

    // Try stackable combinations
    if (stackableCoupons.length > 0) {
      const stackResult = this.findBestStackableCombination(stackableCoupons, product.price);
      if (stackResult.totalDiscount > bestStack.totalDiscount) {
        bestStack = stackResult;
      }
    }

    return bestStack;
  }

  private findBestStackableCombination(coupons: CouponInfo[], originalPrice: number): CouponStack {
    let bestCombination: CouponInfo[] = [];
    let bestDiscount = 0;

    // Try all combinations (limited to reasonable size)
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

  private getCombinations<T>(arr: T[], size: number): T[][] {
    if (size === 1) return arr.map(item => [item]);
    
    const combinations: T[][] = [];
    for (let i = 0; i <= arr.length - size; i++) {
      const smaller = this.getCombinations(arr.slice(i + 1), size - 1);
      smaller.forEach(combination => {
        combinations.push([arr[i]!, ...combination]);
      });
    }
    
    return combinations;
  }

  private validateStackingRules(coupons: CouponInfo[]): { isValid: boolean; error?: string } {
    // Check for conflicting discount types
    const discountTypes = coupons.map(c => c.discountType);
    const hasMultipleShipping = discountTypes.filter(t => t === 'shipping').length > 1;
    
    if (hasMultipleShipping) {
      return { isValid: false, error: 'Cannot stack multiple shipping discounts' };
    }

    // Check for percentage + percentage conflicts (some retailers don't allow this)
    const percentageCoupons = coupons.filter(c => c.discountType === 'percentage');
    if (percentageCoupons.length > 2) {
      return { isValid: false, error: 'Too many percentage discounts' };
    }

    return { isValid: true };
  }

  private estimateDiscount(coupon: CouponInfo, price: number): number {
    switch (coupon.discountType) {
      case 'percentage':
        const percentageDiscount = (price * coupon.discountValue) / 100;
        return coupon.maxDiscount ? Math.min(percentageDiscount, coupon.maxDiscount) : percentageDiscount;
      
      case 'fixed':
        return Math.min(coupon.discountValue, price);
      
      case 'shipping':
        return coupon.discountValue; // Assume shipping cost
      
      case 'bogo':
        return price / 2; // Simplified BOGO calculation
      
      default:
        return 0;
    }
  }

  private calculateTotalDiscount(coupons: CouponInfo[], originalPrice: number): number {
    let currentPrice = originalPrice;
    let totalDiscount = 0;

    // Apply percentage discounts first
    const percentageCoupons = coupons.filter(c => c.discountType === 'percentage');
    for (const coupon of percentageCoupons) {
      const discount = this.estimateDiscount(coupon, currentPrice);
      currentPrice -= discount;
      totalDiscount += discount;
    }

    // Then apply fixed discounts
    const fixedCoupons = coupons.filter(c => c.discountType === 'fixed');
    for (const coupon of fixedCoupons) {
      const discount = Math.min(coupon.discountValue, currentPrice);
      currentPrice -= discount;
      totalDiscount += discount;
    }

    // Add shipping discounts separately
    const shippingCoupons = coupons.filter(c => c.discountType === 'shipping');
    for (const coupon of shippingCoupons) {
      totalDiscount += coupon.discountValue;
    }

    return totalDiscount;
  }

  private calculateStackedPrice(originalPrice: number, coupons: CouponInfo[]): number {
    const totalDiscount = this.calculateTotalDiscount(coupons, originalPrice);
    return Math.max(0, originalPrice - totalDiscount);
  }

  private calculateStackConfidence(stack: CouponStack): number {
    if (stack.coupons.length === 0) return 0;
    
    const avgSuccessRate = stack.coupons.reduce((sum, c) => sum + c.successRate, 0) / stack.coupons.length;
    const stackingPenalty = Math.max(0, (stack.coupons.length - 1) * 10); // Reduce confidence for complex stacks
    
    return Math.max(0, avgSuccessRate - stackingPenalty);
  }

  private async applyCouponToCart(coupon: CouponInfo, currentPrice: number): Promise<{
    success: boolean;
    newPrice: number;
    error?: string;
  }> {
    // Mock implementation - in reality, this would interact with the browser extension
    // to actually apply coupons in the shopping cart
    
    const simulatedSuccessRate = coupon.successRate / 100;
    const isSuccessful = Math.random() < simulatedSuccessRate;
    
    if (isSuccessful) {
      const discount = this.estimateDiscount(coupon, currentPrice);
      return {
        success: true,
        newPrice: currentPrice - discount
      };
    } else {
      return {
        success: false,
        newPrice: currentPrice,
        error: 'Coupon code not valid or expired'
      };
    }
  }

  private async updateCouponStats(couponId: string, wasSuccessful: boolean): Promise<void> {
    // Update coupon usage statistics in the database
    // This would track success/failure rates to improve future recommendations
    console.log(`Updating stats for coupon ${couponId}: ${wasSuccessful ? 'success' : 'failure'}`);
  }
}

export const couponStackingService = new CouponStackingService(); 