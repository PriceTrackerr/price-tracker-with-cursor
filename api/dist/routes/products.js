"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const database_1 = require("../config/database");
const db = (0, database_1.getDb)();
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const validateProduct = [
    (0, express_validator_1.body)('url').isURL().withMessage('Valid URL is required'),
    (0, express_validator_1.body)('title').notEmpty().withMessage('Product title is required'),
    (0, express_validator_1.body)('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
    (0, express_validator_1.body)('platform').isIn(['amazon', 'aliexpress', 'ebay', 'walmart', 'shein', 'bestbuy', 'target']).withMessage('Valid platform is required')
];
function addAffiliateTag(url, platform) {
    try {
        const u = new URL(url);
        if (platform === 'amazon') {
            u.searchParams.set('tag', 'pricetrack0f8-20');
            return u.toString();
        }
        else if (platform === 'aliexpress') {
            u.searchParams.set('aff_platform', 'link-c-tool');
            u.searchParams.set('aff_short_key', 'pricetrack0f8-20');
            return u.toString();
        }
        else if (platform === 'bestbuy') {
            u.searchParams.set('campid', 'your-bestbuy-campaign-id');
            return u.toString();
        }
        else if (platform === 'target') {
            u.searchParams.set('affiliate', 'your-target-affiliate-id');
            return u.toString();
        }
        return url;
    }
    catch {
        return url;
    }
}
router.get('/search', auth_1.authMiddleware, async (req, res) => {
    try {
        const { q, limit = 10 } = req.query;
        const userId = req.user.uid;
        if (!q || typeof q !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'Search query is required'
            });
        }
        const allProducts = await db.getProducts();
        const userProducts = allProducts.filter((p) => p.userId === userId);
        const query = q.toLowerCase().trim();
        const startsWithMatches = userProducts.filter((product) => product.title.toLowerCase().startsWith(query) ||
            product.platform.toLowerCase().startsWith(query));
        const containsMatches = userProducts.filter((product) => product.title.toLowerCase().includes(query) ||
            product.platform.toLowerCase().includes(query));
        const allMatches = [...startsWithMatches, ...containsMatches];
        const uniqueMatches = allMatches.filter((product, index, self) => index === self.findIndex(p => p.id === product.id));
        const limitedMatches = uniqueMatches.slice(0, parseInt(limit));
        return res.json({
            success: true,
            data: {
                query,
                results: limitedMatches,
                total: limitedMatches.length,
                hasMore: uniqueMatches.length > limitedMatches.length
            }
        });
    }
    catch (error) {
        console.error('Error searching products:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.post('/track', auth_1.authMiddleware, validateProduct, async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        const { url, title, price, currency, platform, imageUrl, stockStatus, discountInfo } = req.body;
        const userId = req.user.uid;
        const products = await db.getProducts(userId);
        console.log(`[DEBUG] Checking for duplicates - User: ${userId}, URL: ${url}`);
        console.log(`[DEBUG] User has ${products.length} products`);
        const existing = products.find((p) => p.url === url);
        if (existing) {
            console.log(`[DEBUG] Found existing product: ${existing.title}`);
            return res.status(409).json({
                success: false,
                error: 'Product already tracked'
            });
        }
        console.log(`[DEBUG] No existing product found, proceeding to add new product`);
        const id = await db.addProduct({
            url,
            title,
            price: typeof price === 'string' ? parseFloat(price) : price,
            currency: currency || '$',
            platform,
            imageUrl: imageUrl || '',
            userId,
            stockStatus: stockStatus || 'unknown',
            discountInfo,
            totalMatches: 0
        });
        await db.addPriceHistory({
            productId: id,
            price: typeof price === 'string' ? parseFloat(price) : price,
            currency: currency || '$'
        });
        const allProducts = await db.getProducts();
        const newProduct = allProducts.find((p) => p.id === id);
        if (newProduct) {
            console.log(`[PRODUCT MATCHING] Looking for matches for: ${newProduct.title}`);
            const { matchProducts } = require('../services/productMatchingService');
            const candidateProducts = allProducts.filter((p) => p.id !== id);
            const matches = matchProducts(newProduct, candidateProducts);
            const matchedProductIds = matches.map((match) => match.id);
            console.log(`[PRODUCT MATCHING] Found ${matches.length} matches:`);
            matches.forEach((match) => {
                console.log(`  - ${match.title} (${match.platform}) - Confidence: ${match.confidence.toFixed(2)}`);
            });
            await db.updateProduct(id, {
                matchedProducts: matchedProductIds,
                totalMatches: matches.length
            });
            for (const match of matches) {
                const existingProduct = allProducts.find((p) => p.id === match.product.id);
                if (existingProduct) {
                    const currentMatches = existingProduct.matchedProducts || [];
                    if (!currentMatches.includes(id)) {
                        currentMatches.push(id);
                        await db.updateProduct(match.product.id, {
                            matchedProducts: currentMatches,
                            totalMatches: currentMatches.length
                        });
                    }
                }
            }
            console.log(`[PRODUCT MATCHING] Updated ${matches.length} products with new matches`);
        }
        return res.status(201).json({
            success: true,
            data: {
                id,
                url,
                title,
                price,
                currency,
                platform,
                imageUrl,
                userId,
                stockStatus: stockStatus || 'unknown',
                discountInfo
            }
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return res.status(500).json({
            success: false,
            error: message
        });
    }
});
router.get('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.uid;
        let products = await db.getProducts(userId);
        const user = await db.getUserById(userId);
        const seenPriceDropIds = user?.seenPriceDropIds || [];
        const { search, platform, minPrice, maxPrice, stockStatus, hasPriceDrop, sortBy = 'createdAt', sortOrder = 'desc', limit, offset = 0 } = req.query;
        let productsWithHistory = await Promise.all(products.map(async (product) => {
            const history = await db.getPriceHistory(product.id);
            const priceHistory = history || [];
            let priceDrop = 0;
            let priceDropPercent = 0;
            let previousPrice = product.price;
            let hasPriceDrop = false;
            if (priceHistory.length > 1) {
                const previousEntry = priceHistory[priceHistory.length - 2];
                if (previousEntry && previousEntry.price && previousEntry.price > product.price) {
                    priceDrop = previousEntry.price - product.price;
                    priceDropPercent = Math.round((priceDrop / previousEntry.price) * 100);
                    previousPrice = previousEntry.price;
                    hasPriceDrop = priceDrop > 0 && !seenPriceDropIds.includes(product.id);
                }
            }
            return {
                ...product,
                url: addAffiliateTag(product.url, product.platform),
                priceHistory,
                priceDrop,
                priceDropPercent,
                previousPrice,
                hasPriceDrop
            };
        }));
        if (search && typeof search === 'string') {
            const searchLower = search.toLowerCase();
            productsWithHistory = productsWithHistory.filter(product => product.title.toLowerCase().includes(searchLower) ||
                product.platform.toLowerCase().includes(searchLower));
        }
        if (platform && typeof platform === 'string') {
            productsWithHistory = productsWithHistory.filter(product => product.platform === platform);
        }
        if (minPrice && typeof minPrice === 'string') {
            const min = parseFloat(minPrice);
            if (!isNaN(min)) {
                productsWithHistory = productsWithHistory.filter(product => product.price >= min);
            }
        }
        if (maxPrice && typeof maxPrice === 'string') {
            const max = parseFloat(maxPrice);
            if (!isNaN(max)) {
                productsWithHistory = productsWithHistory.filter(product => product.price <= max);
            }
        }
        if (stockStatus && typeof stockStatus === 'string') {
            productsWithHistory = productsWithHistory.filter(product => product.stockStatus === stockStatus);
        }
        if (hasPriceDrop === 'true') {
            productsWithHistory = productsWithHistory.filter(product => product.hasPriceDrop);
        }
        const sortOrderMultiplier = sortOrder === 'desc' ? -1 : 1;
        productsWithHistory.sort((a, b) => {
            let aValue;
            let bValue;
            switch (sortBy) {
                case 'price':
                    aValue = a.price;
                    bValue = b.price;
                    break;
                case 'priceDrop':
                    aValue = a.priceDrop;
                    bValue = b.priceDrop;
                    break;
                case 'priceDropPercent':
                    aValue = a.priceDropPercent;
                    bValue = b.priceDropPercent;
                    break;
                case 'title':
                    aValue = a.title.toLowerCase();
                    bValue = b.title.toLowerCase();
                    break;
                case 'platform':
                    aValue = a.platform.toLowerCase();
                    bValue = b.platform.toLowerCase();
                    break;
                case 'createdAt':
                default:
                    aValue = new Date(a.createdAt).getTime();
                    bValue = new Date(b.createdAt).getTime();
                    break;
            }
            if (aValue < bValue)
                return -1 * sortOrderMultiplier;
            if (aValue > bValue)
                return 1 * sortOrderMultiplier;
            return 0;
        });
        const totalCount = productsWithHistory.length;
        const offsetNum = parseInt(offset) || 0;
        const limitNum = limit ? parseInt(limit) : totalCount;
        const paginatedProducts = productsWithHistory.slice(offsetNum, offsetNum + limitNum);
        const totalValue = productsWithHistory.reduce((sum, product) => sum + product.price, 0);
        const totalSavings = productsWithHistory.reduce((sum, product) => sum + product.priceDrop, 0);
        const productsWithPriceDrops = productsWithHistory.filter(product => product.hasPriceDrop).length;
        const outOfStockCount = productsWithHistory.filter(product => product.stockStatus === 'out_of_stock').length;
        return res.json({
            success: true,
            data: paginatedProducts,
            pagination: {
                total: totalCount,
                offset: offsetNum,
                limit: limitNum,
                hasMore: offsetNum + limitNum < totalCount
            },
            summary: {
                totalProducts: totalCount,
                totalValue: totalValue.toFixed(2),
                totalSavings: totalSavings.toFixed(2),
                productsWithPriceDrops,
                outOfStockCount
            }
        });
    }
    catch (error) {
        console.error('Error fetching products:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.delete('/:productId', auth_1.authMiddleware, async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user.uid;
        if (!productId) {
            return res.status(400).json({
                success: false,
                error: 'Product ID is required'
            });
        }
        const product = await db.getProductById(productId);
        const user = await db.getUserById(userId);
        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }
        if (!user || (user.role !== 'admin' && product.userId !== userId)) {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }
        await db.deleteProduct(productId);
        return res.json({ success: true, message: 'Product removed from tracking' });
    }
    catch (error) {
        console.error('Error removing product:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.get('/:productId/history', auth_1.authMiddleware, async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user.uid;
        if (!productId) {
            return res.status(400).json({
                success: false,
                error: 'Product ID is required'
            });
        }
        const product = await db.getProductById(productId);
        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }
        if (product.userId !== userId) {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }
        const history = await db.getPriceHistory(productId);
        return res.json({ success: true, data: history });
    }
    catch (error) {
        console.error('Error fetching price history:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.get('/filters', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.uid;
        const products = await db.getProducts(userId);
        const user = await db.getUserById(userId);
        const seenPriceDropIds = user?.seenPriceDropIds || [];
        const prices = products.map((p) => p.price).filter((p) => p > 0);
        const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
        const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
        const platforms = [...new Set(products.map((p) => p.platform))];
        const stockStatuses = products.reduce((acc, product) => {
            const status = product.stockStatus || 'unknown';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});
        const productsWithHistory = await Promise.all(products.map(async (product) => {
            const history = await db.getPriceHistory(product.id);
            if (history.length > 1) {
                const previousEntry = history[history.length - 2];
                if (previousEntry && previousEntry.price) {
                    const priceDrop = previousEntry.price - product.price;
                    const hasDrop = priceDrop > 0;
                    const isSeen = seenPriceDropIds.includes(product.id);
                    return {
                        priceDrop,
                        priceDropPercent: Math.round((priceDrop / previousEntry.price) * 100),
                        hasDrop,
                        isSeen
                    };
                }
            }
            return { priceDrop: 0, priceDropPercent: 0, hasDrop: false, isSeen: false };
        }));
        const productsWithPriceDrops = productsWithHistory.filter(p => p.hasDrop && !p.isSeen).length;
        const maxPriceDrop = productsWithHistory.length > 0 ? Math.max(...productsWithHistory.map(p => p.priceDrop)) : 0;
        const maxPriceDropPercent = productsWithHistory.length > 0 ? Math.max(...productsWithHistory.map(p => p.priceDropPercent)) : 0;
        return res.json({
            success: true,
            data: {
                priceRange: { min: minPrice, max: maxPrice },
                platforms,
                stockStatuses,
                priceDropStats: {
                    productsWithPriceDrops,
                    maxPriceDrop: maxPriceDrop.toFixed(2),
                    maxPriceDropPercent
                },
                totalProducts: products.length
            }
        });
    }
    catch (error) {
        console.error('Error fetching filter options:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.get('/all', auth_1.authMiddleware, async (req, res) => {
    try {
        const user = await db.getUserById(req.user.uid);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });
        }
        const data = db.readData();
        const products = data.products || [];
        const users = data.users || [];
        const productsWithIds = products.map((p, i) => {
            const productUser = users.find(u => u.id === p.userId);
            return {
                ...p,
                id: p.id || `fallback_${i}`,
                user: productUser ? {
                    email: productUser.email,
                    name: productUser.name || productUser.username
                } : undefined
            };
        });
        return res.json({ success: true, data: productsWithIds });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: 'Failed to fetch all products' });
    }
});
router.get('/price-drops', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }
        const products = await db.getProducts(userId);
        const priceDropIds = [];
        for (const product of products) {
            const history = await db.getPriceHistory(product.id);
            if (history.length > 1) {
                const sortedHistory = history.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
                const last = sortedHistory[sortedHistory.length - 1];
                const prev = sortedHistory[sortedHistory.length - 2];
                if (last && prev && last.price < prev.price) {
                    priceDropIds.push(product.id);
                }
            }
        }
        return res.json({ success: true, data: priceDropIds });
    }
    catch (error) {
        console.error('Error fetching price drops:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch price drops' });
    }
});
router.post('/:productId/link/:targetProductId', auth_1.authMiddleware, async (req, res) => {
    try {
        const { productId, targetProductId } = req.params;
        const userId = req.user.uid;
        if (!productId || !targetProductId) {
            return res.status(400).json({
                success: false,
                error: 'Both product IDs are required'
            });
        }
        const allProducts = await db.getProducts();
        const product = allProducts.find((p) => p.id === productId);
        const targetProduct = allProducts.find((p) => p.id === targetProductId);
        if (!product || !targetProduct) {
            return res.status(404).json({
                success: false,
                error: 'One or both products not found'
            });
        }
        if (product.userId !== userId || targetProduct.userId !== userId) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to link these products'
            });
        }
        const productMatchedProducts = product.matchedProducts || [];
        const targetMatchedProducts = targetProduct.matchedProducts || [];
        if (!productMatchedProducts.includes(targetProductId)) {
            productMatchedProducts.push(targetProductId);
            await db.updateProduct(productId, { matchedProducts: productMatchedProducts });
        }
        if (!targetMatchedProducts.includes(productId)) {
            targetMatchedProducts.push(productId);
            await db.updateProduct(targetProductId, { matchedProducts: targetMatchedProducts });
        }
        return res.json({
            success: true,
            message: 'Products linked successfully'
        });
    }
    catch (error) {
        console.error('Error linking products:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.delete('/:productId/unlink/:targetProductId', auth_1.authMiddleware, async (req, res) => {
    try {
        const { productId, targetProductId } = req.params;
        const userId = req.user.uid;
        if (!productId || !targetProductId) {
            return res.status(400).json({
                success: false,
                error: 'Both product IDs are required'
            });
        }
        const allProducts = await db.getProducts();
        const product = allProducts.find((p) => p.id === productId);
        const targetProduct = allProducts.find((p) => p.id === targetProductId);
        if (!product || !targetProduct) {
            return res.status(404).json({
                success: false,
                error: 'One or both products not found'
            });
        }
        if (product.userId !== userId || targetProduct.userId !== userId) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized to unlink these products'
            });
        }
        const productMatchedProducts = product.matchedProducts || [];
        const targetMatchedProducts = targetProduct.matchedProducts || [];
        const updatedProductMatches = productMatchedProducts.filter((id) => id !== targetProductId);
        const updatedTargetMatches = targetMatchedProducts.filter((id) => id !== productId);
        await db.updateProduct(productId, { matchedProducts: updatedProductMatches });
        await db.updateProduct(targetProductId, { matchedProducts: updatedTargetMatches });
        return res.json({
            success: true,
            message: 'Products unlinked successfully'
        });
    }
    catch (error) {
        console.error('Error unlinking products:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.get('/export/csv', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.uid;
        const allProducts = await db.getProducts();
        const userProducts = allProducts.filter((p) => p.userId === userId);
        const csvHeader = 'ID,Title,Price,Currency,Platform,URL,Stock Status,Discount Info,Created At,Updated At\n';
        const csvRows = userProducts.map((product) => {
            return `"${product.id}","${product.title.replace(/"/g, '""')}","${product.price}","${product.currency}","${product.platform}","${product.url}","${product.stockStatus || ''}","${product.discountInfo || ''}","${product.createdAt}","${product.updatedAt}"`;
        }).join('\n');
        const csvContent = csvHeader + csvRows;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="products.csv"');
        return res.send(csvContent);
    }
    catch (error) {
        console.error('Error exporting CSV:', error);
        return res.status(500).json({ success: false, message: 'Failed to export CSV' });
    }
});
router.get('/export/json', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.uid;
        const allProducts = await db.getProducts();
        const userProducts = allProducts.filter((p) => p.userId === userId);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="products.json"');
        return res.json({
            success: true,
            data: {
                exportedAt: new Date().toISOString(),
                totalProducts: userProducts.length,
                products: userProducts
            }
        });
    }
    catch (error) {
        console.error('Error exporting JSON:', error);
        return res.status(500).json({ success: false, message: 'Failed to export JSON' });
    }
});
router.get('/api-key', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.uid;
        const apiKey = `pt_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        return res.json({
            success: true,
            data: {
                apiKey,
                userId,
                createdAt: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('Error generating API key:', error);
        return res.status(500).json({ success: false, message: 'Failed to generate API key' });
    }
});
router.get('/external/products', async (req, res) => {
    try {
        const apiKey = req.headers['x-api-key'];
        if (!apiKey) {
            return res.status(401).json({ success: false, message: 'API key required' });
        }
        const userId = apiKey.split('_')[1];
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Invalid API key' });
        }
        const allProducts = await db.getProducts();
        const userProducts = allProducts.filter((p) => p.userId === userId);
        return res.json({
            success: true,
            data: {
                products: userProducts,
                total: userProducts.length,
                exportedAt: new Date().toISOString()
            }
        });
    }
    catch (error) {
        console.error('Error accessing API:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
router.post('/debug/match', auth_1.authMiddleware, async (req, res) => {
    try {
        const { title1, title2 } = req.body;
        if (!title1 || !title2) {
            return res.status(400).json({
                success: false,
                error: 'Both title1 and title2 are required'
            });
        }
        const stringSimilarity = require('string-similarity');
        const titleSimilarity = stringSimilarity.compareTwoStrings(title1.toLowerCase(), title2.toLowerCase());
        const identifierSimilarity = titleSimilarity;
        const overallSimilarity = (titleSimilarity * 0.4 + identifierSimilarity * 0.4 + 0.2);
        return res.json({
            success: true,
            data: {
                title1,
                title2,
                titleSimilarity,
                identifierSimilarity,
                overallSimilarity,
                wouldMatch: overallSimilarity > 0.4
            }
        });
    }
    catch (error) {
        console.error('Debug match error:', error);
        return res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});
router.get('/:productId/predict', auth_1.authMiddleware, async (req, res) => {
    try {
        const { productId } = req.params;
        const history = await db.getPriceHistory(String(productId));
        const allProducts = await db.getProducts();
        const targetProduct = allProducts.find((p) => p.id === productId);
        if (!targetProduct) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        const { matchProducts } = require('../services/productMatchingService');
        const candidateProducts = allProducts.filter((p) => p.id !== productId);
        const alternatives = matchProducts(targetProduct, candidateProducts)
            .filter((m) => m.confidence > 0.5)
            .slice(0, 10);
        const targetPrice = targetProduct.price;
        const cheaperAlternatives = alternatives.filter((a) => a.price < targetPrice);
        const avgAlternativePrice = alternatives.length > 0
            ? alternatives.reduce((sum, a) => sum + a.price, 0) / alternatives.length
            : targetPrice;
        const pricePositioning = alternatives.length > 0
            ? Math.max(0, Math.min(1, (avgAlternativePrice - targetPrice) / Math.max(1, avgAlternativePrice)))
            : 0.5;
        let trendScore = 0.5;
        let volatility = 0;
        let reason = 'Limited price history';
        if (history && history.length >= 2) {
            const sorted = history.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            const n = sorted.length;
            if (n > 0) {
                let recentWeight = 0;
                let olderWeight = 0;
                let recentSum = 0;
                let olderSum = 0;
                const midPoint = Math.floor(n / 2);
                for (let i = 0; i < n; i++) {
                    const historyItem = sorted[i];
                    const price = Number(historyItem?.price || 0);
                    if (i >= midPoint) {
                        recentSum += price;
                        recentWeight++;
                    }
                    else {
                        olderSum += price;
                        olderWeight++;
                    }
                }
                const recentAvg = recentWeight > 0 ? recentSum / recentWeight : targetPrice;
                const olderAvg = olderWeight > 0 ? olderSum / olderWeight : targetPrice;
                const trend = recentAvg - olderAvg;
                trendScore = Math.max(-1, Math.min(1, trend / Math.max(1, olderAvg)));
                const avg = sorted.reduce((sum, p) => sum + Number(p.price || 0), 0) / n;
                const variance = sorted.reduce((acc, p) => acc + Math.pow((Number(p.price || 0) - avg), 2), 0) / n;
                volatility = Math.sqrt(variance) / Math.max(1, avg);
                if (Math.abs(trend) > 0.05) {
                    reason = trend > 0 ? 'Prices trending upward' : 'Prices trending downward';
                }
                else {
                    reason = 'Prices relatively stable';
                }
            }
        }
        let recommendation = 'buy';
        let confidence = 0.5;
        let finalReason = reason;
        if (pricePositioning < 0.2) {
            recommendation = 'wait';
            confidence = Math.min(0.9, 0.5 + (0.4 - pricePositioning) * 2);
            finalReason = `Overpriced compared to alternatives (${cheaperAlternatives.length} cheaper options available)`;
        }
        else if (pricePositioning > 0.8) {
            recommendation = 'buy';
            confidence = Math.min(0.9, 0.5 + (pricePositioning - 0.5) * 2);
            finalReason = `Good value compared to alternatives`;
        }
        if (Math.abs(trendScore) > 0.1) {
            if (trendScore > 0.1 && recommendation === 'buy') {
                confidence = Math.min(0.9, confidence + 0.2);
                finalReason += ' - Prices rising but still competitive';
            }
            else if (trendScore < -0.1 && recommendation === 'wait') {
                confidence = Math.min(0.9, confidence + 0.2);
                finalReason += ' - Prices falling, wait for better deals';
            }
        }
        if (volatility > 0.15 && recommendation === 'buy') {
            confidence = Math.max(0.3, confidence - 0.2);
            finalReason += ' - High price volatility suggests waiting';
        }
        if (targetProduct.hasPriceDrop && targetProduct.priceDrop) {
            const dropPercent = (targetProduct.priceDrop / (targetProduct.previousPrice || targetPrice)) * 100;
            if (dropPercent > 10) {
                recommendation = 'buy';
                confidence = Math.min(0.9, confidence + 0.2);
                finalReason = `Recent ${dropPercent.toFixed(1)}% price drop - good time to buy`;
            }
        }
        confidence = Math.max(0.1, Math.min(0.95, confidence));
        return res.json({
            success: true,
            data: {
                recommendation,
                confidence: Math.round(confidence * 100) / 100,
                reason: finalReason,
                details: {
                    pricePositioning,
                    trendScore,
                    volatility,
                    alternativesCount: alternatives.length,
                    cheaperAlternativesCount: cheaperAlternatives.length,
                    avgAlternativePrice: Math.round(avgAlternativePrice * 100) / 100
                }
            }
        });
    }
    catch (e) {
        return res.status(500).json({ success: false, message: 'Failed to predict price' });
    }
});
router.get('/:productId/alternatives', auth_1.authMiddleware, async (req, res) => {
    try {
        const { productId } = req.params;
        const allProducts = await db.getProducts();
        const target = allProducts.find((p) => p.id === productId);
        if (!target)
            return res.status(404).json({ success: false, message: 'Product not found' });
        const { matchProducts } = require('../services/productMatchingService');
        const candidateProducts = allProducts.filter((p) => p.id !== productId);
        const matches = matchProducts(target, candidateProducts);
        const alts = matches
            .filter((m) => m.price <= target.price || m.confidence > 0.6)
            .map((m) => {
            let reason = 'Similar product found';
            if (m.price < target.price) {
                reason = `Cheaper by $${(target.price - m.price).toFixed(2)}`;
            }
            return {
                product: {
                    id: m.id,
                    title: m.title,
                    price: m.price,
                    platform: m.platform,
                    url: m.url,
                    imageUrl: m.imageUrl
                },
                reason,
                similarity: m.confidence
            };
        })
            .slice(0, 10);
        return res.json({ success: true, data: { alternatives: alts } });
    }
    catch (e) {
        return res.status(500).json({ success: false, message: 'Failed to compute alternatives' });
    }
});
router.get('/:productId/bundle', auth_1.authMiddleware, async (req, res) => {
    try {
        const { productId } = req.params;
        const allProducts = await db.getProducts();
        const target = allProducts.find((p) => p.id === productId);
        if (!target)
            return res.status(404).json({ success: false, message: 'Product not found' });
        const estAccessoryValue = {
            'case': 10, 'charger': 20, 'cable': 7, 'earbuds': 20, 'headphones': 25, 'screen protector': 8,
            'protector': 8, 'mouse': 15, 'keyboard': 25, 'controller': 35, 'dock': 20, 'cover': 10, 'strap': 12,
            'adapter': 12, 'power bank': 25, 'sd card': 15, 'memory card': 15, 'stand': 12, 'tripod': 18
        };
        const targetBundleValue = 0;
        const { matchProducts } = require('../services/productMatchingService');
        const candidateProducts = allProducts.filter((p) => p.id !== productId);
        const matches = matchProducts(target, candidateProducts).slice(0, 20);
        const bundleComparisons = matches.map((m) => {
            const val = 0;
            const netValue = val - (m.price - target.price);
            return {
                product: {
                    id: m.id,
                    title: m.title,
                    price: m.price,
                    platform: m.platform,
                    url: m.url,
                    imageUrl: m.imageUrl
                },
                accessories: [],
                estimatedAccessoryValue: val,
                priceDifference: m.price - target.price,
                netValue
            };
        }).sort((a, b) => (b.netValue - a.netValue));
        return res.json({ success: true, data: { target: { id: target.id, accessories: [], estimatedAccessoryValue: targetBundleValue }, bundles: bundleComparisons } });
    }
    catch (e) {
        return res.status(500).json({ success: false, message: 'Failed to compute bundle value' });
    }
});
router.get('/:productId/matches', auth_1.authMiddleware, async (req, res) => {
    try {
        const { productId } = req.params;
        const widen = String(req.query?.widen || '').toLowerCase() === '1' || String(req.query?.widen || '').toLowerCase() === 'true';
        const userId = req.user.uid;
        if (!productId) {
            return res.status(400).json({
                success: false,
                error: 'Product ID is required'
            });
        }
        const sourceProduct = await db.getProductById(productId);
        if (!sourceProduct) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }
        const user = await db.getUserById(userId);
        const isAdmin = user?.role === 'admin';
        if (sourceProduct.userId !== userId && !isAdmin) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized'
            });
        }
        console.log(`🎯 Finding enhanced matches for: ${sourceProduct.title}`);
        const allProducts = await db.getProducts();
        const candidateProducts = allProducts.filter((p) => p.id !== productId);
        console.log(`📊 Database stats: ${allProducts.length} total products, ${candidateProducts.length} candidates`);
        const { matchProducts } = require('../services/productMatchingService');
        let matches = matchProducts(sourceProduct, candidateProducts);
        console.log(`🎯 Found ${matches.length} initial matches`);
        if ((widen || matches.length < 3)) {
            try {
                const externalCandidates = await widenSearchAcrossPlatforms(sourceProduct);
                if (externalCandidates.length > 0) {
                    const externalMatches = matchProducts(sourceProduct, externalCandidates);
                    const byUrl = {};
                    for (const m of [...matches, ...externalMatches]) {
                        const urlKey = (m.url || m.product?.url || '').split('#')[0];
                        if (!urlKey)
                            continue;
                        const confidence = (m.confidence ?? m.similarity ?? 0);
                        if (!byUrl[urlKey] || confidence > (byUrl[urlKey].confidence ?? byUrl[urlKey].similarity ?? 0)) {
                            byUrl[urlKey] = m;
                        }
                    }
                    matches = Object.values(byUrl);
                    console.log(`🌐 Widen search added ${Math.max(0, matches.length - candidateProducts.length)} web candidates`);
                }
                else {
                    console.log('🌐 Widen search returned no external candidates');
                }
            }
            catch (extErr) {
                console.warn('🌐 Widen search failed:', extErr instanceof Error ? extErr.message : extErr);
            }
        }
        if (matches.length === 0) {
            console.warn(`⚠️ No matches found for "${sourceProduct.title}". This could indicate:`);
            console.warn(`   - High accuracy threshold (75%+) - only very similar products match`);
            console.warn(`   - No similar products in database`);
            console.warn(`   - Brand/model extraction differences`);
            console.warn(`   - Category mismatch or price range issues`);
        }
        await db.updateProduct(productId, {
            totalMatches: matches.length
        });
        return res.json({
            success: true,
            data: {
                algorithm: 'buyhatke-enhanced',
                targetProduct: {
                    id: sourceProduct.id,
                    title: sourceProduct.title,
                    price: sourceProduct.price,
                    currency: sourceProduct.currency || 'USD',
                    platform: sourceProduct.platform,
                    imageUrl: sourceProduct.imageUrl || '',
                    url: sourceProduct.url
                },
                matches: matches.map((match) => ({
                    product: {
                        id: (match.product?.id ?? match.id),
                        title: (match.product?.title ?? match.title),
                        price: Number(match.product?.price ?? match.price ?? 0),
                        currency: (match.product?.currency ?? match.currency ?? 'USD'),
                        platform: (match.product?.platform ?? match.platform ?? 'unknown'),
                        imageUrl: (match.product?.imageUrl ?? match.imageUrl ?? ''),
                        url: (match.product?.url ?? match.url),
                        stockStatus: (match.product?.stockStatus ?? match.stockStatus ?? 'unknown')
                    },
                    confidence: Number(match.confidence ?? match.similarity ?? 0),
                    similarity: Number(match.similarity ?? match.confidence ?? 0),
                    matchReason: (match.matchReason ?? 'Similarity-based match'),
                    priceDifference: Number(match.priceDifference ?? Math.abs(Number(sourceProduct.price) - Number(match.product?.price ?? match.price ?? 0))),
                    priceDifferencePercent: Number(match.priceDifferencePercent ?? (Math.abs(Number(sourceProduct.price) - Number(match.product?.price ?? match.price ?? 0)) / Math.max(1, Number(sourceProduct.price)) * 100)),
                    savings: match.savings
                })),
                totalMatches: matches.length,
                bestMatch: matches.length > 0 ? {
                    product: {
                        id: (matches[0].product?.id ?? matches[0].id),
                        title: (matches[0].product?.title ?? matches[0].title),
                        price: Number(matches[0].product?.price ?? matches[0].price ?? 0),
                        currency: (matches[0].product?.currency ?? matches[0].currency ?? 'USD'),
                        platform: (matches[0].product?.platform ?? matches[0].platform ?? 'unknown'),
                        imageUrl: (matches[0].product?.imageUrl ?? matches[0].imageUrl ?? ''),
                        url: (matches[0].product?.url ?? matches[0].url)
                    },
                    confidence: Number(matches[0].similarity ?? matches[0].confidence ?? 0),
                    priceDifference: Number(matches[0].priceDifference ?? Math.abs(Number(sourceProduct.price) - Number(matches[0].product?.price ?? matches[0].price ?? 0)))
                } : null
            }
        });
    }
    catch (error) {
        console.error('🚨 Product matching error:', error);
        return res.status(500).json({
            success: false,
            error: 'Failed to find product matches'
        });
    }
});
function urlToPlatform(url) {
    try {
        const u = new URL(url);
        const h = u.hostname.toLowerCase();
        if (h.includes('amazon'))
            return 'amazon';
        if (h.includes('aliexpress'))
            return 'aliexpress';
        if (h.includes('ebay'))
            return 'ebay';
        if (h.includes('walmart'))
            return 'walmart';
        if (h.includes('shein'))
            return 'shein';
        if (h.includes('bestbuy'))
            return 'bestbuy';
        if (h.includes('target'))
            return 'target';
        return 'unknown';
    }
    catch {
        return 'unknown';
    }
}
async function widenSearchAcrossPlatforms(sourceProduct) {
    const serpKey = process.env.SERPAPI_KEY || process.env.SERP_API_KEY;
    if (!serpKey || typeof fetch !== 'function') {
        return [];
    }
    const q = encodeURIComponent(sourceProduct.title);
    const url = `https://serpapi.com/search.json?engine=google_shopping&q=${q}&hl=en&gl=us&api_key=${serpKey}`;
    const resp = await fetch(url);
    if (!resp.ok)
        return [];
    const data = await resp.json();
    const items = data?.shopping_results || [];
    const supported = new Set(['amazon', 'aliexpress', 'ebay', 'walmart', 'shein', 'bestbuy', 'target']);
    const candidates = [];
    for (const it of items) {
        const link = it?.link || '';
        const title = it?.title || '';
        const priceStr = (it?.price || '').replace(/[^0-9.]/g, '');
        const price = Number(priceStr || 0);
        const platform = urlToPlatform(link);
        if (!link || !title || !price || platform === 'unknown' || !supported.has(platform))
            continue;
        candidates.push({
            id: link,
            title,
            price,
            currency: 'USD',
            platform,
            url: link,
            imageUrl: it?.thumbnail || it?.product_link || ''
        });
    }
    return candidates;
}
router.get('/:productId', auth_1.authMiddleware, async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user.uid;
        if (!productId) {
            return res.status(400).json({ success: false, error: 'Product ID is required' });
        }
        const product = await db.getProductById(productId);
        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }
        const user = await db.getUserById(userId);
        const isAdmin = user?.role === 'admin';
        if (product.userId !== userId && !isAdmin) {
            return res.status(403).json({ success: false, error: 'Not authorized' });
        }
        return res.json({ success: true, data: product });
    }
    catch (e) {
        return res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
router.get('/debug/test-matching', async (req, res) => {
    try {
        const { matchProducts } = require('../services/productMatchingService');
        const testSource = {
            id: 'test1',
            title: 'Apple AirPods Pro 2nd Generation',
            price: 249.99,
            platform: 'amazon',
            url: 'test-url',
            imageUrl: '',
            currency: 'USD'
        };
        const testCandidates = [
            {
                id: 'test2',
                title: 'AirPods Pro (2nd generation) with MagSafe Charging',
                price: 239.99,
                platform: 'bestbuy',
                url: 'test-url-2',
                imageUrl: '',
                currency: 'USD'
            },
            {
                id: 'test3',
                title: 'Apple AirPods Pro Second Gen Active Noise Cancellation',
                price: 229.99,
                platform: 'walmart',
                url: 'test-url-3',
                imageUrl: '',
                currency: 'USD'
            }
        ];
        const matches = matchProducts(testSource, testCandidates);
        return res.json({
            success: true,
            data: {
                source: testSource,
                candidates: testCandidates,
                matches,
                matchCount: matches.length,
                algorithm: 'enhanced-buyhatke'
            }
        });
    }
    catch (error) {
        console.error('Test matching error:', error);
        return res.status(500).json({ success: false, error: error.message });
    }
});
router.get('/debug/all', async (req, res) => {
    try {
        const data = db.readData();
        const products = data.products || [];
        const users = data.users || [];
        console.log(`[DEBUG] Total products in database: ${products.length}`);
        console.log(`[DEBUG] Total users in database: ${users.length}`);
        const productsByUser = products.reduce((acc, product) => {
            const userId = product.userId;
            if (!acc[userId])
                acc[userId] = [];
            acc[userId].push(product);
            return acc;
        }, {});
        console.log('[DEBUG] Products by user:', Object.keys(productsByUser).map(userId => ({
            userId,
            count: productsByUser[userId].length,
            userEmail: users.find((u) => u.id === userId)?.email || 'Unknown'
        })));
        return res.json({
            success: true,
            data: {
                totalProducts: products.length,
                totalUsers: users.length,
                productsByUser: Object.keys(productsByUser).map(userId => ({
                    userId,
                    count: productsByUser[userId].length,
                    userEmail: users.find((u) => u.id === userId)?.email || 'Unknown',
                    products: productsByUser[userId].slice(0, 3)
                }))
            }
        });
    }
    catch (error) {
        console.error('[DEBUG] Error:', error);
        return res.status(500).json({ success: false, message: 'Debug endpoint error' });
    }
});
exports.default = router;
//# sourceMappingURL=products.js.map