import axios from 'axios';
// import { getDb } from '../config/firebase';

interface PriceCheckResult {
  success: boolean;
  price?: number;
  error?: string;
  timestamp: string;
}

class SmartPriceChecker {
  private rateLimits = {
    amazon: { requests: 0, lastReset: Date.now(), maxPerHour: 50 },
    aliexpress: { requests: 0, lastReset: Date.now(), maxPerHour: 30 },
    ebay: { requests: 0, lastReset: Date.now(), maxPerHour: 100 },
    walmart: { requests: 0, lastReset: Date.now(), maxPerHour: 60 },
    bestbuy: { requests: 0, lastReset: Date.now(), maxPerHour: 40 }
  };

  private delays = {
    amazon: 2000, // 2 seconds
    aliexpress: 3000, // 3 seconds
    ebay: 1500, // 1.5 seconds
    walmart: 2500, // 2.5 seconds
    bestbuy: 3000 // 3 seconds
  };

  private async checkRateLimit(platform: string): Promise<boolean> {
    const now = Date.now();
    const limit = this.rateLimits[platform as keyof typeof this.rateLimits];

    // Reset counter if hour has passed
    if (now - limit.lastReset > 3600000) { // 1 hour
      limit.requests = 0;
      limit.lastReset = now;
    }

    // Check if we're within limits
    if (limit.requests >= limit.maxPerHour) {
      console.log(`⚠️ Rate limit reached for ${platform}. Waiting for reset...`);
      return false;
    }

    limit.requests++;
    return true;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getRandomUserAgent(): string {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
    ];
    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }

  async checkPrice(url: string): Promise<PriceCheckResult> {
    const platform = this.getPlatformFromUrl(url);

    if (!platform) {
      return {
        success: false,
        error: 'Unsupported platform',
        timestamp: new Date().toISOString()
      };
    }

    // Check rate limit
    const canProceed = await this.checkRateLimit(platform);
    if (!canProceed) {
      return {
        success: false,
        error: 'Rate limit exceeded',
        timestamp: new Date().toISOString()
      };
    }

    // Add random delay
    const delay = this.delays[platform as keyof typeof this.delays];
    const randomDelay = delay + Math.random() * 1000; // Add up to 1 second randomness
    await this.delay(randomDelay);

    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        timeout: 10000,
        maxRedirects: 5
      });

      const price = this.extractPrice(response.data, platform);

      if (price) {
        return {
          success: true,
          price,
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          success: false,
          error: 'Price not found',
          timestamp: new Date().toISOString()
        };
      }

    } catch (error) {
      console.error(`Error checking price for ${url}:`, error.message);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  private getPlatformFromUrl(url: string): string | null {
    if (url.includes('amazon')) return 'amazon';
    if (url.includes('aliexpress')) return 'aliexpress';
    if (url.includes('ebay')) return 'ebay';
    if (url.includes('walmart')) return 'walmart';
    if (url.includes('bestbuy')) return 'bestbuy';
    return null;
  }

  private extractPrice(html: string, platform: string): number | null {
    // This is a simplified price extraction
    // In production, you'd want more sophisticated parsing

    const pricePatterns = {
      amazon: /[\$£€](\d+(?:,\d{3})*(?:\.\d{2})?)/g,
      aliexpress: /[\$£€](\d+(?:,\d{3})*(?:\.\d{2})?)/g,
      ebay: /[\$£€](\d+(?:,\d{3})*(?:\.\d{2})?)/g,
      walmart: /[\$£€](\d+(?:,\d{3})*(?:\.\d{2})?)/g,
      bestbuy: /[\$£€](\d+(?:,\d{3})*(?:\.\d{2})?)/g
    };

    const pattern = pricePatterns[platform as keyof typeof pricePatterns];
    if (!pattern) return null;

    const matches = html.match(pattern);
    if (matches && matches.length > 0) {
      // Return the first price found (you might want to be more selective)
      const priceStr = matches[0].replace(/[\$£€,]/g, '');
      return parseFloat(priceStr);
    }

    return null;
  }

  async getRateLimitStatus(): Promise<any> {
    return this.rateLimits;
  }

  async resetRateLimits(): Promise<void> {
    Object.keys(this.rateLimits).forEach(platform => {
      this.rateLimits[platform as keyof typeof this.rateLimits].requests = 0;
      this.rateLimits[platform as keyof typeof this.rateLimits].lastReset = Date.now();
    });
  }
}

export default new SmartPriceChecker(); 