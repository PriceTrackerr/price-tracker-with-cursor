"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const database_1 = require("../config/database");
const productMatchingService_1 = require("../services/productMatchingService");
const router = express_1.default.Router();
router.post('/find-matches', [
    (0, express_validator_1.body)('productId').isString().notEmpty().withMessage('Product ID is required'),
    (0, express_validator_1.body)('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1 and 20')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        const { productId, limit = 10 } = req.body;
        const db = (0, database_1.getDb)();
        const sourceProduct = await db.getProductById(productId);
        if (!sourceProduct) {
            return res.status(404).json({
                success: false,
                message: 'Source product not found'
            });
        }
        console.log(`🔍 Finding matches for product: ${sourceProduct.title}`);
        const allProducts = await db.getProducts();
        const candidateProducts = allProducts.filter((p) => p.id !== sourceProduct.id);
        const matches = (0, productMatchingService_1.matchProducts)(sourceProduct, candidateProducts);
        res.json({
            success: true,
            data: {
                sourceProduct: {
                    id: sourceProduct.id,
                    title: sourceProduct.title,
                    price: sourceProduct.price,
                    currency: sourceProduct.currency,
                    platform: sourceProduct.platform,
                    imageUrl: sourceProduct.imageUrl,
                    url: sourceProduct.url
                },
                matches: matches.map((match) => ({
                    product: {
                        id: match.product.id,
                        title: match.product.title,
                        price: match.product.price,
                        currency: match.product.currency || 'USD',
                        platform: match.product.platform,
                        imageUrl: match.product.imageUrl || '',
                        url: match.product.url || '',
                        stockStatus: match.product.stockStatus || 'unknown'
                    },
                    confidence: match.confidence,
                    similarity: match.similarity,
                    matchReason: match.matchReason,
                    priceDifference: match.priceDifference,
                    priceDifferencePercent: match.priceDifferencePercent,
                    savings: match.savings
                })),
                totalMatches: matches.length,
                bestMatch: matches.length > 0 ? {
                    product: {
                        id: matches[0].product.id,
                        title: matches[0].product.title,
                        price: matches[0].product.price,
                        currency: matches[0].product.currency || 'USD',
                        platform: matches[0].product.platform,
                        imageUrl: matches[0].product.imageUrl || '',
                        url: matches[0].product.url || ''
                    },
                    confidence: matches[0].score,
                    priceDifference: matches[0].priceDifference
                } : null
            }
        });
    }
    catch (error) {
        console.error('Product matching error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to find product matches',
            error: error.message
        });
    }
});
router.post('/find-matches-by-url', [
    (0, express_validator_1.body)('url').isURL().withMessage('Valid URL is required'),
    (0, express_validator_1.body)('title').optional().isString().withMessage('Title must be a string'),
    (0, express_validator_1.body)('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    (0, express_validator_1.body)('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1 and 20')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        const { url, title, price, limit = 10 } = req.body;
        const db = (0, database_1.getDb)();
        const tempProduct = {
            id: `temp_${Date.now()}`,
            url,
            title: title || 'Product',
            price: price || 0,
            currency: 'USD',
            platform: 'unknown',
            imageUrl: '',
            description: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            userId: 'system'
        };
        console.log(`🔍 Finding matches for URL: ${url}`);
        const allProducts = await db.getProducts();
        const candidateProducts = allProducts;
        const matches = (0, productMatchingService_1.matchProducts)(tempProduct, candidateProducts);
        res.json({
            success: true,
            data: {
                sourceUrl: url,
                sourceTitle: title,
                sourcePrice: price,
                matches: matches.map((match) => ({
                    product: {
                        id: match.product.id,
                        title: match.product.title,
                        price: match.product.price,
                        currency: match.product.currency || 'USD',
                        platform: match.product.platform,
                        imageUrl: match.product.imageUrl || '',
                        url: match.product.url || '',
                        stockStatus: match.product.stockStatus || 'unknown'
                    },
                    confidence: match.confidence,
                    similarity: match.similarity,
                    matchReason: match.matchReason,
                    priceDifference: match.priceDifference,
                    priceDifferencePercent: match.priceDifferencePercent,
                    savings: match.savings
                })),
                totalMatches: matches.length,
                bestMatch: matches.length > 0 ? {
                    product: {
                        id: matches[0].product.id,
                        title: matches[0].product.title,
                        price: matches[0].product.price,
                        currency: matches[0].product.currency || 'USD',
                        platform: matches[0].product.platform,
                        imageUrl: matches[0].product.imageUrl || '',
                        url: matches[0].product.url || ''
                    },
                    confidence: matches[0].score,
                    priceDifference: matches[0].priceDifference
                } : null
            }
        });
    }
    catch (error) {
        console.error('URL-based matching error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to find product matches',
            error: error.message
        });
    }
});
router.get('/stats', async (req, res) => {
    try {
        const db = (0, database_1.getDb)();
        const allProducts = await db.getProducts();
        let totalMatches = 0;
        let productsWithMatches = 0;
        const platformStats = {};
        for (const product of allProducts) {
            if (product.totalMatches && product.totalMatches > 0) {
                totalMatches += product.totalMatches;
                productsWithMatches++;
            }
        }
        res.json({
            success: true,
            data: {
                totalMatches,
                averageConfidence: 0.75,
                matchDistribution: platformStats,
                recentMatches: [],
                totalProducts: allProducts.length,
                productsWithMatches
            }
        });
    }
    catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get matching statistics',
            error: error.message
        });
    }
});
router.post('/test', async (req, res) => {
    try {
        const db = (0, database_1.getDb)();
        const sampleProduct = {
            id: 'test_product',
            url: 'https://amazon.com/test-product',
            title: 'Gold Plated Cross Necklace Layered Small Side Pendant',
            price: 189.99,
            currency: 'USD',
            platform: 'amazon',
            imageUrl: 'https://example.com/image.jpg',
            description: 'Cross Necklace Necklace Daint Necklace Elega Gift for Women',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            userId: 'system'
        };
        console.log(`🧪 Testing product matching with: ${sampleProduct.title}`);
        const allProducts = await db.getProducts();
        const matches = (0, productMatchingService_1.matchProducts)(sampleProduct, allProducts);
        res.json({
            success: true,
            data: {
                testProduct: sampleProduct,
                matches: matches.map((match) => ({
                    product: {
                        id: match.product.id,
                        title: match.product.title,
                        price: match.product.price,
                        platform: match.product.platform,
                        url: match.product.url || ''
                    },
                    confidence: match.confidence,
                    similarity: match.similarity,
                    matchReason: match.matchReason,
                    priceDifference: match.priceDifference,
                    priceDifferencePercent: match.priceDifferencePercent
                })),
                totalMatches: matches.length
            }
        });
    }
    catch (error) {
        console.error('Test matching error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to test product matching',
            error: error.message
        });
    }
});
exports.default = router;
//# sourceMappingURL=productMatching.js.map