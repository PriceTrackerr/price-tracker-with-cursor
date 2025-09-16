"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SheinService = void 0;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
class SheinService {
    constructor() {
        this.baseUrl = 'https://www.shein.com';
        this.searchUrl = 'https://www.shein.com/search';
        this.requestCount = 0;
        this.lastRequestTime = 0;
        this.maxRequestsPerHour = 20;
        this.delayBetweenRequests = 3500;
    }
    async checkRateLimit() {
        const now = Date.now();
        const hour = 3600000;
        if (now - this.lastRequestTime > hour) {
            this.requestCount = 0;
        }
        if (this.requestCount >= this.maxRequestsPerHour) {
            console.log('⚠️ Rate limit reached for Shein. Limit: 20/hour');
            return false;
        }
        this.requestCount++;
        this.lastRequestTime = now;
        return true;
    }
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    getRandomUserAgent() {
        const userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15'
        ];
        return userAgents[Math.floor(Math.random() * userAgents.length)];
    }
    async searchProducts(query, limit = 10) {
        if (!(await this.checkRateLimit())) {
            return [];
        }
        try {
            await this.delay(this.delayBetweenRequests + Math.random() * 1000);
            const searchUrl = `${this.searchUrl}?keyword=${encodeURIComponent(query)}`;
            const response = await axios_1.default.get(searchUrl, {
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
            const products = [];
            const now = new Date().toISOString();
            $('.product-item, .goods-item, [data-test="product-card"]').each((index, element) => {
                if (index >= limit)
                    return false;
                try {
                    const $el = $(element);
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
                        });
                    }
                }
                catch (error) {
                    console.log(`Error parsing Shein product ${index}:`, error.message);
                }
            });
            return products;
        }
        catch (error) {
            console.error('Shein search failed:', error.message);
            return [];
        }
    }
    async getProductDetails(url) {
        if (!(await this.checkRateLimit())) {
            return null;
        }
        try {
            await this.delay(this.delayBetweenRequests + Math.random() * 1000);
            const response = await axios_1.default.get(url, {
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
            const title = $('.product-name, .goods-name, [data-test="product-title"]').text().trim() ||
                $('h1').first().text().trim();
            const priceText = $('.product-price, .goods-price, [data-test="product-price"]').text().trim() ||
                $('.price').first().text().trim();
            const price = this.extractPrice(priceText);
            const imageUrl = $('.product-image img, .goods-image img').attr('src') ||
                $('.product-gallery img').first().attr('src');
            const stockStatus = this.extractStockStatus($.text());
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
        }
        catch (error) {
            console.error('Shein product details failed:', error.message);
            return null;
        }
    }
    extractPrice(priceText) {
        if (!priceText)
            return 0;
        const priceMatch = priceText.match(/[\$£€]?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
        if (priceMatch) {
            return parseFloat(priceMatch[1].replace(/,/g, ''));
        }
        return 0;
    }
    extractStockStatus(text) {
        const lowerText = text.toLowerCase();
        if (lowerText.includes('add to cart') || lowerText.includes('buy now') || lowerText.includes('add to bag')) {
            return 'in_stock';
        }
        if (lowerText.includes('out of stock') || lowerText.includes('unavailable') || lowerText.includes('sold out')) {
            return 'out_of_stock';
        }
        return 'unknown';
    }
    getRateLimitStatus() {
        return {
            count: this.requestCount,
            lastReset: this.lastRequestTime,
            maxPerHour: this.maxRequestsPerHour
        };
    }
    resetRateLimit() {
        this.requestCount = 0;
        this.lastRequestTime = 0;
    }
}
exports.SheinService = SheinService;
exports.default = SheinService;
//# sourceMappingURL=sheinService.js.map