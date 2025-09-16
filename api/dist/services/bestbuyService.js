"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BestBuyService = void 0;
const axios_1 = __importDefault(require("axios"));
class BestBuyService {
    constructor() {
        this.apiKey = process.env.BESTBUY_API_KEY;
    }
    async searchProducts(query, limit = 10) {
        if (!this.apiKey)
            return [];
        try {
            const q = encodeURIComponent(query);
            const url = `https://api.bestbuy.com/v1/products((search=${q}))?apiKey=${this.apiKey}&format=json&pageSize=${limit}`;
            const { data } = await axios_1.default.get(url, { timeout: 12000 });
            const items = Array.isArray(data?.products) ? data.products : [];
            const now = new Date().toISOString();
            return items.map((p) => ({
                id: String(p.sku),
                url: p.url,
                title: p.name,
                price: Number(p.salePrice ?? p.regularPrice ?? 0),
                currency: 'USD',
                platform: 'bestbuy',
                imageUrl: p.image,
                createdAt: now,
                updatedAt: now,
                userId: 'system'
            }));
        }
        catch (error) {
            return [];
        }
    }
}
exports.BestBuyService = BestBuyService;
exports.default = BestBuyService;
//# sourceMappingURL=bestbuyService.js.map