"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const database_1 = require("../config/database");
const supabase_1 = require("../config/supabase");
const hybridScraper_1 = require("../utils/hybridScraper");
const productMatchingService_1 = require("../services/productMatchingService");
const router = express_1.default.Router();
const STOP_WORDS = new Set([
    'new',
    'brand-new',
    'sealed',
    'refurbished',
    'renewed',
    'usb-c',
    'usbc',
    'lightning',
    'with',
    'case',
    'official',
    'genuine',
    'free',
    'shipping',
    'limited',
    'edition',
    'colors',
    'colour',
    'color',
    'bundle',
    'pack',
    'promo',
    'deal',
    'offer',
    '2024',
    '2025',
    'brand',
    'storage',
    'sizes',
    'size',
    'set'
]);
function generateProductKey(title) {
    if (!title)
        return '';
    let normalized = title.toLowerCase();
    normalized = normalized.replace(/[^a-z0-9\s-]/g, ' ');
    normalized = normalized.replace(/\b(\d+)(gb|tb|g|m|mb)\b/g, ' ');
    normalized = normalized.replace(/\b(64|128|256|512)\s?(gb)\b/g, ' ');
    normalized = normalized.replace(/\b\d{4}\b/g, (year) => (year === '2024' || year === '2025' ? ' ' : year));
    const tokens = normalized
        .split(/\s+/)
        .filter(Boolean)
        .filter(token => !STOP_WORDS.has(token));
    return tokens.join(' ').trim();
}
router.get('/global-product-matches', async (req, res) => {
    const trackedId = (req.query.tracked_id || req.query.trackedId);
    if (!trackedId) {
        return res.status(400).json({ success: false, error: 'tracked_id query param is required' });
    }
    if (!supabase_1.supabase) {
        console.error('❌ Supabase client not configured');
        return res.status(500).json({ success: false, error: 'Server configuration error' });
    }
    try {
        console.log(`🔍 Global match lookup for tracked_id=${trackedId}`);
        const { data: trackedProduct, error: trackedError } = await supabase_1.supabase
            .from(supabase_1.TABLES.PRODUCTS || 'products')
            .select('title')
            .eq('id', trackedId)
            .maybeSingle();
        if (trackedError) {
            console.error('❌ Products lookup failed:', trackedError);
            return res.status(500).json({ success: false, error: 'Failed to load tracked product' });
        }
        if (!trackedProduct) {
            return res.status(404).json({ success: false, error: 'Tracked product not found' });
        }
        const rawTitle = trackedProduct.title || '';
        if (!rawTitle.trim()) {
            return res.status(400).json({ success: false, error: 'Tracked product has no title' });
        }
        const productKey = generateProductKey(rawTitle);
        if (!productKey) {
            return res.status(400).json({ success: false, error: 'Unable to derive product key from title' });
        }
        const { data: cached, error: cacheError } = await supabase_1.supabase
            .from('global_product_matches')
            .select('matches, match_count')
            .eq('product_key', productKey)
            .maybeSingle();
        if (cacheError && cacheError.code !== 'PGRST116') {
            console.error('❌ Cache lookup failed:', cacheError);
            return res.status(500).json({ success: false, error: 'Failed to read cache' });
        }
        if (cached) {
            console.log(`✅ Global cache hit for key=${productKey}`);
            return res.json({
                success: true,
                data: {
                    matches: cached.matches || [],
                    count: cached.match_count || 0,
                    cached: true
                }
            });
        }
        console.log(`🌐 Cache miss for key=${productKey}, invoking hybrid search...`);
        const normalizedQuery = generateProductKey(rawTitle) || rawTitle;
        const perStoreResults = await Promise.all(hybridScraper_1.SUPPORTED_STORES.map(store => (0, hybridScraper_1.scrapeWithHybrid)(normalizedQuery, store, 3)));
        const matches = perStoreResults
            .flatMap((items, storeIndex) => items.map((item, idx) => ({
            id: item.id || `global_match_${hybridScraper_1.SUPPORTED_STORES[storeIndex]}_${Date.now()}_${idx}`,
            title: item.title || rawTitle,
            price: item.price || 0,
            currency: item.currency || 'USD',
            platform: item.platform || hybridScraper_1.SUPPORTED_STORES[storeIndex],
            imageUrl: item.imageUrl || '',
            url: item.url || ''
        })))
            .filter(Boolean)
            .slice(0, 21);
        if (!matches.length) {
            console.warn(`⚠️ No external matches for key=${productKey}`);
            return res.json({ success: false, matches: [], message: 'No matches found right now' });
        }
        const matchCount = matches.length;
        const { error: upsertError } = await supabase_1.supabase
            .from('global_product_matches')
            .upsert({
            product_key: productKey,
            matches,
            match_count: matchCount
        }, { onConflict: 'product_key' });
        if (upsertError) {
            console.error('❌ Cache upsert failed:', upsertError);
            return res.status(500).json({ success: false, error: 'Unable to cache matches' });
        }
        const primaryProvider = matches[0]?.platform || 'unknown';
        console.log(`✅ Stored ${matchCount} matches for key=${productKey} from provider ${primaryProvider}`);
        return res.json({
            success: true,
            data: {
                matches,
                count: matchCount,
                cached: false
            }
        });
    }
    catch (error) {
        console.error('❌ Global product matches error:', error);
        const message = error?.message || 'Unexpected error';
        return res.status(500).json({ success: false, error: message });
    }
});
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