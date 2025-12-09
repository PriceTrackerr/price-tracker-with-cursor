import axios from 'axios';
import * as cheerio from 'cheerio';
import { Product } from '../config/storage';

export interface SheinProduct {
  id: string;
  title: string;
  price: number;
  currency: string;
  imageUrl?: string;
  url: string;
  stockStatus: 'in_stock' | 'out_of_stock' | 'unknown';
  condition?: string;
  sellerRating?: number;
}

export class SheinService {
  private readonly baseUrl = 'https://www.shein.com';
  private readonly searchUrl = 'https://www.shein.com/search';
  private requestCount = 0;
  private lastRequestTime = 0;
  private readonly maxRequestsPerHour = 20; // Moderate limit
  private readonly delayBetweenRequests = 3500; // 3.5 seconds

  private async checkRateLimit(): Promise<boolean> {
    const now = Date.now();
    const hour = 3600000; // 1 hour in milliseconds

    // Reset counter if hour has passed
    if (now - this.lastRequestTime > hour) {
      this.requestCount = 0;
    }

    // Check if we're within limits
    if (this.requestCount >= this.maxRequestsPerHour) {
      console.log('⚠️ Rate limit reached for Shein. Limit: 20/hour');
      return false;
    }

    this.requestCount++;
    this.lastRequestTime = now;
    return true;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getRandomUserAgent(): string {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
    ];
    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }

  public async searchProducts(query: string, limit: number = 10): Promise<Product[]> {
    if (!(await this.checkRateLimit())) {
      return [];
    }

    try {
      // Add delay to respect rate limits
      await this.delay(this.delayBetweenRequests + Math.random() * 1000);

      const searchUrl = `${this.searchUrl}?keyword=${encodeURIComponent(query)}`;

      const response = await axios.get(searchUrl, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        timeout: 15000,
        maxRedirects: 5
      });

      const $ = cheerio.load(response.data);
      const products: Product[] = [];
      const now = new Date().toISOString();

      // Shein product selectors (may need adjustment based on current site structure)
      $('.product-item, .goods-item, [data-test="product-card"]').each((index, element) => {
        if (index >= limit) return false;

        try {
          const $el = $(element);

          // Extract product data
          const title = $el.find('.product-name, .goods-name, [data-test="product-title"]').text().trim();
          const priceText = $el.find('.product-price, .goods-price, [data-test="product-price"]').text().trim();
          const price = this.extractPrice(priceText);
          const imageUrl = $el.find('img').attr('src') || $el.find('img').attr('data-src');
          const productUrl = $el.find('a').attr('href');
          const stockStatus = this.extractStockStatus($el.text());

          if (title && price && productUrl) {
            const fullUrl = productUrl.startsWith('http') ? productUrl : `${this.baseUrl}${productUrl}`;

            products.push({
              id: `shein_${Date.now()}_${index}`,
              url: fullUrl,
              title,
              price,
              currency: 'USD',
              platform: 'shein',
              imageUrl: imageUrl || '',
              createdAt: now,
              updatedAt: now,
              userId: 'system',
              stockStatus
            } as Product);
          }
        } catch (error) {
          console.log(`Error parsing Shein product ${index}:`, error.message);
        }
      });

      return products;
    } catch (error) {
      console.error('Shein search failed:', error.message);
      return [];
    }
  }

  public async getProductDetails(url: string): Promise<SheinProduct | null> {
    if (!(await this.checkRateLimit())) {
      return null;
    }

    try {
      // Add delay to respect rate limits
      await this.delay(this.delayBetweenRequests + Math.random() * 1000);

      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        timeout: 15000,
        maxRedirects: 5
      });

      const $ = cheerio.load(response.data);

      // Extract product details
      const title = $('.product-name, .goods-name, [data-test="product-title"]').text().trim() ||
        $('h1').first().text().trim();

      const priceText = $('.product-price, .goods-price, [data-test="product-price"]').text().trim() ||
        $('.price').first().text().trim();
      const price = this.extractPrice(priceText);

      const imageUrl = $('.product-image img, .goods-image img').attr('src') ||
        $('.product-gallery img').first().attr('src');

      const stockStatus = this.extractStockStatus($('body').text());

      if (!title || !price) {
        return null;
      }

      return {
        id: `shein_${Date.now()}`,
        title,
        price,
        currency: 'USD',
        imageUrl: imageUrl || '',
        url,
        stockStatus
      };
    } catch (error) {
      console.error('Shein product details failed:', error.message);
      return null;
    }
  }

  private extractPrice(priceText: string): number {
    if (!priceText) return 0;

    // Remove currency symbols and extract numeric value
    const priceMatch = priceText.match(/[\$£€]?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
    if (priceMatch) {
      return parseFloat(priceMatch[1].replace(/,/g, ''));
    }

    return 0;
  }

  private extractStockStatus(text: string): 'in_stock' | 'out_of_stock' | 'unknown' {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('add to cart') || lowerText.includes('buy now') || lowerText.includes('add to bag')) {
      return 'in_stock';
    }

    if (lowerText.includes('out of stock') || lowerText.includes('unavailable') || lowerText.includes('sold out')) {
      return 'out_of_stock';
    }

    return 'unknown';
  }

  public getRateLimitStatus(): { count: number; lastReset: number; maxPerHour: number } {
    return {
      count: this.requestCount,
      lastReset: this.lastRequestTime,
      maxPerHour: this.maxRequestsPerHour
    };
  }

  public resetRateLimit(): void {
    this.requestCount = 0;
    this.lastRequestTime = 0;
  }
}

export default SheinService; 