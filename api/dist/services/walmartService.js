"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalmartService = void 0;
const axios_1 = __importDefault(require("axios"));
class WalmartService {
    constructor() {
        this.apiKey = process.env.WALMART_API_KEY;
    }
    async searchProducts(query, limit = 10) {
        if (!this.apiKey)
            return [];
        try {
            const url = `https://api.walmartlabs.com/v1/search?query=${encodeURIComponent(query)}&apiKey=${this.apiKey}&numItems=${limit}`;
            const { data } = await axios_1.default.get(url, { timeout: 12000 });
            const items = Array.isArray(data?.items) ? data.items : [];
            const now = new Date().toISOString();
            return items.map((i) => ({
                id: String(i.itemId),
                url: i.productUrl,
                title: i.name,
                price: Number(i.salePrice ?? i.msrp ?? 0),
                currency: 'USD',
                platform: 'walmart',
                imageUrl: i.mediumImage || i.thumbnailImage || '',
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
exports.WalmartService = WalmartService;
exports.default = WalmartService;
//# sourceMappingURL=walmartService.js.map