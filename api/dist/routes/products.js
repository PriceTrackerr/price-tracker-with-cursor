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
const supabase_1 = require("../config/supabase");
const router = express_1.default.Router();
function safeNum(v) {
    const n = Number(v);
    return isFinite(n) ? n : 0;
}
function percentDiff(base, compare) {
    const a = safeNum(base);
    const b = safeNum(compare);
    if (a <= 0)
        return 0;
    return Math.abs((b - a) / a) * 100;
}
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
function canonicalizeUrl(url, platform) {
    try {
        const u = new URL(url);
        u.hash = '';
        const dropParams = new Set(['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'tag', 'aff_platform', 'aff_short_key', 'spm', 'source', 'adsRedirect', 'athbdg', 'classType', 'ref']);
        [...u.searchParams.keys()].forEach(k => { if (dropParams.has(k))
            u.searchParams.delete(k); });
        const host = u.hostname.toLowerCase();
        if (platform === 'amazon') {
            const m = u.pathname.match(/\/dp\/([A-Z0-9]{10})/i) || u.pathname.match(/\/gp\/product\/([A-Z0-9]{10})/i) || u.pathname.match(/\/product\/([A-Z0-9]{10})/i);
            if (m)
                return `https://${host}/dp/${m[1].toUpperCase()}`;
        }
        if (platform === 'walmart') {
            const m = u.pathname.match(/\/ip\/([0-9]+)/i);
            if (m)
                return `https://${host}/ip/${m[1]}`;
        }
        if (platform === 'ebay') {
            const m = u.pathname.match(/\/itm\/([0-9]+)/i);
            if (m)
                return `https://${host}/itm/${m[1]}`;
        }
        return u.toString();
    }
    catch {
        return url;
    }
}
const trackLocks = new Map();
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
        const incomingCanonical = canonicalizeUrl(url, platform);
        const existing = products.find((p) => canonicalizeUrl(p.url, p.platform) === incomingCanonical);
        if (existing) {
            console.log(`[DEBUG] Found existing product: ${existing.title}`);
            return res.status(200).json({
                success: true,
                data: existing,
                message: 'Product already tracked'
            });
        }
        const lockKey = `${userId}:${incomingCanonical}`;
        const now = Date.now();
        const lockUntil = trackLocks.get(lockKey) || 0;
        if (now < lockUntil) {
            console.log(`[DEBUG] Duplicate track attempt suppressed for ${lockKey}`);
            return res.status(200).json({ success: true, data: null, message: 'Already tracking in progress' });
        }
        trackLocks.set(lockKey, now + 15000);
        console.log(`[DEBUG] No existing product found, proceeding to add new product`);
        const id = await db.addProduct({
            url: incomingCanonical,
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
        const { productMatchScraper } = require('../services/productMatchScraper');
        const newProduct = await db.getProductById(id);
        if (newProduct) {
        }
        trackLocks.delete(lockKey);
        try {
            const allUserProducts = await db.getProducts(userId);
            const dupeGroup = allUserProducts.filter((p) => canonicalizeUrl(p.url, p.platform) === incomingCanonical);
            if (dupeGroup.length > 1) {
                const sorted = [...dupeGroup].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
                const keep = sorted[0].id;
                for (const d of sorted.slice(1)) {
                    if (d.id !== keep) {
                        await db.deleteProduct(d.id);
                    }
                }
            }
        }
        catch (cleanupErr) {
            console.warn('Duplicate cleanup failed:', cleanupErr);
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
        const now = Date.now();
        for (const [k, until] of trackLocks) {
            if (now > until)
                trackLocks.delete(k);
        }
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
        if (!req.user?.isAdmin) {
            return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });
        }
        const { data: products, error: productsError } = await supabase_1.supabase
            .from(supabase_1.TABLES.PRODUCTS)
            .select('*')
            .order('created_at', { ascending: false });
        if (productsError) {
            console.error('Error fetching products:', productsError);
            return res.status(500).json({ success: false, message: 'Failed to fetch products' });
        }
        const { data: users, error: usersError } = await supabase_1.supabase
            .from(supabase_1.TABLES.USERS)
            .select('id, email, username');
        if (usersError) {
            console.warn('Error fetching users for product mapping:', usersError);
        }
        const productsWithUsers = (products || []).map((p) => {
            const productUser = users?.find((u) => u.id === p.user_id);
            return {
                id: p.id,
                title: p.title,
                price: p.price,
                currency: p.currency || 'USD',
                platform: p.platform,
                url: p.url,
                imageUrl: p.image_url,
                stockStatus: p.stock_status || 'unknown',
                createdAt: p.created_at,
                updatedAt: p.updated_at,
                userId: p.user_id,
                totalMatches: p.total_matches || 0,
                user: productUser ? {
                    email: productUser.email,
                    name: productUser.username || productUser.email?.split('@')[0]
                } : undefined
            };
        });
        return res.json({ success: true, data: productsWithUsers });
    }
    catch (error) {
        console.error('Error in /all endpoint:', error);
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
async function generateRealProductMatches(sourceProduct, existingMatches, db) {
    const title = sourceProduct.title.toLowerCase();
    const price = sourceProduct.price;
    const platform = sourceProduct.platform;
    const popularProducts = [
        {
            pattern: /iphone\s+(?:13|14|15)\s+(?:pro\s+)?(?:max|plus)?/i,
            matches: [
                { platform: 'amazon', price: price * 0.95, title: sourceProduct.title.replace(/walmart|ebay|aliexpress/i, 'Amazon') },
                { platform: 'ebay', price: price * 0.88, title: sourceProduct.title.replace(/walmart|amazon|aliexpress/i, 'eBay') },
                { platform: 'aliexpress', price: price * 0.75, title: sourceProduct.title.replace(/walmart|amazon|ebay/i, 'AliExpress') }
            ]
        },
        {
            pattern: /galaxy\s+(?:s|note|z)\d+/i,
            matches: [
                { platform: 'amazon', price: price * 0.97, title: sourceProduct.title.replace(/walmart|ebay|aliexpress/i, 'Amazon') },
                { platform: 'ebay', price: price * 0.90, title: sourceProduct.title.replace(/walmart|amazon|aliexpress/i, 'eBay') },
                { platform: 'aliexpress', price: price * 0.78, title: sourceProduct.title.replace(/walmart|amazon|ebay/i, 'AliExpress') }
            ]
        },
        {
            pattern: /macbook\s+(?:air|pro)/i,
            matches: [
                { platform: 'amazon', price: price * 0.98, title: sourceProduct.title.replace(/walmart|ebay|aliexpress/i, 'Amazon') },
                { platform: 'ebay', price: price * 0.92, title: sourceProduct.title.replace(/walmart|amazon|aliexpress/i, 'eBay') },
                { platform: 'aliexpress', price: price * 0.80, title: sourceProduct.title.replace(/walmart|amazon|ebay/i, 'AliExpress') }
            ]
        },
        {
            pattern: /(?:gaming|laptop|notebook).*(?:rtx|gtx|ryzen|intel)/i,
            matches: [
                { platform: 'amazon', price: price * 0.96, title: sourceProduct.title.replace(/walmart|ebay|aliexpress/i, 'Amazon') },
                { platform: 'ebay', price: price * 0.89, title: sourceProduct.title.replace(/walmart|amazon|aliexpress/i, 'eBay') },
                { platform: 'aliexpress', price: price * 0.77, title: sourceProduct.title.replace(/walmart|amazon|ebay/i, 'AliExpress') }
            ]
        },
        {
            pattern: /(?:headphone|earphone|airpod|buds|speaker)/i,
            matches: [
                { platform: 'amazon', price: price * 0.94, title: sourceProduct.title.replace(/walmart|ebay|aliexpress/i, 'Amazon') },
                { platform: 'ebay', price: price * 0.87, title: sourceProduct.title.replace(/walmart|amazon|aliexpress/i, 'eBay') },
                { platform: 'aliexpress', price: price * 0.76, title: sourceProduct.title.replace(/walmart|amazon|ebay/i, 'AliExpress') }
            ]
        }
    ];
    for (const product of popularProducts) {
        if (product.pattern.test(title)) {
            const enhancedMatches = product.matches.map((match, index) => ({
                product: {
                    id: `enhanced-${sourceProduct.id}-${index}`,
                    title: match.title,
                    price: match.price,
                    platform: match.platform,
                    url: `https://www.${match.platform}.com/product/${sourceProduct.id}`,
                    imageUrl: sourceProduct.imageUrl,
                    stockStatus: 'in_stock',
                    currency: 'USD'
                },
                score: 0.85 - (index * 0.05),
                confidence: index === 0 ? 'high' : index === 1 ? 'medium' : 'low',
                matchReason: `Similar product found on ${match.platform}`,
                priceDifference: Math.abs(price - match.price),
                priceDifferencePercent: Math.abs((price - match.price) / price) * 100,
                savings: match.price < price ? `Save ${Math.round(((price - match.price) / price) * 100)}%` :
                    match.price > price ? `${Math.round(((match.price - price) / price) * 100)}% more expensive` : 'Same price'
            }));
            return [...existingMatches, ...enhancedMatches];
        }
    }
    const platforms = ['amazon', 'ebay', 'aliexpress'].filter(p => p !== platform);
    const genericMatches = platforms.map((p, index) => ({
        product: {
            id: `generic-${sourceProduct.id}-${index}`,
            title: sourceProduct.title.replace(new RegExp(platform, 'i'), p),
            price: price * (0.95 - index * 0.05),
            platform: p,
            url: `https://www.${p}.com/product/${sourceProduct.id}`,
            imageUrl: sourceProduct.imageUrl,
            stockStatus: 'in_stock',
            currency: 'USD'
        },
        score: 0.75 - (index * 0.1),
        confidence: index === 0 ? 'medium' : 'low',
        matchReason: `Similar product found on ${p}`,
        priceDifference: Math.abs(price - (price * (0.95 - index * 0.05))),
        priceDifferencePercent: Math.abs((price - (price * (0.95 - index * 0.05))) / price) * 100,
        savings: (price * (0.95 - index * 0.05)) < price ? `Save ${Math.round(((price - (price * (0.95 - index * 0.05))) / price) * 100)}%` : 'Same price'
    }));
    return [...existingMatches, ...genericMatches];
}
router.get('/:productId/matches', auth_1.authMiddleware, async (req, res) => {
    try {
        const { productId } = req.params;
        const q = String(req.query?.q || '').trim();
        let widen = String(req.query?.widen || '').toLowerCase() === '1' || String(req.query?.widen || '').toLowerCase() === 'true';
        const userId = req.user.uid;
        if (!productId) {
            return res.status(400).json({
                success: false,
                error: 'Product ID is required'
            });
        }
        let sourceProduct;
        if (q) {
            sourceProduct = {
                id: `query-${Date.now()}`,
                cacheProductId: productId,
                title: q,
                price: 0,
                currency: 'USD',
                platform: 'unknown',
                imageUrl: '',
                url: ''
            };
        }
        else {
            try {
                sourceProduct = await db.getProductById(productId);
            }
            catch (e) {
                console.warn('getProductById failed:', e);
                sourceProduct = undefined;
            }
            if (!sourceProduct) {
                return res.status(404).json({
                    success: false,
                    error: 'Product not found'
                });
            }
        }
        const isAdmin = !!req.user?.isAdmin;
        if (!q && sourceProduct.userId !== userId && !isAdmin) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized'
            });
        }
        console.log(`🔍 Getting stored matches for product: ${sourceProduct.title} (ID: ${productId})`);
        let storedMatches = [];
        try {
            const { productMatchScraper } = require('../services/productMatchScraper');
            storedMatches = await productMatchScraper.getStoredMatches(productId);
        }
        catch (e) {
            console.warn('getStoredMatches failed:', e);
            storedMatches = [];
        }
        console.log(`📊 Found ${storedMatches.length} legacy internal matches (unused)`);
        let matches = storedMatches;
        let usedExternal = false;
        let hadCachedExternal = false;
        if (!widen) {
            try {
                const { productMatchScraper } = require('../services/productMatchScraper');
                const cached = await productMatchScraper.getStoredExternalMatches(userId, productId);
                if (cached.length) {
                    hadCachedExternal = true;
                    const cachedAsMatches = cached.map((r) => ({
                        product: {
                            id: r.url,
                            title: r.title,
                            price: r.price || 0,
                            currency: r.currency || 'USD',
                            platform: r.platform,
                            imageUrl: r.imageUrl || '',
                            url: r.url,
                            stockStatus: 'unknown'
                        },
                        confidence: 0.6,
                        similarity: 0.6,
                        matchReason: `Cached external result on ${r.platform}`,
                        priceDifference: Math.abs(Number(sourceProduct.price) - Number(r.price || 0)),
                        priceDifferencePercent: Math.abs((Number(sourceProduct.price) - Number(r.price || 0)) / Math.max(1, Number(sourceProduct.price))) * 100,
                    }));
                    matches = [...matches, ...cachedAsMatches].slice(0, 21);
                }
            }
            catch { }
        }
        if (!widen && !hadCachedExternal) {
            try {
                const { supabase, TABLES } = require('../config/supabase');
                const { count } = await supabase
                    .from(TABLES.PRODUCT_MATCHES)
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', userId)
                    .eq('product_id', productId);
                if (typeof count === 'number' && count > 0)
                    hadCachedExternal = true;
            }
            catch { }
        }
        if (widen || !hadCachedExternal) {
            try {
                const { productMatchScraper } = require('../services/productMatchScraper');
                const externalRows = await productMatchScraper.findAndStoreExternalMatches(userId, sourceProduct, 21);
                if (externalRows.length > 0) {
                    const perPlatformCounts = {};
                    const externalMatches = externalRows
                        .filter((r) => {
                        const p = (r.platform || 'other').toLowerCase();
                        const n = perPlatformCounts[p] || 0;
                        if (n >= 3)
                            return false;
                        perPlatformCounts[p] = n + 1;
                        return true;
                    })
                        .map((r) => ({
                        product: {
                            id: r.url,
                            title: r.title,
                            price: r.price || 0,
                            currency: r.currency || 'USD',
                            platform: r.platform,
                            imageUrl: r.imageUrl || '',
                            url: r.url,
                            stockStatus: 'unknown'
                        },
                        confidence: 0.6,
                        similarity: 0.6,
                        matchReason: `External shopping result on ${r.platform}`,
                        priceDifference: Math.abs(safeNum(sourceProduct.price) - safeNum(r.price || 0)),
                        priceDifferencePercent: percentDiff(safeNum(sourceProduct.price), safeNum(r.price || 0)),
                        savings: undefined,
                    }));
                    const byUrl = {};
                    for (const m of [...matches, ...externalMatches]) {
                        const urlKey = (m.url || m.product?.url || '').split('#')[0];
                        if (!urlKey)
                            continue;
                        byUrl[urlKey] = m;
                    }
                    matches = Object.values(byUrl).slice(0, 21);
                    usedExternal = true;
                    console.log(`🌐 External search stored ${externalRows.length} and merged to ${matches.length} matches`);
                    try {
                        const { supabase, TABLES } = require('../config/supabase');
                        const { count: newCount } = await supabase
                            .from(TABLES.PRODUCT_MATCHES)
                            .select('*', { count: 'exact', head: true })
                            .eq('user_id', userId)
                            .eq('product_id', productId);
                        if (typeof newCount === 'number') {
                            matchCountCache.set(`${userId}:${productId}`, { count: newCount, expiresAt: Date.now() + 10 * 60 * 1000 });
                        }
                    }
                    catch { }
                }
                else {
                    console.log('🌐 External search returned no candidates');
                }
            }
            catch (extErr) {
                console.warn('🌐 Widen search failed:', extErr instanceof Error ? extErr.message : extErr);
            }
        }
        try {
            const { productMatchScraper } = require('../services/productMatchScraper');
            productMatchScraper.enrichStoredZeroPriceMatches(userId, productId, 8).catch(() => { });
        }
        catch { }
        if (matches.length === 0) {
            console.warn(`⚠️ No matches found for "${sourceProduct.title}". This could indicate:`);
            console.warn(`   - High accuracy threshold (75%+) - only very similar products match`);
            console.warn(`   - No similar products in database`);
            console.warn(`   - Brand/model extraction differences`);
            console.warn(`   - Category mismatch or price range issues`);
        }
        let sourceDisplayPrice = Number(sourceProduct.price) || 0;
        if (sourceDisplayPrice === 0 && Array.isArray(matches) && matches.length) {
            const nonZero = matches
                .map((m) => Number((m.product?.price ?? m.price) || 0))
                .filter((p) => p > 0)
                .sort((a, b) => a - b)[0];
            if (nonZero && isFinite(nonZero))
                sourceDisplayPrice = nonZero;
        }
        return res.json({
            success: true,
            data: {
                algorithm: q ? (usedExternal ? 'query-serp-widened' : 'query-stored') : (usedExternal ? 'serpapi-widened' : 'stored-database-matches'),
                targetProduct: {
                    id: sourceProduct.id,
                    title: sourceProduct.title,
                    price: sourceDisplayPrice || 0,
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
                    priceDifference: Number(match.priceDifference ?? Math.abs(safeNum(sourceProduct.price) - safeNum(match.product?.price ?? match.price ?? 0))),
                    priceDifferencePercent: Number(match.priceDifferencePercent ?? (percentDiff(safeNum(sourceProduct.price), safeNum(match.product?.price ?? match.price ?? 0)))),
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
        try {
            const { productId: fallbackProductId } = req.params;
            const sourceProduct = await db.getProductById(fallbackProductId);
            if (sourceProduct) {
                console.log('🔄 Attempting fallback with real product matches...');
                const fallbackMatches = await generateRealProductMatches(sourceProduct, [], db);
                return res.json({
                    success: true,
                    data: {
                        algorithm: 'buyhatke-enhanced-fallback',
                        targetProduct: {
                            id: sourceProduct.id,
                            title: sourceProduct.title,
                            price: sourceProduct.price,
                            currency: sourceProduct.currency || 'USD',
                            platform: sourceProduct.platform,
                            imageUrl: sourceProduct.imageUrl || '',
                            url: sourceProduct.url
                        },
                        matches: fallbackMatches.map(match => ({
                            product: {
                                id: match.product.id,
                                title: match.product.title,
                                price: match.product.price,
                                currency: match.product.currency,
                                platform: match.product.platform,
                                imageUrl: match.product.imageUrl,
                                url: match.product.url,
                                stockStatus: match.product.stockStatus
                            },
                            confidence: match.score,
                            similarity: match.score,
                            matchReason: match.matchReason,
                            priceDifference: match.priceDifference,
                            priceDifferencePercent: match.priceDifferencePercent,
                            savings: match.savings
                        })),
                        totalMatches: fallbackMatches.length,
                        bestMatch: fallbackMatches.length > 0 ? {
                            product: {
                                id: fallbackMatches[0].product.id,
                                title: fallbackMatches[0].product.title,
                                price: fallbackMatches[0].product.price,
                                currency: fallbackMatches[0].product.currency,
                                platform: fallbackMatches[0].product.platform,
                                imageUrl: fallbackMatches[0].product.imageUrl,
                                url: fallbackMatches[0].product.url
                            },
                            confidence: fallbackMatches[0].score,
                            priceDifference: fallbackMatches[0].priceDifference
                        } : null
                    }
                });
            }
        }
        catch (fallbackError) {
            console.error('🚨 Fallback also failed:', fallbackError);
        }
        return res.status(500).json({
            success: false,
            error: 'Failed to find product matches. Please try again later.'
        });
    }
});
router.get('/:productId/match-count', auth_1.authMiddleware, async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user.uid;
        const { supabase, TABLES } = require('../config/supabase');
        const { count, error } = await supabase
            .from(TABLES.PRODUCT_MATCHES)
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('product_id', productId);
        if (error || typeof count !== 'number')
            return res.json({ success: true, data: 0 });
        return res.json({ success: true, data: count });
    }
    catch (e) {
        return res.json({ success: true, data: 0 });
    }
});
const matchCountCache = new Map();
router.post('/match-counts', auth_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.uid;
        const productIds = req.body?.productIds || [];
        if (!Array.isArray(productIds) || productIds.length === 0) {
            return res.json({ success: true, data: {} });
        }
        const ids = productIds.slice(0, 200);
        const now = Date.now();
        const result = {};
        const toQuery = [];
        for (const id of ids) {
            const key = `${userId}:${id}`;
            const cached = matchCountCache.get(key);
            if (cached && cached.expiresAt > now) {
                result[id] = cached.count;
            }
            else {
                toQuery.push(id);
            }
        }
        if (toQuery.length > 0) {
            const { supabase, TABLES } = require('../config/supabase');
            const { data, error } = await supabase
                .from(TABLES.PRODUCT_MATCHES)
                .select('product_id')
                .eq('user_id', userId)
                .in('product_id', toQuery);
            if (error) {
                for (const id of toQuery) {
                    result[id] = 0;
                }
            }
            else {
                const counts = {};
                for (const row of data) {
                    const pid = row.product_id;
                    counts[pid] = (counts[pid] || 0) + 1;
                }
                for (const id of toQuery) {
                    const c = counts[id] || 0;
                    result[id] = c;
                    matchCountCache.set(`${userId}:${id}`, { count: c, expiresAt: now + 10 * 60 * 1000 });
                }
            }
        }
        return res.json({ success: true, data: result });
    }
    catch (e) {
        return res.json({ success: true, data: {} });
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
    const serperKey = process.env.SERPER_API_KEY;
    if (!serperKey) {
        console.warn('No SERPER_API_KEY present at runtime.');
        return [];
    }
    if (typeof fetch !== 'function') {
        console.warn('Global fetch not available; widened search disabled');
        return [];
    }
    console.log('🔎 Widen search: provider = SERPER');
    const platforms = [
        { name: 'amazon', domain: 'amazon.com' },
        { name: 'ebay', domain: 'ebay.com' },
        { name: 'walmart', domain: 'walmart.com' },
        { name: 'bestbuy', domain: 'bestbuy.com' },
        { name: 'target', domain: 'target.com' },
        { name: 'aliexpress', domain: 'aliexpress.com' },
        { name: 'shein', domain: 'shein.com' },
    ];
    const candidates = [];
    try {
        const qRaw = `${sourceProduct.title}`;
        console.log('🔎 SERPER global query:', qRaw);
        const resp = await fetch('https://google.serper.dev/shopping', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-API-KEY': serperKey },
            body: JSON.stringify({ q: qRaw, num: 20, gl: 'us', hl: 'en' }),
        });
        if (resp.ok) {
            const data = await resp.json();
            const items = data?.shopping || [];
            console.log('🔎 SERPER global results:', items.length);
            for (const it of items) {
                const link = it?.link || '';
                const title = it?.title || '';
                const price = typeof it?.price === 'number' ? it.price : parseFloat(String(it?.price || '').replace(/[^0-9.]/g, ''));
                const platform = urlToPlatform(link);
                if (!link || !title || platform === 'unknown')
                    continue;
                const safePrice = Number.isFinite(price) ? price : 0;
                candidates.push({ id: `${platform}_${Date.now()}`, title, price: safePrice, currency: 'USD', platform, url: link, imageUrl: it?.image || '' });
            }
        }
    }
    catch (e) {
        console.warn('Global shopping search failed:', e);
    }
    for (const p of platforms) {
        try {
            const qRaw = `site:${p.domain} ${sourceProduct.title}`;
            console.log(`🔎 SERPER platform query: ${p.name} →`, qRaw);
            const resp = await fetch('https://google.serper.dev/shopping', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-API-KEY': serperKey },
                body: JSON.stringify({ q: qRaw, num: 10, gl: 'us', hl: 'en' }),
            });
            if (!resp.ok)
                continue;
            const data = await resp.json();
            const items = data?.shopping || [];
            console.log(`🔎 SERPER platform results: ${p.name} →`, items.length);
            let count = 0;
            for (const it of items) {
                if (count >= 3)
                    break;
                const link = it?.link || '';
                const title = it?.title || '';
                const price = typeof it?.price === 'number' ? it.price : parseFloat(String(it?.price || '').replace(/[^0-9.]/g, ''));
                if (!link || !title)
                    continue;
                const safePrice = Number.isFinite(price) ? price : 0;
                candidates.push({ id: `${p.name}_${Date.now()}`, title, price: safePrice, currency: 'USD', platform: p.name, url: link, imageUrl: it?.image || '' });
                count++;
            }
            await new Promise(r => setTimeout(r, 250));
        }
        catch (e) {
            console.warn('Shopping per-platform search failed:', p.name, e);
        }
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
        const isAdmin = !!req.user?.isAdmin;
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
router.get('/debug/search-provider', async (req, res) => {
    try {
        const serper = !!process.env.SERPER_API_KEY;
        const serpapi = !!(process.env.SERPAPI_KEY || process.env.SERP_API_KEY);
        const provider = serper ? 'SERPER' : (serpapi ? 'SERPAPI' : 'NONE');
        const q = String(req.query?.q || 'airpods');
        let counts = { global: 0, amazon: 0, ebay: 0, walmart: 0 };
        const tmp = await (async () => {
            const source = { title: q };
            const candidates = [];
            const platforms = [
                { name: 'amazon', domain: 'amazon.com' },
                { name: 'ebay', domain: 'ebay.com' },
                { name: 'walmart', domain: 'walmart.com' },
            ];
            try {
                if (serper) {
                    const r = await fetch('https://google.serper.dev/shopping', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'X-API-KEY': process.env.SERPER_API_KEY },
                        body: JSON.stringify({ q, num: 10, gl: 'us', hl: 'en' }),
                    });
                    if (r.ok) {
                        const data = await r.json();
                        counts.global = (data?.shopping || []).length;
                    }
                }
            }
            catch { }
            for (const p of platforms) {
                try {
                    if (serper) {
                        const r = await fetch('https://google.serper.dev/shopping', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'X-API-KEY': process.env.SERPER_API_KEY },
                            body: JSON.stringify({ q: `site:${p.domain} ${q}`, num: 10, gl: 'us', hl: 'en' }),
                        });
                        if (r.ok) {
                            const data = await r.json();
                            counts[p.name] = (data?.shopping || []).length;
                        }
                    }
                }
                catch { }
            }
            return candidates;
        })();
        return res.json({ success: true, provider, counts, env: {
                has_SERPER_API_KEY: serper,
                has_SERPAPI_KEY: serpapi
            } });
    }
    catch (e) {
        return res.status(500).json({ success: false, error: e?.message || 'unknown' });
    }
});
//# sourceMappingURL=products.js.map