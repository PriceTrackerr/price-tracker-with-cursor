"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AliExpressService = void 0;
const https_1 = __importDefault(require("https"));
class AliExpressService {
    constructor() {
        this.host = 'free-aliexpress-api.p.rapidapi.com';
        this.apiKey = process.env.RAPIDAPI_KEY;
    }
    request(path) {
        return new Promise((resolve, reject) => {
            const req = https_1.default.request({
                method: 'GET',
                hostname: this.host,
                path,
                headers: {
                    'x-rapidapi-key': this.apiKey || '',
                    'x-rapidapi-host': this.host
                }
            }, res => {
                const chunks = [];
                res.on('data', c => chunks.push(c));
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(Buffer.concat(chunks).toString()));
                    }
                    catch (e) {
                        reject(e);
                    }
                });
            });
            req.on('error', reject);
            req.end();
        });
    }
    async searchProducts(query, page = 1, limit = 10) {
        if (!this.apiKey)
            return [];
        try {
            const q = encodeURIComponent(query);
            const data = await this.request(`/search?query=${q}&target_currency=USD&target_language=EN&page=${page}`);
            const items = Array.isArray(data?.data) ? data.data.slice(0, limit) : [];
            const now = new Date().toISOString();
            return items.map((i) => ({
                id: String(i.product_id || i.id),
                url: i.product_detail_url || i.url,
                title: i.product_title || i.title || '',
                price: Number(i.product_price || i.price || 0),
                currency: 'USD',
                platform: 'aliexpress',
                imageUrl: i.product_main_image_url || i.image || '',
                createdAt: now,
                updatedAt: now,
                userId: 'system'
            }));
        }
        catch (e) {
            return [];
        }
    }
}
exports.AliExpressService = AliExpressService;
exports.default = AliExpressService;
//# sourceMappingURL=aliExpressService.js.map