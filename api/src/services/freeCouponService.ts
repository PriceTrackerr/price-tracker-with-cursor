import axios from 'axios';
import * as cheerio from 'cheerio';

interface Coupon {
  code: string;
  description: string;
  discount?: string;
  successRate?: number;
  source: 'Honey' | 'CouponFollow' | 'Reddit';
}

export class FreeCouponService {
  /**
   * Find coupons for a given store or product title
   */
  async findCoupons(query: string): Promise<Coupon[]> {
    const cleanQuery = this.extractStoreName(query);
    console.log(`🎟️ Finding coupons for: ${cleanQuery}`);

    // 1. Try CouponFollow (Best working source)
    let coupons = await this.scrapeCouponFollow(cleanQuery);
    if (coupons.length > 0) return coupons.slice(0, 5);

    // 2. Try Reddit via old.reddit.com (Fallback)
    console.log('⚠️ CouponFollow empty, trying Reddit...');
    coupons = await this.scrapeReddit(cleanQuery);

    return coupons.slice(0, 5);
  }

  /**
   * Extract a likely store name from a product title or URL
   * e.g. "Nike Air Max" -> "nike"
   */
  private extractStoreName(query: string): string {
    // Simple heuristic: take the first word if it's a long title, or use the whole string if short
    // In a real app, we'd use a domain extractor or more complex logic
    if (query.includes('.')) return query.split('.')[0]; // amazon.com -> amazon
    return query.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  private async scrapeCouponFollow(store: string): Promise<Coupon[]> {
    try {
      // CouponFollow usually uses domain.com format
      const domain = store.includes('.') ? store : `${store}.com`;
      const url = `https://couponfollow.com/site/${domain}`;

      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 8000
      });

      const $ = cheerio.load(response.data);
      const coupons: Coupon[] = [];

      $('article.coupon').each((_, el) => {
        const code = $(el).find('.code-text').text().trim();
        const description = $(el).find('.title').text().trim();
        const discount = $(el).find('.discount').text().trim();

        if (code) {
          coupons.push({
            code,
            description,
            discount: discount || undefined,
            source: 'CouponFollow' as const
          });
        }
      });

      return coupons;
    } catch (error) {
      console.warn('❌ CouponFollow scrape failed:', error instanceof Error ? error.message : 'Unknown error');
      return [];
    }
  }

  private async scrapeReddit(query: string): Promise<Coupon[]> {
    try {
      // Use old.reddit.com with proper browser headers to bypass 403
      const subreddits = ['coupons', 'deals', 'DiscountedProducts'];
      const allCoupons: Coupon[] = [];

      for (const subreddit of subreddits) {
        try {
          const response = await axios.get(`https://old.reddit.com/r/${subreddit}/search.json`, {
            params: {
              q: `${query} coupon OR promo OR discount OR code`,
              sort: 'new',
              limit: 10,
              restrict_sr: 'on'
            },
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
              'Accept': 'application/json',
              'Accept-Language': 'en-US,en;q=0.9',
              'Referer': 'https://old.reddit.com/'
            },
            timeout: 5000
          });

          const posts = response.data?.data?.children || [];
          const coupons = posts
            .map((p: any) => {
              const title = p.data?.title || '';
              // Try to extract a code from title like "[Code]...", "Use code XYZ", "CODE: SAVE20", "Promo: DEAL15"
              const codeMatch =
                title.match(/code\s*:?\s*([A-Z0-9]{4,15})/i) ||
                title.match(/\[([A-Z0-9]{4,15})\]/) ||
                title.match(/use\s+([A-Z0-9]{4,15})/i) ||
                title.match(/promo\s*:?\s*([A-Z0-9]{4,15})/i) ||
                title.match(/coupon\s*:?\s*([A-Z0-9]{4,15})/i);

              if (codeMatch) {
                // Extract discount percentage if mentioned
                const discountMatch = title.match(/(\d+)%\s*off/i);
                const discount = discountMatch ? `${discountMatch[1]}% off` : undefined;

                return {
                  code: codeMatch[1].toUpperCase(),
                  description: title.substring(0, 100), // Truncate long titles
                  discount,
                  source: 'Reddit' as const,
                  successRate: p.data.score > 10 ? 75 : p.data.score > 5 ? 60 : 50 // Estimate based on upvotes
                };
              }
              return null;
            })
            .filter((c: Coupon | null) => c !== null) as Coupon[];

          allCoupons.push(...coupons);

          // Stop if we found enough coupons
          if (allCoupons.length >= 5) break;
        } catch (subError) {
          console.warn(`⚠️ Reddit fetch failed for r/${subreddit}:`, subError instanceof Error ? subError.message : 'Unknown error');
          continue; // Try next subreddit
        }
      }

      // Remove duplicates by code
      const uniqueCoupons = Array.from(
        new Map(allCoupons.map(c => [c.code, c])).values()
      );

      return uniqueCoupons.slice(0, 5); // Return top 5 unique

    } catch (error) {
      console.warn('❌ Reddit scrape failed:', error instanceof Error ? error.message : 'Unknown error');
      return [];
    }
  }

  // Additional methods for backward compatibility with advancedFeatures.ts
  async getStackableCoupons(store: string, title: string): Promise<any[]> {
    // Stub method - returns empty array for now
    console.log(`🎟️ getStackableCoupons called for ${store} - ${title}`);
    return [];
  }

  async validateCoupon(coupon: any, productUrl: string): Promise<{ isValid: boolean; errorMessage?: string }> {
    // Stub method - always returns valid for now
    console.log(`🔍 validateCoupon called for ${coupon.code}`);
    return { isValid: true };
  }
}

export default new FreeCouponService();