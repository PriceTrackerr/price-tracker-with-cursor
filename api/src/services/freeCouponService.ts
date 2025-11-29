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
  private readonly HONEY_API = 'https://api.joinhoney.com/v2/offers';
  private readonly REDDIT_API = 'https://www.reddit.com/r/coupons/search.json';

  /**
   * Find coupons for a given store or product title
   */
  async findCoupons(query: string): Promise<Coupon[]> {
    const cleanQuery = this.extractStoreName(query);
    console.log(`🎟️ Finding coupons for: ${cleanQuery}`);

    // 1. Try Honey (Best source)
    let coupons = await this.fetchHoney(cleanQuery);
    if (coupons.length > 0) return coupons.slice(0, 3);

    // 2. Try CouponFollow (Fallback)
    console.log('⚠️ Honey empty, trying CouponFollow...');
    coupons = await this.scrapeCouponFollow(cleanQuery);
    if (coupons.length > 0) return coupons.slice(0, 3);

    // 3. Try Reddit (Last resort)
    console.log('⚠️ CouponFollow empty, trying Reddit...');
    coupons = await this.scrapeReddit(cleanQuery);

    return coupons.slice(0, 3);
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

  private async fetchHoney(query: string): Promise<Coupon[]> {
    try {
      const response = await axios.get(`${this.HONEY_API}?query=${query}`, {
        timeout: 5000
      });

      if (!response.data || !response.data.offers) return [];

      // Honey structure varies, simplified mapping
      // Note: This is a reverse-engineered structure, might need adjustment
      const offers = response.data.offers || [];
      return offers
        .filter((o: any) => o.code)
        .map((o: any) => ({
          code: o.code,
          description: o.description || `${o.value || '?'}% off at ${query}`,
          discount: o.value ? `${o.value}%` : undefined,
          successRate: o.rank ? Math.min(o.rank * 10, 100) : undefined,
          source: 'Honey'
        }));
    } catch (error) {
      console.warn('❌ Honey API failed:', error instanceof Error ? error.message : 'Unknown error');
      return [];
    }
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
            source: 'CouponFollow'
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
      const response = await axios.get(this.REDDIT_API, {
        params: {
          q: `site:${query}.com OR ${query} coupon`,
          sort: 'new',
          restrict_sr: 'on',
          limit: 5
        },
        timeout: 5000
      });

      const posts = response.data?.data?.children || [];
      return posts
        .map((p: any) => {
          const title = p.data.title;
          // Try to extract a code from title like "[Code]..." or "Use code XYZ"
          const codeMatch = title.match(/code\s*:?\s*([A-Z0-9]+)/i) || title.match(/\[([A-Z0-9]+)\]/);

          if (codeMatch) {
            return {
              code: codeMatch[1],
              description: title,
              source: 'Reddit'
            };
          }
          return null;
        })
        .filter((c: Coupon | null) => c !== null) as Coupon[];

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