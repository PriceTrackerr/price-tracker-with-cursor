"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
class SmartPriceChecker {
    constructor() {
        this.rateLimits = {
            amazon: { requests: 0, lastReset: Date.now(), maxPerHour: 50 },
            aliexpress: { requests: 0, lastReset: Date.now(), maxPerHour: 30 },
            ebay: { requests: 0, lastReset: Date.now(), maxPerHour: 100 },
            walmart: { requests: 0, lastReset: Date.now(), maxPerHour: 60 },
            bestbuy: { requests: 0, lastReset: Date.now(), maxPerHour: 40 }
        };
        this.delays = {
            amazon: 2000,
            aliexpress: 3000,
            ebay: 1500,
            walmart: 2500,
            bestbuy: 3000
        };
    }
    async checkRateLimit(platform) {
        const now = Date.now();
        const limit = this.rateLimits[platform];
        if (now - limit.lastReset > 3600000) {
            limit.requests = 0;
            limit.lastReset = now;
        }
        if (limit.requests >= limit.maxPerHour) {
            console.log(`⚠️ Rate limit reached for ${platform}. Waiting for reset...`);
            return false;
        }
        limit.requests++;
        return true;
    }
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    getRandomUserAgent() {
        const userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
        ];
        return userAgents[Math.floor(Math.random() * userAgents.length)];
    }
    async checkPrice(url) {
        const platform = this.getPlatformFromUrl(url);
        if (!platform) {
            return {
                success: false,
                error: 'Unsupported platform',
                timestamp: new Date().toISOString()
            };
        }
        const canProceed = await this.checkRateLimit(platform);
        if (!canProceed) {
            return {
                success: false,
                error: 'Rate limit exceeded',
                timestamp: new Date().toISOString()
            };
        }
        const delay = this.delays[platform];
        const randomDelay = delay + Math.random() * 1000;
        await this.delay(randomDelay);
        try {
            const response = await axios_1.default.get(url, {
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
            }
            else {
                return {
                    success: false,
                    error: 'Price not found',
                    timestamp: new Date().toISOString()
                };
            }
        }
        catch (error) {
            console.error(`Error checking price for ${url}:`, error.message);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
    getPlatformFromUrl(url) {
        if (url.includes('amazon'))
            return 'amazon';
        if (url.includes('aliexpress'))
            return 'aliexpress';
        if (url.includes('ebay'))
            return 'ebay';
        if (url.includes('walmart'))
            return 'walmart';
        if (url.includes('bestbuy'))
            return 'bestbuy';
        return null;
    }
    extractPrice(html, platform) {
        const pricePatterns = {
            amazon: /[\$£€](\d+(?:,\d{3})*(?:\.\d{2})?)/g,
            aliexpress: /[\$£€](\d+(?:,\d{3})*(?:\.\d{2})?)/g,
            ebay: /[\$£€](\d+(?:,\d{3})*(?:\.\d{2})?)/g,
            walmart: /[\$£€](\d+(?:,\d{3})*(?:\.\d{2})?)/g,
            bestbuy: /[\$£€](\d+(?:,\d{3})*(?:\.\d{2})?)/g
        };
        const pattern = pricePatterns[platform];
        if (!pattern)
            return null;
        const matches = html.match(pattern);
        if (matches && matches.length > 0) {
            const priceStr = matches[0].replace(/[\$£€,]/g, '');
            return parseFloat(priceStr);
        }
        return null;
    }
    async getRateLimitStatus() {
        return this.rateLimits;
    }
    async resetRateLimits() {
        Object.keys(this.rateLimits).forEach(platform => {
            this.rateLimits[platform].requests = 0;
            this.rateLimits[platform].lastReset = Date.now();
        });
    }
}
exports.default = new SmartPriceChecker();
//# sourceMappingURL=smartPriceChecker.js.map