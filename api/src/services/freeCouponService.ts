import axios from 'axios';
import * as cheerio from 'cheerio';
import { parseStringPromise } from 'xml2js';
import { POPULAR_COUPONS } from '../utils/popularCoupons';


interface Coupon {
  code: string;
  description: string;
  discount?: string;
  successRate?: number;
  source: 'Honey' | 'CouponFollow' | 'Reddit' | 'Slickdeals' | 'Verified';
  link?: string;
}

export class FreeCouponService {
  // Common brand keywords for validation
  private readonly BRAND_KEYWORDS = [
    'apple', 'samsung', 'sony', 'nike', 'adidas', 'dell', 'hp', 'lenovo',
    'asus', 'microsoft', 'google', 'amazon', 'walmart', 'target', 'shark',
    'dyson', 'bose', 'jbl', 'beats', 'lg', 'panasonic', 'canon', 'nikon'
  ];

  /**
   * Validate if a coupon is real and relevant
   */
  private isValidCoupon(coupon: Coupon, originalQuery: string): boolean {
    // Always allow Verified coupons (hardcoded popular/reliable codes)
    if (coupon.source === 'Verified') {
      return true;
    }

    // Must have a valid code (4-20 alphanumeric characters)
    if (!coupon.code || !/^[A-Z0-9]{4,20}$/.test(coupon.code)) {
      return false;
    }

    // Exclude generic noise words that aren't codes
    const excludeWords = ['EDIT', 'LINK', 'POST', 'TODAY', 'DEAL', 'MORE', 'CLICK', 'HERE', 'READ', 'VIEW'];
    if (excludeWords.includes(coupon.code)) {
      return false;
    }

    // Allow Slickdeals coupons (we extract real codes from RSS, not just deal links)
    // if (coupon.link && coupon.link.includes('slickdeals.net')) {
    //   return false;
    // }

    const queryLower = originalQuery.toLowerCase();
    const descLower = coupon.description.toLowerCase();

    // Check if title mentions the product brand OR is store-wide
    const hasBrand = this.BRAND_KEYWORDS.some(brand =>
      queryLower.includes(brand) && descLower.includes(brand)
    );
    const isStoreWide = /sitewide|store.*wide|entire.*store|all.*orders/i.test(coupon.description);

    // Must be brand-relevant OR store-wide
    if (!hasBrand && !isStoreWide) {
      return false;
    }

    // Must have clear discount indicators
    const hasDiscount = /\d+%|\$\d+|off|free|save/i.test(coupon.description) || coupon.discount;
    if (!hasDiscount) {
      return false;
    }

    return true;
  }

