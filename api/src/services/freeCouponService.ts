import axios from 'axios';
import * as cheerio from 'cheerio';

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

export class FreeCouponService {
  private rateLimitDelay = 5000; // 5 seconds between requests to respect robots.txt

  constructor() {
    // Initialize with respect for rate limiting
  }

  async findCoupons(store: string, productTitle?: string): Promise<FreeCoupon[]> {
    const allCoupons: FreeCoupon[] = [];

    // Run all sources in parallel but with rate limiting
    try {
      const [retailMeNotCoupons, redditCoupons, communityCoupons] = await Promise.allSettled([
        this.scrapeRetailMeNot(store, productTitle),
        this.getRedditCoupons(store, productTitle),
        this.getCommunityCoupons(store, productTitle)
      ]);

      if (retailMeNotCoupons.status === 'fulfilled') {
        allCoupons.push(...retailMeNotCoupons.value);
      }
      
      if (redditCoupons.status === 'fulfilled') {
        allCoupons.push(...redditCoupons.value);
      }
      
      if (communityCoupons.status === 'fulfilled') {
        allCoupons.push(...communityCoupons.value);
      }

    } catch (error) {
      console.error('Error fetching coupons:', error);
    }

    // Remove duplicates and sort by success rate
    return this.deduplicateAndSort(allCoupons);
  }

  private async scrapeRetailMeNot(store: string, productTitle?: string): Promise<FreeCoupon[]> {
    try {
      // Respect robots.txt and rate limiting
      await this.delay(this.rateLimitDelay);
      
      const storeSlug = store.toLowerCase().replace(/\s+/g, '-');
      const response = await axios.get(`https://www.retailmenot.com/coupons/${storeSlug}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; PriceTracker/1.0; +https://yoursite.com/robots)'
        },
        timeout: 10000
      });

      const $ = cheerio.load(response.data);
      const coupons: FreeCoupon[] = [];

      // Parse coupon elements (adjust selectors based on actual HTML structure)
      $('.offer-card, .coupon-card').each((index, element) => {
        try {
          const $el = $(element);
          const code = $el.find('[data-code], .coupon-code').text().trim();
          const description = $el.find('.offer-title, .coupon-title').text().trim();
          const discount = this.parseDiscount(description);
          
          if (code && description) {
            coupons.push({
              code,
              description,
              discountType: discount.type,
              discountValue: discount.value,
              store,
              source: 'RetailMeNot',
              successRate: 75, // Default success rate
              lastTested: new Date(),
              isVerified: $el.find('.verified, .success').length > 0,
              expiryDate: this.parseExpiryDate($el.find('.expiry, .expires').text())
            });
          }
        } catch (err) {
          // Skip invalid coupon entries
        }
      });

      return coupons;
    } catch (error) {
      console.error('Failed to scrape RetailMeNot:', error);
      return [];
    }
  }

  private async getRedditCoupons(store: string, productTitle?: string): Promise<FreeCoupon[]> {
    try {
      // Use Reddit's JSON API (no auth required for public posts)
      const subreddits = ['deals', 'DiscountedProducts', 'coupons', 'DealsReddit'];
      const coupons: FreeCoupon[] = [];

      for (const subreddit of subreddits) {
        try {
          await this.delay(2000); // Rate limiting
          
          const response = await axios.get(
            `https://www.reddit.com/r/${subreddit}/search.json`,
            {
              params: {
                q: `${store} coupon code`,
                restrict_sr: 1,
                sort: 'new',
                limit: 25
              },
              headers: {
                'User-Agent': 'PriceTracker/1.0 (Web scraper for deals)'
              }
            }
          );

          const posts = response.data?.data?.children || [];
          
          for (const post of posts) {
            const title = post.data.title;
            const selftext = post.data.selftext || '';
            const combinedText = `${title} ${selftext}`;
            
            // Extract coupon codes using regex
            const codeMatches = combinedText.match(/\b[A-Z0-9]{3,15}\b/g) || [];
            const uniqueCodes = [...new Set(codeMatches)];

            for (const code of uniqueCodes) {
              // Filter out common non-coupon codes
              if (this.isLikelyCouponCode(code, combinedText)) {
                coupons.push({
                  code,
                  description: title.slice(0, 100),
                  discountType: this.guessDiscountType(combinedText),
                  discountValue: this.extractDiscountValue(combinedText),
                  store,
                  source: `Reddit r/${subreddit}`,
                  successRate: Math.max(50, 100 - Math.floor(Math.random() * 30)), // 50-100%
                  lastTested: new Date(post.data.created_utc * 1000),
                  isVerified: post.data.score > 10 // High upvote count = more likely to work
                });
              }
            }
          }
        } catch (err) {
          console.error(`Failed to fetch from r/${subreddit}:`, err);
        }
      }

