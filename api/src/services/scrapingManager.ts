import axios from 'axios';
import * as cheerio from 'cheerio';
import { getDb } from '../config/database';

interface ScrapingResult {
  success: boolean;
  price?: number;
  title?: string;
  imageUrl?: string;
  stockStatus?: string;
  error?: string;
  source: 'api' | 'scraping' | 'cache';
  timestamp: string;
}

interface PlatformConfig {
  name: string;
  riskLevel: 'low' | 'medium' | 'high';
  maxRequestsPerHour: number;
  delayBetweenRequests: number;
  useProxy: boolean;
  retryAttempts: number;
  fallbackToCache: boolean;
  cacheExpiryHours: number;
}

class ScrapingManager {
  private platformConfigs: Record<string, PlatformConfig> = {
    amazon: {
      name: 'Amazon',
      riskLevel: 'low',
      maxRequestsPerHour: 100,
      delayBetweenRequests: 1000,
      useProxy: false,
      retryAttempts: 3,
      fallbackToCache: true,
      cacheExpiryHours: 6
    },
    ebay: {
      name: 'eBay',
      riskLevel: 'low',
      maxRequestsPerHour: 150,
      delayBetweenRequests: 800,
      useProxy: false,
      retryAttempts: 3,
      fallbackToCache: true,
      cacheExpiryHours: 4
    },
    aliexpress: {
      name: 'AliExpress',
      riskLevel: 'low',
      maxRequestsPerHour: 50,
      delayBetweenRequests: 2000,
      useProxy: false,
      retryAttempts: 3,
      fallbackToCache: true,
      cacheExpiryHours: 8
    },
    bestbuy: {
      name: 'Best Buy',
      riskLevel: 'medium',
      maxRequestsPerHour: 30,
      delayBetweenRequests: 3000,
      useProxy: true,
      retryAttempts: 2,
      fallbackToCache: true,
      cacheExpiryHours: 12
    },
    target: {
      name: 'Target',
      riskLevel: 'high',
      maxRequestsPerHour: 10,
      delayBetweenRequests: 5000,
      useProxy: true,
      retryAttempts: 1,
      fallbackToCache: true,
      cacheExpiryHours: 24
    },
    walmart: {
      name: 'Walmart',
      riskLevel: 'high',
      maxRequestsPerHour: 15,
      delayBetweenRequests: 4000,
      useProxy: true,
      retryAttempts: 1,
      fallbackToCache: true,
      cacheExpiryHours: 24
    },
    shein: {
      name: 'Shein',
      riskLevel: 'medium',
      maxRequestsPerHour: 20,
      delayBetweenRequests: 3500,
      useProxy: true,
      retryAttempts: 2,
      fallbackToCache: true,
      cacheExpiryHours: 18
    }
  };