  /**
   * Find coupons for a given store or product title
   */
  async findCoupons(query: string): Promise<Coupon[]> {
    const cleanQuery = this.extractStoreName(query);
    console.log(`🎟️ Finding coupons for: ${cleanQuery}`);

    let allCoupons: Coupon[] = [];

    // 1. Try CouponFollow (Best working source)
    const cfCoupons = await this.scrapeCouponFollow(cleanQuery);
    allCoupons.push(...cfCoupons);

    // 2. Try Slickdeals RSS (Free, reliable)
    const sdCoupons = await this.scrapeSlickdeals(query);
    allCoupons.push(...sdCoupons);

    // 3. Try Reddit via old.reddit.com (Fallback)
    const redditCoupons = await this.scrapeReddit(cleanQuery);
    allCoupons.push(...redditCoupons);

    // 4. Add Verified Popular Coupons (Hardcoded Fallback)
    const popularCoupons = this.getPopularCoupons(query, cleanQuery);
    allCoupons.push(...popularCoupons);

    // Aggressive filtering: only keep REAL, relevant codes
    const validCoupons = allCoupons.filter(c => this.isValidCoupon(c, query));

    // Deduplicate by code
    const uniqueCoupons = Array.from(
      new Map(validCoupons.map(c => [c.code, c])).values()
    );

    console.log(`✅ Found ${uniqueCoupons.length} valid coupons (filtered from ${allCoupons.length} total)`);
    return uniqueCoupons.slice(0, 5);
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
              const permalink = p.data?.permalink || '';
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
                  link: permalink ? `https://reddit.com${permalink}` : undefined,
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

  private async scrapeSlickdeals(query: string): Promise<Coupon[]> {
    try {
      // Shorten query: use first part before comma for better RSS results
      const shortQuery = query.split(',')[0].trim();
      const encodedQuery = encodeURIComponent(shortQuery);
      const rssUrl = `https://slickdeals.net/newsearch.php?searcharea=deals&searchin=first&rss=1&query=${encodedQuery}`;

      console.log(`🔍 Fetching Slickdeals RSS for: ${shortQuery}`);

      const response = await axios.get(rssUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        timeout: 10000
      });

      const xmlData = await parseStringPromise(response.data);
      const items = xmlData?.rss?.channel?.[0]?.item || [];
      const coupons: Coupon[] = [];
      console.log(`📦 Slickdeals returned ${items.length} items for "${shortQuery}"`);

      for (const item of items.slice(0, 25)) {
        const title = item.title?.[0] || '';
        const description = item.description?.[0] || '';
        const link = item.link?.[0] || '';
        const fullText = `${title} ${description}`;

        // Only extract REAL coupon codes — must be explicitly called out as a code
        // Patterns like "use code SAVE20", "promo code: HOLIDAY", "coupon: DEAL15", "[CODE] XYZ"
        const codePatterns = [
          /(?:use|with|enter|apply|try)\s+(?:code|promo|coupon)\s*:?\s*([A-Z0-9]{3,20})/gi,
          /(?:code|promo|coupon)\s*:?\s*([A-Z0-9]{3,20})/gi,
          /\[([A-Z0-9]{4,15})\]/g, // codes in brackets
        ];

        let extractedCode: string | null = null;

        for (const pattern of codePatterns) {
          const match = pattern.exec(fullText);
          if (match && match[1]) {
            const code = match[1].toUpperCase();
            // Skip noise words that aren't real codes
            const noiseWords = ['THE', 'AND', 'FOR', 'WITH', 'THIS', 'EDIT', 'LINK', 'POST', 'TODAY', 'DEAL', 'MORE', 'CLICK', 'HERE', 'READ', 'VIEW', 'OFF', 'FREE', 'SAVE', 'NEW', 'HOT', 'NOW'];
            if (!noiseWords.includes(code) && code.length >= 4) {
              extractedCode = code;
              break;
            }
          }
        }

        // Only add if we found an ACTUAL coupon code explicitly mentioned
        if (extractedCode) {
          // Extract discount info for display
          const percentMatch = fullText.match(/(\d+)%\s*off/i);
          const dollarMatch = fullText.match(/\$(\d+)\s*off/i);
          const discount = percentMatch ? `${percentMatch[1]}% off` :
                           dollarMatch ? `$${dollarMatch[1]} off` : undefined;

          coupons.push({
            code: extractedCode,
            description: title.substring(0, 100),
            discount,
            source: 'Slickdeals' as const,
            link: link || undefined
          });
          console.log(`✅ Extracted real code: ${extractedCode} ${discount ? '(' + discount + ')' : ''} - ${title.substring(0, 50)}...`);
        }
      }

      // Remove duplicates
      const uniqueCoupons = Array.from(
        new Map(coupons.map(c => [c.code, c])).values()
      );

      console.log(`✅ Found ${uniqueCoupons.length} Slickdeals coupons (from ${items.length} items)`);
      return uniqueCoupons.slice(0, 5);

    } catch (error) {
      console.warn('❌ Slickdeals RSS fetch failed:', error instanceof Error ? error.message : 'Unknown error');
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

  private getPopularCoupons(query: string, store: string): Coupon[] {
    const queryLower = query.toLowerCase();
    const storeLower = store.toLowerCase();

    return POPULAR_COUPONS.filter(pc => {
      // Check if coupon applies to this store
      const storeMatch = pc.stores.includes('*') || pc.stores.some(s => storeLower.includes(s) || queryLower.includes(s));
      return storeMatch;
    }).map(pc => ({
      code: pc.code,
      description: pc.desc,
      source: 'Verified',
      successRate: 95
    }));
  }
}

export default new FreeCouponService();