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
exports.FreeCouponService = void 0;
const axios_1 = __importDefault(require("axios"));
const cheerio = __importStar(require("cheerio"));
class FreeCouponService {
    async findCoupons(query) {
        const cleanQuery = this.extractStoreName(query);
        console.log(`🎟️ Finding coupons for: ${cleanQuery}`);
        let coupons = await this.scrapeCouponFollow(cleanQuery);
        if (coupons.length > 0)
            return coupons.slice(0, 5);
        console.log('⚠️ CouponFollow empty, trying Reddit...');
        coupons = await this.scrapeReddit(cleanQuery);
        return coupons.slice(0, 5);
    }
    extractStoreName(query) {
        if (query.includes('.'))
            return query.split('.')[0];
        return query.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    }
    async scrapeCouponFollow(store) {
        try {
            const domain = store.includes('.') ? store : `${store}.com`;
            const url = `https://couponfollow.com/site/${domain}`;
            const response = await axios_1.default.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                },
                timeout: 8000
            });
            const $ = cheerio.load(response.data);
            const coupons = [];
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
        }
        catch (error) {
            console.warn('❌ CouponFollow scrape failed:', error instanceof Error ? error.message : 'Unknown error');
            return [];
        }
    }
    async scrapeReddit(query) {
        try {
            const subreddits = ['coupons', 'deals', 'DiscountedProducts'];
            const allCoupons = [];
            for (const subreddit of subreddits) {
                try {
                    const response = await axios_1.default.get(`https://old.reddit.com/r/${subreddit}/search.json`, {
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
                        .map((p) => {
                        const title = p.data?.title || '';
                        const codeMatch = title.match(/code\s*:?\s*([A-Z0-9]{4,15})/i) ||
                            title.match(/\[([A-Z0-9]{4,15})\]/) ||
                            title.match(/use\s+([A-Z0-9]{4,15})/i) ||
                            title.match(/promo\s*:?\s*([A-Z0-9]{4,15})/i) ||
                            title.match(/coupon\s*:?\s*([A-Z0-9]{4,15})/i);
                        if (codeMatch) {
                            const discountMatch = title.match(/(\d+)%\s*off/i);
                            const discount = discountMatch ? `${discountMatch[1]}% off` : undefined;
                            return {
                                code: codeMatch[1].toUpperCase(),
                                description: title.substring(0, 100),
                                discount,
                                source: 'Reddit',
                                successRate: p.data.score > 10 ? 75 : p.data.score > 5 ? 60 : 50
                            };
                        }
                        return null;
                    })
                        .filter((c) => c !== null);
                    allCoupons.push(...coupons);
                    if (allCoupons.length >= 5)
                        break;
                }
                catch (subError) {
                    console.warn(`⚠️ Reddit fetch failed for r/${subreddit}:`, subError instanceof Error ? subError.message : 'Unknown error');
                    continue;
                }
            }
            const uniqueCoupons = Array.from(new Map(allCoupons.map(c => [c.code, c])).values());
            return uniqueCoupons.slice(0, 5);
        }
        catch (error) {
            console.warn('❌ Reddit scrape failed:', error instanceof Error ? error.message : 'Unknown error');
            return [];
        }
    }
    async getStackableCoupons(store, title) {
        console.log(`🎟️ getStackableCoupons called for ${store} - ${title}`);
        return [];
    }
    async validateCoupon(coupon, productUrl) {
        console.log(`🔍 validateCoupon called for ${coupon.code}`);
        return { isValid: true };
    }
}
exports.FreeCouponService = FreeCouponService;
exports.default = new FreeCouponService();
//# sourceMappingURL=freeCouponService.js.map