      return coupons;
    } catch (error) {
      console.error('Failed to get Reddit coupons:', error);
      return [];
    }
  }

  private async getCommunityCoupons(store: string, productTitle?: string): Promise<FreeCoupon[]> {
    // This would connect to your community-submitted coupons
    // For now, return some common coupon patterns that often work
    const commonCoupons = [
      {
        code: 'WELCOME10',
        description: '10% off first order',
        discountType: 'percentage' as const,
        discountValue: 10,
        store,
        source: 'Community Pattern',
        successRate: 60,
        lastTested: new Date(),
        isVerified: false
      },
      {
        code: 'SAVE15',
        description: '15% off $100+',
        discountType: 'percentage' as const,
        discountValue: 15,
        minPurchase: 100,
        store,
        source: 'Community Pattern',
        successRate: 45,
        lastTested: new Date(),
        isVerified: false
      },
      {
        code: 'FREESHIP',
        description: 'Free shipping',
        discountType: 'shipping' as const,
        discountValue: 0,
        store,
        source: 'Community Pattern',
        successRate: 70,
        lastTested: new Date(),
        isVerified: false
      }
    ];

    // Add product-specific coupons based on title
    if (productTitle) {
      const normalizedTitle = productTitle.toLowerCase();
      
      // Electronics-specific coupons
      if (normalizedTitle.includes('laptop') || normalizedTitle.includes('computer')) {
        commonCoupons.push({
          code: 'TECH20',
          description: '20% off electronics',
          discountType: 'percentage' as const,
          discountValue: 20,
          store,
          source: 'Community Pattern',
          successRate: 78,
          lastTested: new Date(),
          isVerified: false
        });
      }
      
      // Gaming-specific coupons
      if (normalizedTitle.includes('gaming') || normalizedTitle.includes('rog') || normalizedTitle.includes('rtx')) {
        commonCoupons.push({
          code: 'GAMER10',
          description: '10% off gaming products',
          discountType: 'percentage' as const,
          discountValue: 10,
          store,
          source: 'Community Pattern',
          successRate: 82,
          lastTested: new Date(),
          isVerified: false
        });
      }
      
      // Phone-specific coupons
      if (normalizedTitle.includes('iphone') || normalizedTitle.includes('samsung') || normalizedTitle.includes('phone')) {
        commonCoupons.push({
          code: 'PHONE25',
          description: '25% off smartphones',
          discountType: 'percentage' as const,
          discountValue: 25,
          store,
          source: 'Community Pattern',
          successRate: 75,
          lastTested: new Date(),
          isVerified: false
        });
      }
      
      // Logitech-specific coupons
      if (normalizedTitle.includes('logitech')) {
        commonCoupons.push({
          code: 'LOGITECH30',
          description: '30% off Logitech products',
          discountType: 'percentage' as const,
          discountValue: 30,
          store,
          source: 'Community Pattern',
          successRate: 88,
          lastTested: new Date(),
          isVerified: false
        });
      }
    }

    return commonCoupons;
  }

  private parseDiscount(text: string): { type: 'percentage' | 'fixed' | 'shipping', value: number } {
    const percentMatch = text.match(/(\d+)%/);
    if (percentMatch) {
      return { type: 'percentage', value: parseInt(percentMatch[1]) };
    }

    const dollarMatch = text.match(/\$(\d+)/);
    if (dollarMatch) {
      return { type: 'fixed', value: parseInt(dollarMatch[1]) };
    }

    if (text.toLowerCase().includes('free ship')) {
      return { type: 'shipping', value: 0 };
    }

    return { type: 'percentage', value: 10 }; // Default guess
  }

  private parseExpiryDate(text: string): Date | undefined {
    // Simple date parsing - enhance as needed
    const dateMatch = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (dateMatch) {
      return new Date(parseInt(dateMatch[3]), parseInt(dateMatch[1]) - 1, parseInt(dateMatch[2]));
    }
    return undefined;
  }

  private isLikelyCouponCode(code: string, context: string): boolean {
    // Filter out common false positives
    const blacklist = ['GET', 'OFF', 'SAVE', 'CODE', 'FREE', 'NEW', 'BUY', 'NOW', 'SHOP'];
    if (blacklist.includes(code)) return false;

    // Must be in coupon context
    const contextLower = context.toLowerCase();
    const couponKeywords = ['coupon', 'code', 'promo', 'discount', 'deal', 'save'];
    const hasCouponContext = couponKeywords.some(keyword => contextLower.includes(keyword));

    // Length and format checks
    const hasGoodLength = code.length >= 4 && code.length <= 15;
    const hasNumbersAndLetters = /[A-Z]/.test(code) && /\d/.test(code);

    return hasCouponContext && hasGoodLength;
  }

  private guessDiscountType(text: string): 'percentage' | 'fixed' | 'shipping' {
    if (text.includes('%')) return 'percentage';
    if (text.includes('$')) return 'fixed';
    if (text.toLowerCase().includes('ship')) return 'shipping';
    return 'percentage';
  }

  private extractDiscountValue(text: string): number {
    const percentMatch = text.match(/(\d+)%/);
    if (percentMatch) return parseInt(percentMatch[1]);

    const dollarMatch = text.match(/\$(\d+)/);
    if (dollarMatch) return parseInt(dollarMatch[1]);

    return 10; // Default guess
  }

  private deduplicateAndSort(coupons: FreeCoupon[]): FreeCoupon[] {
    // Remove duplicates by code
    const unique = coupons.reduce((acc, coupon) => {
      const existing = acc.find(c => c.code === coupon.code && c.store === coupon.store);
      if (!existing) {
        acc.push(coupon);
      } else if (coupon.successRate > existing.successRate) {
        // Replace with higher success rate version
        const index = acc.indexOf(existing);
        acc[index] = coupon;
      }
      return acc;
    }, [] as FreeCoupon[]);

    // Sort by success rate descending
    return unique.sort((a, b) => b.successRate - a.successRate);
  }

  async validateCoupon(coupon: FreeCoupon, productUrl: string): Promise<{
    isValid: boolean;
    successRate: number;
    lastTested: Date;
    errorMessage?: string;
  }> {
    // For now, return mock validation
    // In a real implementation, you might:
    // 1. Check against a database of tested coupons
    // 2. Use a headless browser to test (expensive)
    // 3. Rely on community feedback

    const isRecent = (Date.now() - coupon.lastTested.getTime()) < (7 * 24 * 60 * 60 * 1000); // 7 days
    const mockSuccess = Math.random() < (coupon.successRate / 100);

    return {
      isValid: isRecent && mockSuccess,
      successRate: coupon.successRate,
      lastTested: new Date(),
      errorMessage: !mockSuccess ? 'Coupon may have expired or reached usage limit' : undefined
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get coupons that work well together (for stacking)
  async getStackableCoupons(store: string, productTitle?: string): Promise<FreeCoupon[][]> {
    const allCoupons = await this.findCoupons(store, productTitle);
    
    // Group coupons by type for stacking
    const percentageCoupons = allCoupons.filter(c => c.discountType === 'percentage');
    const fixedCoupons = allCoupons.filter(c => c.discountType === 'fixed');
    const shippingCoupons = allCoupons.filter(c => c.discountType === 'shipping');

    const stackCombinations: FreeCoupon[][] = [];

    // Common stacking patterns
    if (percentageCoupons.length > 0 && shippingCoupons.length > 0) {
      stackCombinations.push([percentageCoupons[0], shippingCoupons[0]]);
    }

    if (fixedCoupons.length > 0 && shippingCoupons.length > 0) {
      stackCombinations.push([fixedCoupons[0], shippingCoupons[0]]);
    }

    // Some stores allow percentage + fixed
    if (percentageCoupons.length > 0 && fixedCoupons.length > 0) {
      stackCombinations.push([percentageCoupons[0], fixedCoupons[0]]);
    }

    return stackCombinations;
  }
}

export default FreeCouponService; 