  private requestCounts: Record<string, { count: number; lastReset: number }> = {};
  private userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  ];

  private async checkRateLimit(platform: string): Promise<boolean> {
    const config = this.platformConfigs[platform];
    if (!config) return false;

    const now = Date.now();
    const hour = 3600000; // 1 hour in milliseconds

    if (!this.requestCounts[platform]) {
      this.requestCounts[platform] = { count: 0, lastReset: now };
    }

    // Reset counter if hour has passed
    if (now - this.requestCounts[platform].lastReset > hour) {
      this.requestCounts[platform] = { count: 0, lastReset: now };
    }

    // Check if we're within limits
    if (this.requestCounts[platform].count >= config.maxRequestsPerHour) {
      console.log(`⚠️ Rate limit reached for ${platform}. Limit: ${config.maxRequestsPerHour}/hour`);
      return false;
    }

    this.requestCounts[platform].count++;
    return true;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  private async getProxy(): Promise<string | null> {
    // For now, return null. In production, you'd integrate with a proxy service
    // like Bright Data, SmartProxy, or Oxylabs
    return null;
  }

  private async checkCache(url: string): Promise<ScrapingResult | null> {
    try {
      const db = getDb();
      const cacheKey = `cache_${Buffer.from(url).toString('base64')}`;

      // Check if we have cached data
      const cachedData = await db.getProductById(cacheKey);
      if (cachedData && cachedData.updatedAt) {
        const cacheAge = Date.now() - new Date(cachedData.updatedAt).getTime();
        const config = this.platformConfigs[this.getPlatformFromUrl(url)];
        const maxAge = (config?.cacheExpiryHours || 24) * 3600000;

        if (cacheAge < maxAge) {
          return {
            success: true,
            price: cachedData.price,
            title: cachedData.title,
            imageUrl: cachedData.imageUrl,
            stockStatus: cachedData.stockStatus,
            source: 'cache',
            timestamp: new Date().toISOString()
          };
        }
      }
    } catch (error) {
      console.log('Cache check failed:', error.message);
    }
    return null;
  }

  private async saveToCache(url: string, result: ScrapingResult): Promise<void> {
    try {
      const db = getDb();
      const cacheKey = `cache_${Buffer.from(url).toString('base64')}`;

      await db.addProduct({
        url,
        title: result.title || 'Cached Product',
        price: result.price || 0,
        currency: 'USD',
        platform: this.getPlatformFromUrl(url) || 'unknown',
        imageUrl: result.imageUrl,
        stockStatus: result.stockStatus || 'unknown',
        userId: 'system'
      });
    } catch (error) {
      console.log('Cache save failed:', error.message);
    }
  }

  private getPlatformFromUrl(url: string): string {
    if (url.includes('amazon')) return 'amazon';
    if (url.includes('ebay')) return 'ebay';
    if (url.includes('aliexpress')) return 'aliexpress';
    if (url.includes('bestbuy')) return 'bestbuy';
    if (url.includes('target')) return 'target';
    if (url.includes('walmart')) return 'walmart';
    if (url.includes('shein')) return 'shein';
    return 'unknown';
  }

  async scrapeProduct(url: string): Promise<ScrapingResult> {
    const platform = this.getPlatformFromUrl(url);
    const config = this.platformConfigs[platform];

    if (!config) {
      return {
        success: false,
        error: 'Unsupported platform',
        source: 'scraping',
        timestamp: new Date().toISOString()
      };
    }

    // Check cache first
    if (config.fallbackToCache) {
      const cached = await this.checkCache(url);
      if (cached) {
        console.log(`📦 Using cached data for ${platform}`);
        return cached;
      }
    }

    // Check rate limit
    const canProceed = await this.checkRateLimit(platform);
    if (!canProceed) {
      return {
        success: false,
        error: 'Rate limit exceeded',
        source: 'scraping',
        timestamp: new Date().toISOString()
      };
    }

    // Add delay
    await this.delay(config.delayBetweenRequests + Math.random() * 1000);

    // Attempt scraping with retries
    for (let attempt = 1; attempt <= config.retryAttempts; attempt++) {
      try {
        const result = await this.attemptScraping(url, platform, config);

        if (result.success) {
          // Save to cache
          if (config.fallbackToCache) {
            await this.saveToCache(url, result);
          }
          return result;
        }
      } catch (error) {
        console.log(`Attempt ${attempt} failed for ${platform}:`, error.message);

        if (attempt < config.retryAttempts) {
          await this.delay(2000 * attempt); // Exponential backoff
        }
      }
    }

    return {
      success: false,
      error: 'All scraping attempts failed',
      source: 'scraping',
      timestamp: new Date().toISOString()
    };
  }

  private async attemptScraping(url: string, platform: string, config: PlatformConfig): Promise<ScrapingResult> {
    const headers = {
      'User-Agent': this.getRandomUserAgent(),
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    };

    // Add platform-specific headers
    if (platform === 'amazon') {
      headers['Accept'] = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8';
    }

    const axiosConfig: any = {
      headers,
      timeout: 15000,
      maxRedirects: 5,
      validateStatus: (status: number) => status < 500
    };

    // Use proxy if configured
    if (config.useProxy) {
      const proxy = await this.getProxy();
      if (proxy) {
        axiosConfig.proxy = {
          host: proxy.split(':')[0],
          port: parseInt(proxy.split(':')[1])
        };
      }
    }

    const response = await axios.get(url, axiosConfig);

    if (response.status !== 200) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const $ = cheerio.load(response.data);
    const result = this.extractProductData($, platform);

    return {
      ...result,
      source: 'scraping',
      timestamp: new Date().toISOString(),
      success: result.success ?? true
    };
  }

  private extractProductData($: cheerio.CheerioAPI, platform: string): Partial<ScrapingResult> {
    switch (platform) {
      case 'amazon':
        return this.extractAmazonData($);
      case 'ebay':
        return this.extractEbayData($);
      case 'bestbuy':
        return this.extractBestBuyData($);
      case 'target':
        return this.extractTargetData($);
      case 'walmart':
        return this.extractWalmartData($);
      case 'shein':
        return this.extractSheinData($);
      default:
        return this.extractGenericData($);
    }
  }

  private extractAmazonData($: cheerio.CheerioAPI): Partial<ScrapingResult> {
    const price = $('.a-price-whole').first().text().replace(/[^\d.]/g, '');
    const title = $('#productTitle').text().trim();
    const imageUrl = $('#landingImage').attr('src') || $('.a-dynamic-image').attr('src');
    const stockStatus = $('.a-color-success').text().includes('In Stock') ? 'in_stock' : 'out_of_stock';

    return {
      success: !!price,
      price: price ? parseFloat(price) : undefined,
      title,
      imageUrl,
      stockStatus
    };
  }

  private extractEbayData($: cheerio.CheerioAPI): Partial<ScrapingResult> {
    const price = $('.x-price-primary .ux-textspans').first().text().replace(/[^\d.]/g, '');
    const title = $('h1.x-item-title__mainTitle span').text().trim();
    const imageUrl = $('.ux-image-carousel-item img').attr('src');
    const stockStatus = $('.x-item-condition__text').text().includes('New') ? 'in_stock' : 'unknown';

    return {
      success: !!price,
      price: price ? parseFloat(price) : undefined,
      title,
      imageUrl,
      stockStatus
    };
  }

  private extractBestBuyData($: cheerio.CheerioAPI): Partial<ScrapingResult> {
    const price = $('.priceView-customer-price span').first().text().replace(/[^\d.]/g, '');
    const title = $('h1.heading-5').text().trim();
    const imageUrl = $('.primary-image img').attr('src');
    const stockStatus = $('.fulfillment-add-to-cart-button').length > 0 ? 'in_stock' : 'out_of_stock';

    return {
      success: !!price,
      price: price ? parseFloat(price) : undefined,
      title,
      imageUrl,
      stockStatus
    };
  }

  private extractTargetData($: cheerio.CheerioAPI): Partial<ScrapingResult> {
    const price = $('[data-test="product-price"]').text().replace(/[^\d.]/g, '');
    const title = $('h1[data-test="product-title"]').text().trim();
    const imageUrl = $('.slideDeckPicture img').attr('src');
    const stockStatus = $('[data-test="shipItButton"]').length > 0 ? 'in_stock' : 'out_of_stock';

    return {
      success: !!price,
      price: price ? parseFloat(price) : undefined,
      title,
      imageUrl,
      stockStatus
    };
  }

  private extractWalmartData($: cheerio.CheerioAPI): Partial<ScrapingResult> {
    const price = $('.price-characteristic').first().text().replace(/[^\d.]/g, '');
    const title = $('h1.prod-ProductTitle').text().trim();
    const imageUrl = $('.prod-hero-image-carousel img').attr('src');
    const stockStatus = $('.prod-ProductOffer').text().includes('Add to cart') ? 'in_stock' : 'out_of_stock';

    return {
      success: !!price,
      price: price ? parseFloat(price) : undefined,
      title,
      imageUrl,
      stockStatus
    };
  }

  private extractSheinData($: cheerio.CheerioAPI): Partial<ScrapingResult> {
    const price = $('.price-current').text().replace(/[^\d.]/g, '');
    const title = $('.product-intro__head-name').text().trim();
    const imageUrl = $('.product-intro__main-pic img').attr('src');
    const stockStatus = $('.product-intro__add-cart').length > 0 ? 'in_stock' : 'out_of_stock';

    return {
      success: !!price,
      price: price ? parseFloat(price) : undefined,
      title,
      imageUrl,
      stockStatus
    };
  }

  private extractGenericData($: cheerio.CheerioAPI): Partial<ScrapingResult> {
    // Generic price extraction patterns
    const pricePatterns = [
      /[\$£€](\d+(?:,\d{3})*(?:\.\d{2})?)/g,
      /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*USD/g,
      /price[:\s]*[\$£€]?(\d+(?:,\d{3})*(?:\.\d{2})?)/gi
    ];

    let price: number | undefined;
    for (const pattern of pricePatterns) {
      const matches = $('body').text().match(pattern);
      if (matches && matches.length > 0) {
        const priceStr = matches[0].replace(/[\$£€,\s]/g, '');
        price = parseFloat(priceStr);
        break;
      }
    }

    return {
      success: !!price,
      price
    };
  }

  async getRateLimitStatus(): Promise<Record<string, any>> {
    return this.requestCounts;
  }

  async resetRateLimits(): Promise<void> {
    this.requestCounts = {};
  }
}

export default new ScrapingManager(); 