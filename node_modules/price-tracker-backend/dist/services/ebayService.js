"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EbayService = void 0;
const axios_1 = __importDefault(require("axios"));
class EbayService {
    constructor() {
        this.baseUrl = 'https://api.ebay.com';
        this.clientId = process.env.EBAY_CLIENT_ID || '';
        this.clientSecret = process.env.EBAY_CLIENT_SECRET || '';
    }
    async getAccessToken() {
        if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
            return this.accessToken;
        }
        const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/identity/v1/oauth2/token`, 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope', {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${auth}`
                }
            });
            this.accessToken = response.data.access_token;
            this.tokenExpiry = new Date(Date.now() + (response.data.expires_in * 1000));
            return this.accessToken;
        }
        catch (error) {
            console.error('Failed to get eBay access token:', error);
            throw new Error('eBay authentication failed');
        }
    }
    async searchProducts(query, limit = 10) {
        try {
            const token = await this.getAccessToken();
            const response = await axios_1.default.get(`${this.baseUrl}/buy/browse/v1/item_summary/search`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
                },
                params: {
                    q: query,
                    limit: limit,
                    filter: 'buyingOptions:{FIXED_PRICE}',
                    sort: 'price'
                }
            });
            return response.data.itemSummaries?.map(this.mapToEbayProduct) || [];
        }
        catch (error) {
            console.error('eBay search failed:', error);
            return [];
        }
    }
    async searchProductsInMarketplace(query, marketplaceId, limit = 10) {
        try {
            const token = await this.getAccessToken();
            const response = await axios_1.default.get(`${this.baseUrl}/buy/browse/v1/item_summary/search`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-EBAY-C-MARKETPLACE-ID': marketplaceId
                },
                params: {
                    q: query,
                    limit,
                    filter: 'buyingOptions:{FIXED_PRICE}',
                    sort: 'price'
                }
            });
            return response.data.itemSummaries?.map(this.mapToEbayProduct) || [];
        }
        catch (error) {
            console.error(`eBay search failed for ${marketplaceId}:`, error);
            return [];
        }
    }
    async getProductDetails(itemId) {
        try {
            const token = await this.getAccessToken();
            const response = await axios_1.default.get(`${this.baseUrl}/buy/browse/v1/item/${itemId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
                }
            });
            return this.mapToEbayProduct(response.data);
        }
        catch (error) {
            console.error('Failed to get eBay product details:', error);
            return null;
        }
    }
    async getConditionAnalysis(itemId) {
        try {
            const product = await this.getProductDetails(itemId);
            if (!product)
                return null;
            const conditionScore = this.calculateConditionScore(product);
            const sellerTrustScore = this.calculateSellerTrustScore(product);
            const riskLevel = this.calculateRiskLevel(conditionScore, sellerTrustScore);
            return {
                condition: product.condition,
                conditionScore,
                sellerTrustScore,
                riskLevel,
                returnPolicy: product.returnPolicy
            };
        }
        catch (error) {
            console.error('Failed to analyze eBay condition:', error);
            return null;
        }
    }
    calculateConditionScore(product) {
        let score = 50;
        const conditionScores = {
            'New': 95,
            'New with tags': 95,
            'New without tags': 90,
            'New with defects': 75,
            'Manufacturer refurbished': 85,
            'Seller refurbished': 75,
            'Used': 60,
            'Very Good': 80,
            'Good': 65,
            'Acceptable': 45,
            'For parts or not working': 10
        };
        score = conditionScores[product.condition] || score;
        if (product.conditionDescription) {
            const desc = product.conditionDescription.toLowerCase();
            if (desc.includes('like new'))
                score += 10;
            if (desc.includes('minor'))
                score -= 5;
            if (desc.includes('significant') || desc.includes('major'))
                score -= 15;
            if (desc.includes('damage'))
                score -= 20;
        }
        return Math.max(0, Math.min(100, score));
    }
    calculateSellerTrustScore(product) {
        let score = 50;
        if (product.seller.feedbackPercentage >= 99.5)
            score += 25;
        else if (product.seller.feedbackPercentage >= 98)
            score += 15;
        else if (product.seller.feedbackPercentage >= 95)
            score += 5;
        else if (product.seller.feedbackPercentage < 90)
            score -= 30;
        if (product.seller.feedbackScore >= 10000)
            score += 15;
        else if (product.seller.feedbackScore >= 1000)
            score += 10;
        else if (product.seller.feedbackScore >= 100)
            score += 5;
        else if (product.seller.feedbackScore < 10)
            score -= 20;
        return Math.max(0, Math.min(100, score));
    }
    calculateRiskLevel(conditionScore, sellerScore) {
        const averageScore = (conditionScore + sellerScore) / 2;
        if (averageScore >= 80)
            return 'low';
        if (averageScore >= 60)
            return 'medium';
        return 'high';
    }
    mapToEbayProduct(item) {
        return {
            itemId: item.itemId,
            title: item.title,
            price: parseFloat(item.price?.value || '0'),
            currency: item.price?.currency || 'USD',
            condition: item.condition || 'Unknown',
            conditionDescription: item.conditionDescription,
            seller: {
                username: item.seller?.username || '',
                feedbackPercentage: parseFloat(item.seller?.feedbackPercentage || '0'),
                feedbackScore: parseInt(item.seller?.feedbackScore || '0')
            },
            shipping: {
                cost: parseFloat(item.shippingOptions?.[0]?.shippingCost?.value || '0'),
                type: item.shippingOptions?.[0]?.shippingCostType || 'FIXED'
            },
            location: {
                country: item.itemLocation?.country || 'US',
                postalCode: item.itemLocation?.postalCode
            },
            returnPolicy: item.returnTerms ? {
                returnsAccepted: item.returnTerms.returnsAccepted,
                returnPeriod: item.returnTerms.returnPeriod?.value + ' ' + item.returnTerms.returnPeriod?.unit
            } : undefined
        };
    }
    async getUsedAlternatives(productTitle) {
        try {
            const token = await this.getAccessToken();
            const response = await axios_1.default.get(`${this.baseUrl}/buy/browse/v1/item_summary/search`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US'
                },
                params: {
                    q: productTitle,
                    limit: 20,
                    filter: 'conditions:{USED|MANUFACTURER_REFURBISHED|SELLER_REFURBISHED}',
                    sort: 'price'
                }
            });
            return response.data.itemSummaries?.map(this.mapToEbayProduct) || [];
        }
        catch (error) {
            console.error('Failed to get eBay used alternatives:', error);
            return [];
        }
    }
}
exports.EbayService = EbayService;
exports.default = EbayService;
//# sourceMappingURL=ebayService.js.map