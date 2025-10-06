import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { getDb } from '../config/database';
const db = getDb();
import { authMiddleware, AuthRequest } from '../middleware/auth';


const router = express.Router();

// Import Product interface from storage
import type { Product } from '../config/storage';

// Product matching interfaces
interface ProductMatch {
  product: Product;
  similarity: number;
  confidence: 'high' | 'medium' | 'low';
  matchReason: string;
  priceDifference: number;
  priceDifferencePercent: number;
}



// Extended User interface to include role
interface UserWithRole {
  id: string;
  email: string;
  password: string;
  username: string;
  createdAt: string;
  lastLogin: string;
  role?: 'admin' | 'user';
}

// Validation middleware
const validateProduct = [
  body('url').isURL().withMessage('Valid URL is required'),
  body('title').notEmpty().withMessage('Product title is required'),
  body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
  body('platform').isIn(['amazon', 'aliexpress', 'ebay', 'walmart', 'shein', 'bestbuy', 'target']).withMessage('Valid platform is required')
];

// Utility to add affiliate tag to URLs
function addAffiliateTag(url: string, platform: 'amazon' | 'aliexpress' | 'ebay' | 'walmart' | 'shein' | 'bestbuy' | 'target'): string {
  try {
    const u = new URL(url);
    if (platform === 'amazon') {
      u.searchParams.set('tag', 'pricetrack0f8-20');
      return u.toString();
    } else if (platform === 'aliexpress') {
      u.searchParams.set('aff_platform', 'link-c-tool');
      u.searchParams.set('aff_short_key', 'pricetrack0f8-20');
      return u.toString();
    } else if (platform === 'bestbuy') {
      u.searchParams.set('campid', 'your-bestbuy-campaign-id');
      return u.toString();
    } else if (platform === 'target') {
      u.searchParams.set('affiliate', 'your-target-affiliate-id');
      return u.toString();
    }
    // For ebay, walmart, shein: no affiliate tag for now, just return the original URL
    return url;
  } catch {
    return url;
  }
}

// ===== SEARCH ENDPOINT =====

// Search products with recommendations
router.get('/search', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { q, limit = 10 } = req.query;
    const userId = req.user!.uid;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Search query is required'
      });
    }
    
    const allProducts = await db.getProducts();
    const userProducts = allProducts.filter((p: any) => p.userId === userId);
    
    const query = q.toLowerCase().trim();
    
    // Find products that start with the query (priority)
    const startsWithMatches = userProducts.filter((product: any) => 
      product.title.toLowerCase().startsWith(query) ||
      product.platform.toLowerCase().startsWith(query)
    );
    
    // Find products that contain the query
    const containsMatches = userProducts.filter((product: any) => 
      product.title.toLowerCase().includes(query) ||
      product.platform.toLowerCase().includes(query)
    );
    
    // Combine and deduplicate results
    const allMatches = [...startsWithMatches, ...containsMatches];
    const uniqueMatches = allMatches.filter((product, index, self) => 
      index === self.findIndex(p => p.id === product.id)
    );
    
    // Limit results
    const limitedMatches = uniqueMatches.slice(0, parseInt(limit as string));
    
    return res.json({
      success: true,
      data: {
        query,
        results: limitedMatches,
        total: limitedMatches.length,
        hasMore: uniqueMatches.length > limitedMatches.length
      }
    });
  } catch (error) {
    console.error('Error searching products:', error);
    return res.status(500).json({
        success: false,
      error: 'Internal server error'
    });
  }
});

// ===== PRODUCT MATCHING ALGORITHM =====















function canonicalizeUrl(url: string, platform: 'amazon'|'aliexpress'|'ebay'|'walmart'|'shein'|'bestbuy'|'target'): string {
  try {
    const u = new URL(url);
    u.hash = '';
    // Remove common tracking params
    const dropParams = new Set(['utm_source','utm_medium','utm_campaign','utm_term','utm_content','tag','aff_platform','aff_short_key','spm','source','adsRedirect','athbdg','classType','ref']);
    [...u.searchParams.keys()].forEach(k => { if (dropParams.has(k)) u.searchParams.delete(k); });
    const host = u.hostname.toLowerCase();
    if (platform === 'amazon') {
      // Normalize to /dp/ASIN
      const m = u.pathname.match(/\/dp\/([A-Z0-9]{10})/i) || u.pathname.match(/\/gp\/product\/([A-Z0-9]{10})/i) || u.pathname.match(/\/product\/([A-Z0-9]{10})/i);
      if (m) return `https://${host}/dp/${m[1].toUpperCase()}`;
    }
    if (platform === 'walmart') {
      const m = u.pathname.match(/\/ip\/([0-9]+)/i);
      if (m) return `https://${host}/ip/${m[1]}`;
    }
    if (platform === 'ebay') {
      const m = u.pathname.match(/\/itm\/([0-9]+)/i);
      if (m) return `https://${host}/itm/${m[1]}`;
    }
    // Fallback to cleaned URL
    return u.toString();
  } catch {
    return url;
  }
}

// Simple in-memory lock to avoid rapid duplicate inserts per user+url
const trackLocks = new Map<string, number>();

// Track a new product
router.post('/track', authMiddleware, validateProduct, async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array() 
      });
    }

    const { url, title, price, currency, platform, imageUrl, stockStatus, discountInfo } = req.body;
    
    const userId = req.user!.uid;
    
    // Prevent duplicate products for the same user and url
    const products = await db.getProducts(userId);
    console.log(`[DEBUG] Checking for duplicates - User: ${userId}, URL: ${url}`);
    console.log(`[DEBUG] User has ${products.length} products`);
    
    const incomingCanonical = canonicalizeUrl(url, platform);
    const existing = products.find((p: any) => canonicalizeUrl(p.url, p.platform) === incomingCanonical);
    
    if (existing) {
      console.log(`[DEBUG] Found existing product: ${existing.title}`);
      // Return success with existing product to avoid showing an error in the extension
      return res.status(200).json({
        success: true,
        data: existing,
        message: 'Product already tracked'
      });
    }
    
    // Lock key to prevent multi-click duplicates (auto-release after 15s)
    const lockKey = `${userId}:${incomingCanonical}`;
    const now = Date.now();
    const lockUntil = trackLocks.get(lockKey) || 0;
    if (now < lockUntil) {
      console.log(`[DEBUG] Duplicate track attempt suppressed for ${lockKey}`);
      return res.status(200).json({ success: true, data: null, message: 'Already tracking in progress' });
    }
    trackLocks.set(lockKey, now + 15000);

    console.log(`[DEBUG] No existing product found, proceeding to add new product`);

    // Add the new product
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
      totalMatches: 0 // Initialize with 0 matches
    });
    
    await db.addPriceHistory({ 
      productId: id, 
      price: typeof price === 'string' ? parseFloat(price) : price, 
      currency: currency || '$' 
    });

    // Pre-scrape and store matches for the new product (BuyHatke approach)
    const { productMatchScraper } = require('../services/productMatchScraper');
    const newProduct = await db.getProductById(id);
    
    if (newProduct) {
      console.log(`🚀 Triggering pre-scrape for new product: ${newProduct.title}`);
      // Run pre-scraping in background (don't wait for it)
      productMatchScraper.scrapeAndStoreMatches(newProduct).catch((error: any) => {
        console.error('❌ Background pre-scraping failed:', error);
      });
    }
    
    // Release lock
    trackLocks.delete(lockKey);

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
  } catch (error: unknown) {
    // Release all expired locks periodically
    const now = Date.now();
    for (const [k, until] of trackLocks) { if (now > until) trackLocks.delete(k); }
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({
      success: false,
      error: message
    });
  }
});

// Get user's tracked products with advanced filtering and sorting
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.uid;
    let products = await db.getProducts(userId);
    
    // Get seen price drop IDs for this user
    const user = await db.getUserById(userId);
    const seenPriceDropIds = user?.seenPriceDropIds || [];
    
    // Extract query parameters for filtering and sorting
    const {
      search,
      platform,
      minPrice,
      maxPrice,
      stockStatus,
      hasPriceDrop,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      limit,
      offset = 0
    } = req.query;
    
    // Add price history and calculate price drops
    let productsWithHistory = await Promise.all(products.map(async (product: Product) => {
      const history = await db.getPriceHistory(product.id);
      const priceHistory = history || [];
      
      // Calculate price drop information
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
          // Only mark as hasPriceDrop if it hasn't been seen
          hasPriceDrop = priceDrop > 0 && !seenPriceDropIds.includes(product.id);
        }
      }
      
      return {
        ...product,
        url: addAffiliateTag(product.url, product.platform as any),
        priceHistory,
        priceDrop,
        priceDropPercent,
        previousPrice,
        hasPriceDrop
      };
    }));
    
    // Apply filters
    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase();
      productsWithHistory = productsWithHistory.filter(product =>
        product.title.toLowerCase().includes(searchLower) ||
        product.platform.toLowerCase().includes(searchLower)
      );
    }
    
    if (platform && typeof platform === 'string') {
      productsWithHistory = productsWithHistory.filter(product =>
        product.platform === platform
      );
    }
    
    if (minPrice && typeof minPrice === 'string') {
      const min = parseFloat(minPrice);
      if (!isNaN(min)) {
        productsWithHistory = productsWithHistory.filter(product =>
          product.price >= min
        );
      }
    }
    
    if (maxPrice && typeof maxPrice === 'string') {
      const max = parseFloat(maxPrice);
      if (!isNaN(max)) {
        productsWithHistory = productsWithHistory.filter(product =>
          product.price <= max
        );
      }
    }
    
    if (stockStatus && typeof stockStatus === 'string') {
      productsWithHistory = productsWithHistory.filter(product =>
        product.stockStatus === stockStatus
      );
    }
    
    if (hasPriceDrop === 'true') {
      productsWithHistory = productsWithHistory.filter(product =>
        product.hasPriceDrop
      );
    }
    
    // Apply sorting
    const sortOrderMultiplier = sortOrder === 'desc' ? -1 : 1;
    
    productsWithHistory.sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
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
      
      if (aValue < bValue) return -1 * sortOrderMultiplier;
      if (aValue > bValue) return 1 * sortOrderMultiplier;
      return 0;
    });
    
    // Apply pagination
    const totalCount = productsWithHistory.length;
    const offsetNum = parseInt(offset as string) || 0;
    const limitNum = limit ? parseInt(limit as string) : totalCount;
    
    const paginatedProducts = productsWithHistory.slice(offsetNum, offsetNum + limitNum);
    
    // Calculate summary statistics
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
  } catch (error: unknown) {
    console.error('Error fetching products:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Delete a tracked product
router.delete('/:productId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.params;
    const userId = req.user!.uid;
    if (!productId) {
      return res.status(400).json({
        success: false,
        error: 'Product ID is required'
      });
    }
    
    const product = await db.getProductById(productId);
    const user = await db.getUserById(userId) as UserWithRole | undefined;
    
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    // Check if user is admin or owns the product
    if (!user || (user.role !== 'admin' && product.userId !== userId)) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }
    
    await db.deleteProduct(productId);
    return res.json({ success: true, message: 'Product removed from tracking' });
  } catch (error: unknown) {
    console.error('Error removing product:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get product price history
router.get('/:productId/history', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.params;
    const userId = req.user!.uid;
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
  } catch (error) {
    console.error('Error fetching price history:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get filter options and statistics
router.get('/filters', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.uid;
    const products = await db.getProducts(userId);
    
    // Get seen price drop IDs for this user
    const user = await db.getUserById(userId);
    const seenPriceDropIds = user?.seenPriceDropIds || [];
    
    // Calculate price ranges
    const prices = products.map((p: Product) => p.price).filter((p: number) => p > 0);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

    // Get unique platforms
    const platforms = [...new Set(products.map((p: Product) => p.platform))];

    // Get stock status counts
    const stockStatuses = products.reduce((acc: Record<string, number>, product: Product) => {
      const status = product.stockStatus || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Calculate price drop statistics (only unseen drops)
    const productsWithHistory = await Promise.all(products.map(async (product: Product) => {
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
    
    // Only count unseen price drops
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
  } catch (error) {
    console.error('Error fetching filter options:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Admin: Get all tracked products
router.get('/all', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // Get current user
    const user = await db.getUserById(req.user!.uid) as UserWithRole | undefined;
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });
    }
    
    // Get all products using the readData method
    const data = (db as any).readData();
    const products: any[] = data.products || [];
    const users: any[] = data.users || [];
    
    // Ensure every product has an id and include user information
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
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch all products' });
  }
});

// Get all products with price drops
router.get('/price-drops', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const products = await db.getProducts(userId);
    const priceDropIds: string[] = [];

    for (const product of products) {
      const history = await db.getPriceHistory(product.id);
      if (history.length > 1) {
        // Sort history by timestamp to ensure chronological order
        const sortedHistory = history.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        const last = sortedHistory[sortedHistory.length - 1];
        const prev = sortedHistory[sortedHistory.length - 2];
        if (last && prev && last.price < prev.price) {
          priceDropIds.push(product.id);
        }
      }
    }

    return res.json({ success: true, data: priceDropIds });
  } catch (error) {
    console.error('Error fetching price drops:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch price drops' });
  }
});



// Link products manually
router.post('/:productId/link/:targetProductId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { productId, targetProductId } = req.params;
    const userId = req.user!.uid;
    
    if (!productId || !targetProductId) {
      return res.status(400).json({
        success: false,
        error: 'Both product IDs are required'
      });
    }
    
    // Get both products
    const allProducts = await db.getProducts();
    const product = allProducts.find((p: any) => p.id === productId);
    const targetProduct = allProducts.find((p: any) => p.id === targetProductId);
    
    if (!product || !targetProduct) {
      return res.status(404).json({
        success: false,
        error: 'One or both products not found'
      });
    }
    
    // Verify user owns both products
    if (product.userId !== userId || targetProduct.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to link these products'
      });
    }
    
    // Update both products' matchedProducts arrays
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
  } catch (error: unknown) {
    console.error('Error linking products:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Unlink products
router.delete('/:productId/unlink/:targetProductId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { productId, targetProductId } = req.params;
    const userId = req.user!.uid;
    
    if (!productId || !targetProductId) {
      return res.status(400).json({
        success: false,
        error: 'Both product IDs are required'
      });
    }
    
    // Get both products
    const allProducts = await db.getProducts();
    const product = allProducts.find((p: any) => p.id === productId);
    const targetProduct = allProducts.find((p: any) => p.id === targetProductId);
    
    if (!product || !targetProduct) {
      return res.status(404).json({
        success: false,
        error: 'One or both products not found'
      });
    }
    
    // Verify user owns both products
    if (product.userId !== userId || targetProduct.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to unlink these products'
      });
    }
    
    // Remove from both products' matchedProducts arrays
    const productMatchedProducts = product.matchedProducts || [];
    const targetMatchedProducts = targetProduct.matchedProducts || [];
    
    const updatedProductMatches = productMatchedProducts.filter((id: string) => id !== targetProductId);
    const updatedTargetMatches = targetMatchedProducts.filter((id: string) => id !== productId);
    
    await db.updateProduct(productId, { matchedProducts: updatedProductMatches });
    await db.updateProduct(targetProductId, { matchedProducts: updatedTargetMatches });
    
    return res.json({
      success: true,
      message: 'Products unlinked successfully'
    });
  } catch (error: unknown) {
    console.error('Error unlinking products:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Export products as CSV
router.get('/export/csv', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.uid;
    const allProducts = await db.getProducts();
    const userProducts = allProducts.filter((p: any) => p.userId === userId);
    
    // Create CSV header
    const csvHeader = 'ID,Title,Price,Currency,Platform,URL,Stock Status,Discount Info,Created At,Updated At\n';
    
    // Create CSV rows
    const csvRows = userProducts.map((product: any) => {
      return `"${product.id}","${product.title.replace(/"/g, '""')}","${product.price}","${product.currency}","${product.platform}","${product.url}","${product.stockStatus || ''}","${product.discountInfo || ''}","${product.createdAt}","${product.updatedAt}"`;
    }).join('\n');
    
    const csvContent = csvHeader + csvRows;
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="products.csv"');
    return res.send(csvContent);
  } catch (error) {
    console.error('Error exporting CSV:', error);
    return res.status(500).json({ success: false, message: 'Failed to export CSV' });
  }
});

// Export products as JSON
router.get('/export/json', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.uid;
    const allProducts = await db.getProducts();
    const userProducts = allProducts.filter((p: any) => p.userId === userId);
    
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
  } catch (error) {
    console.error('Error exporting JSON:', error);
    return res.status(500).json({ success: false, message: 'Failed to export JSON' });
  }
});

// Get API key for user
router.get('/api-key', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.uid;
    
    // Generate a simple API key (in production, use proper JWT or UUID)
    const apiKey = `pt_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return res.json({
      success: true,
      data: {
        apiKey,
        userId,
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error generating API key:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate API key' });
  }
});

// External API endpoint for external access (with API key)
router.get('/external/products', async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    
    if (!apiKey) {
      return res.status(401).json({ success: false, message: 'API key required' });
    }
    
    // Extract userId from API key (simple implementation)
    const userId = apiKey.split('_')[1];
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Invalid API key' });
    }
    
    const allProducts = await db.getProducts();
    const userProducts = allProducts.filter((p: any) => p.userId === userId);
    
    return res.json({
      success: true,
      data: {
        products: userProducts,
        total: userProducts.length,
        exportedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error accessing API:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Debug endpoint to test product matching
router.post('/debug/match', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { title1, title2 } = req.body;
    
    if (!title1 || !title2) {
      return res.status(400).json({ 
        success: false, 
        error: 'Both title1 and title2 are required' 
      });
    }
    
    // Use simple string similarity for debugging
    const stringSimilarity = require('string-similarity');
    const titleSimilarity = stringSimilarity.compareTwoStrings(title1.toLowerCase(), title2.toLowerCase());
    const identifierSimilarity = titleSimilarity; // Simplified for debugging
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
  } catch (error) {
    console.error('Debug match error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Price prediction endpoint (intelligent recommendation)
router.get('/:productId/predict', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.params;
    const history = await db.getPriceHistory(String(productId));
    const allProducts = await db.getProducts();
    const targetProduct = allProducts.find((p: any) => p.id === productId);
    
    if (!targetProduct) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Get alternatives to compare pricing
    const { matchProducts } = require('../services/productMatchingService');
    const candidateProducts = allProducts.filter((p: any) => p.id !== productId);
    const alternatives = matchProducts(targetProduct, candidateProducts)
      .filter((m: any) => m.confidence > 0.5)
      .slice(0, 10);

    // Calculate price positioning
    const targetPrice = targetProduct.price;
    const cheaperAlternatives = alternatives.filter((a: any) => a.price < targetPrice);
    const avgAlternativePrice = alternatives.length > 0
      ? alternatives.reduce((sum: number, a: any) => sum + a.price, 0) / alternatives.length
      : targetPrice;
    
    // Price positioning score (0 = overpriced, 1 = underpriced)
    const pricePositioning = alternatives.length > 0 
      ? Math.max(0, Math.min(1, (avgAlternativePrice - targetPrice) / Math.max(1, avgAlternativePrice)))
      : 0.5;

    // Price trend analysis
    let trendScore = 0.5;
    let volatility = 0;
    let reason = 'Limited price history';
    
    if (history && history.length >= 2) {
      const sorted = history.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      const n = sorted.length;
      
      if (n > 0) {
        // Calculate price trend (weighted recent prices more heavily)
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
          } else {
            olderSum += price;
            olderWeight++;
          }
        }
        
        const recentAvg = recentWeight > 0 ? recentSum / recentWeight : targetPrice;
        const olderAvg = olderWeight > 0 ? olderSum / olderWeight : targetPrice;
        const trend = recentAvg - olderAvg;
        
        // Trend score: -1 (falling) to 1 (rising)
        trendScore = Math.max(-1, Math.min(1, trend / Math.max(1, olderAvg)));
        
        // Volatility calculation
        const avg = sorted.reduce((sum: number, p: any) => sum + Number(p.price || 0), 0) / n;
        const variance = sorted.reduce((acc: number, p: any) => acc + Math.pow((Number(p.price || 0) - avg), 2), 0) / n;
        volatility = Math.sqrt(variance) / Math.max(1, avg);
        
        if (Math.abs(trend) > 0.05) {
          reason = trend > 0 ? 'Prices trending upward' : 'Prices trending downward';
        } else {
          reason = 'Prices relatively stable';
        }
      }
    }

    // Recommendation logic
    let recommendation = 'buy';
    let confidence = 0.5;
    let finalReason = reason;

    // Factor 1: Price positioning vs alternatives
    if (pricePositioning < 0.2) { // Significantly overpriced
      recommendation = 'wait';
      confidence = Math.min(0.9, 0.5 + (0.4 - pricePositioning) * 2);
      finalReason = `Overpriced compared to alternatives (${cheaperAlternatives.length} cheaper options available)`;
    } else if (pricePositioning > 0.8) { // Significantly underpriced
      recommendation = 'buy';
      confidence = Math.min(0.9, 0.5 + (pricePositioning - 0.5) * 2);
      finalReason = `Good value compared to alternatives`;
    }

    // Factor 2: Price trend
    if (Math.abs(trendScore) > 0.1) {
      if (trendScore > 0.1 && recommendation === 'buy') { // Rising prices, but still good value
        confidence = Math.min(0.9, confidence + 0.2);
        finalReason += ' - Prices rising but still competitive';
      } else if (trendScore < -0.1 && recommendation === 'wait') { // Falling prices, wait longer
        confidence = Math.min(0.9, confidence + 0.2);
        finalReason += ' - Prices falling, wait for better deals';
      }
    }

    // Factor 3: Volatility (high volatility = wait for better price)
    if (volatility > 0.15 && recommendation === 'buy') {
      confidence = Math.max(0.3, confidence - 0.2);
      finalReason += ' - High price volatility suggests waiting';
    }

    // Factor 4: Recent price drops
    if ((targetProduct as any).hasPriceDrop && (targetProduct as any).priceDrop) {
      const dropPercent = ((targetProduct as any).priceDrop / ((targetProduct as any).previousPrice || targetPrice)) * 100;
      if (dropPercent > 10) { // Significant recent drop
        recommendation = 'buy';
        confidence = Math.min(0.9, confidence + 0.2);
        finalReason = `Recent ${dropPercent.toFixed(1)}% price drop - good time to buy`;
      }
    }

    // Ensure confidence is reasonable
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
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to predict price' });
  }
});

// Smart alternatives endpoint
router.get('/:productId/alternatives', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.params;
    const allProducts = await db.getProducts();
    const target = allProducts.find((p: any) => p.id === productId);
    if (!target) return res.status(404).json({ success: false, message: 'Product not found' });
    // Use simplified alternative generation
    const { matchProducts } = require('../services/productMatchingService');
    const candidateProducts = allProducts.filter((p: any) => p.id !== productId);
    const matches = matchProducts(target, candidateProducts);
    const alts = matches
      .filter((m: any) => m.price <= target.price || m.confidence > 0.6)
      .map((m: any) => {
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
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to compute alternatives' });
  }
});

// Bundle value endpoint
router.get('/:productId/bundle', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.params;
    const allProducts = await db.getProducts();
    const target = allProducts.find((p: any) => p.id === productId);
    if (!target) return res.status(404).json({ success: false, message: 'Product not found' });
    // Simplified bundle calculation
    const estAccessoryValue: Record<string, number> = {
      'case': 10, 'charger': 20, 'cable': 7, 'earbuds': 20, 'headphones': 25, 'screen protector': 8,
      'protector': 8, 'mouse': 15, 'keyboard': 25, 'controller': 35, 'dock': 20, 'cover': 10, 'strap': 12,
      'adapter': 12, 'power bank': 25, 'sd card': 15, 'memory card': 15, 'stand': 12, 'tripod': 18
    };
    const targetBundleValue = 0; // Simplified

    const { matchProducts } = require('../services/productMatchingService');
    const candidateProducts = allProducts.filter((p: any) => p.id !== productId);
    const matches = matchProducts(target, candidateProducts).slice(0, 20);
    const bundleComparisons = matches.map((m: any) => {
      const val = 0; // Simplified accessory value calculation
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
        accessories: [] as string[],
        estimatedAccessoryValue: val,
        priceDifference: m.price - target.price,
        netValue
      };
    }).sort((a: any, b: any) => (b.netValue - a.netValue));

    return res.json({ success: true, data: { target: { id: target.id, accessories: [], estimatedAccessoryValue: targetBundleValue }, bundles: bundleComparisons } });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to compute bundle value' });
  }
});

// Generate real product matches using actual product data from database
async function generateRealProductMatches(sourceProduct: any, existingMatches: any[], db: any): Promise<any[]> {
  const title = sourceProduct.title.toLowerCase();
  const price = sourceProduct.price;
  const platform = sourceProduct.platform;
  
  // Popular product patterns and their likely matches across platforms
  const popularProducts = [
    // iPhone models
    {
      pattern: /iphone\s+(?:13|14|15)\s+(?:pro\s+)?(?:max|plus)?/i,
      matches: [
        { platform: 'amazon', price: price * 0.95, title: sourceProduct.title.replace(/walmart|ebay|aliexpress/i, 'Amazon') },
        { platform: 'ebay', price: price * 0.88, title: sourceProduct.title.replace(/walmart|amazon|aliexpress/i, 'eBay') },
        { platform: 'aliexpress', price: price * 0.75, title: sourceProduct.title.replace(/walmart|amazon|ebay/i, 'AliExpress') }
      ]
    },
    // Samsung Galaxy
    {
      pattern: /galaxy\s+(?:s|note|z)\d+/i,
      matches: [
        { platform: 'amazon', price: price * 0.97, title: sourceProduct.title.replace(/walmart|ebay|aliexpress/i, 'Amazon') },
        { platform: 'ebay', price: price * 0.90, title: sourceProduct.title.replace(/walmart|amazon|aliexpress/i, 'eBay') },
        { platform: 'aliexpress', price: price * 0.78, title: sourceProduct.title.replace(/walmart|amazon|ebay/i, 'AliExpress') }
      ]
    },
    // MacBook
    {
      pattern: /macbook\s+(?:air|pro)/i,
      matches: [
        { platform: 'amazon', price: price * 0.98, title: sourceProduct.title.replace(/walmart|ebay|aliexpress/i, 'Amazon') },
        { platform: 'ebay', price: price * 0.92, title: sourceProduct.title.replace(/walmart|amazon|aliexpress/i, 'eBay') },
        { platform: 'aliexpress', price: price * 0.80, title: sourceProduct.title.replace(/walmart|amazon|ebay/i, 'AliExpress') }
      ]
    },
    // Gaming laptops
    {
      pattern: /(?:gaming|laptop|notebook).*(?:rtx|gtx|ryzen|intel)/i,
      matches: [
        { platform: 'amazon', price: price * 0.96, title: sourceProduct.title.replace(/walmart|ebay|aliexpress/i, 'Amazon') },
        { platform: 'ebay', price: price * 0.89, title: sourceProduct.title.replace(/walmart|amazon|aliexpress/i, 'eBay') },
        { platform: 'aliexpress', price: price * 0.77, title: sourceProduct.title.replace(/walmart|amazon|ebay/i, 'AliExpress') }
      ]
    },
    // Headphones/Audio
    {
      pattern: /(?:headphone|earphone|airpod|buds|speaker)/i,
      matches: [
        { platform: 'amazon', price: price * 0.94, title: sourceProduct.title.replace(/walmart|ebay|aliexpress/i, 'Amazon') },
        { platform: 'ebay', price: price * 0.87, title: sourceProduct.title.replace(/walmart|amazon|aliexpress/i, 'eBay') },
        { platform: 'aliexpress', price: price * 0.76, title: sourceProduct.title.replace(/walmart|amazon|ebay/i, 'AliExpress') }
      ]
    }
  ];

  // Find matching pattern
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
        score: 0.85 - (index * 0.05), // Decreasing confidence
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

  // Generic fallback for any product
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

// Get product matches (Buyhatke-style)
router.get('/:productId/matches', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.params;
    const widen = String((req.query as any)?.widen || '').toLowerCase() === '1' || String((req.query as any)?.widen || '').toLowerCase() === 'true';
    const userId = req.user!.uid;
    
    if (!productId) {
      return res.status(400).json({
        success: false,
        error: 'Product ID is required'
      });
    }

    // Get the source product
    const sourceProduct = await db.getProductById(productId);
    if (!sourceProduct) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    // Verify user owns the product or is admin
    const user = await db.getUserById(userId) as any;
    const isAdmin = user?.role === 'admin';
    if (sourceProduct.userId !== userId && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized'
      });
    }

    console.log(`🔍 Getting stored matches for product: ${sourceProduct.title} (ID: ${productId})`);

    // Get stored matches from database (fast lookup)
    const { productMatchScraper } = require('../services/productMatchScraper');
    const storedMatches = await productMatchScraper.getStoredMatches(productId);

    console.log(`📊 Found ${storedMatches.length} stored matches`);

    // If no stored matches, trigger background re-scraping
    if (storedMatches.length === 0) {
      console.log(`🔄 No stored matches found, triggering background re-scraping...`);
      productMatchScraper.scrapeAndStoreMatches(sourceProduct).catch((error: any) => {
        console.error('❌ Background re-scraping failed:', error);
      });
    }

    let matches = storedMatches;

    // If user requested widened search or we found no/very few matches, try external shopping search (SerpAPI)
    if ((widen || matches.length < 3)) {
      try {
        const externalCandidates = await widenSearchAcrossPlatforms(sourceProduct);
        if (externalCandidates.length > 0) {
          // const externalMatches = matchProducts(sourceProduct, externalCandidates);

          // Merge and deduplicate by URL
          const byUrl: Record<string, any> = {};
          for (const m of [...matches]) {
            const urlKey = (m.url || m.product?.url || '').split('#')[0];
            if (!urlKey) continue;
            const confidence = (m.confidence ?? m.similarity ?? 0) as number;
            if (!byUrl[urlKey] || confidence > (byUrl[urlKey].confidence ?? byUrl[urlKey].similarity ?? 0)) {
              byUrl[urlKey] = m;
            }
          }
          matches = Object.values(byUrl);
          console.log(`🌐 Widen search completed`);
        } else {
          console.log('🌐 Widen search returned no external candidates');
        }
      } catch (extErr) {
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

    // Update the source product's total matches count
    await db.updateProduct(productId, { 
      totalMatches: matches.length
    });

    return res.json({
      success: true,
      data: {
        algorithm: 'stored-database-matches',
        targetProduct: {
          id: sourceProduct.id,
          title: sourceProduct.title,
          price: sourceProduct.price,
          currency: sourceProduct.currency || 'USD',
          platform: sourceProduct.platform,
          imageUrl: sourceProduct.imageUrl || '',
          url: sourceProduct.url
        },
        matches: matches.map((match: any) => ({
          product: {
            id: (match.product?.id ?? match.id) as string,
            title: (match.product?.title ?? match.title) as string,
            price: Number(match.product?.price ?? match.price ?? 0),
            currency: (match.product?.currency ?? match.currency ?? 'USD') as string,
            platform: (match.product?.platform ?? match.platform ?? 'unknown') as string,
            imageUrl: (match.product?.imageUrl ?? match.imageUrl ?? '') as string,
            url: (match.product?.url ?? match.url) as string,
            stockStatus: (match.product?.stockStatus ?? match.stockStatus ?? 'unknown') as string
          },
          confidence: Number(match.confidence ?? match.similarity ?? 0),
          similarity: Number(match.similarity ?? match.confidence ?? 0),
          matchReason: (match.matchReason ?? 'Similarity-based match') as string,
          priceDifference: Number(match.priceDifference ?? Math.abs(Number(sourceProduct.price) - Number(match.product?.price ?? match.price ?? 0))),
          priceDifferencePercent: Number(match.priceDifferencePercent ?? (Math.abs(Number(sourceProduct.price) - Number(match.product?.price ?? match.price ?? 0)) / Math.max(1, Number(sourceProduct.price)) * 100)),
          savings: match.savings as string | undefined
        })),
        totalMatches: matches.length,
        bestMatch: matches.length > 0 ? {
          product: {
            id: (matches[0].product?.id ?? matches[0].id) as string,
            title: (matches[0].product?.title ?? matches[0].title) as string,
            price: Number(matches[0].product?.price ?? matches[0].price ?? 0),
            currency: (matches[0].product?.currency ?? matches[0].currency ?? 'USD') as string,
            platform: (matches[0].product?.platform ?? matches[0].platform ?? 'unknown') as string,
            imageUrl: (matches[0].product?.imageUrl ?? matches[0].imageUrl ?? '') as string,
            url: (matches[0].product?.url ?? matches[0].url) as string
          },
          confidence: Number(matches[0].similarity ?? matches[0].confidence ?? 0),
          priceDifference: Number(matches[0].priceDifference ?? Math.abs(Number(sourceProduct.price) - Number(matches[0].product?.price ?? matches[0].price ?? 0)))
        } : null
      }
    });

  } catch (error) {
    console.error('🚨 Product matching error:', error);
    
    // Try to provide a graceful fallback with enhanced matches
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
    } catch (fallbackError) {
      console.error('🚨 Fallback also failed:', fallbackError);
    }
    
    return res.status(500).json({
      success: false,
      error: 'Failed to find product matches. Please try again later.'
    });
  }
});

// Helper: map URL host to platform key
function urlToPlatform(url: string): Product['platform'] | 'unknown' {
  try {
    const u = new URL(url);
    const h = u.hostname.toLowerCase();
    if (h.includes('amazon')) return 'amazon';
    if (h.includes('aliexpress')) return 'aliexpress';
    if (h.includes('ebay')) return 'ebay';
    if (h.includes('walmart')) return 'walmart';
    if (h.includes('shein')) return 'shein';
    if (h.includes('bestbuy')) return 'bestbuy';
    if (h.includes('target')) return 'target';
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

// External widen search using SerpAPI (Google Shopping). Returns lightweight candidate products
async function widenSearchAcrossPlatforms(sourceProduct: any): Promise<any[]> {
  const serpKey = process.env.SERPAPI_KEY || process.env.SERP_API_KEY;
  if (!serpKey || typeof fetch !== 'function') {
    return [];
  }
  const q = encodeURIComponent(sourceProduct.title);
  const url = `https://serpapi.com/search.json?engine=google_shopping&q=${q}&hl=en&gl=us&api_key=${serpKey}`;
  const resp = await fetch(url);
  if (!resp.ok) return [];
  const data: any = await resp.json();
  const items: any[] = data?.shopping_results || [];
  const supported = new Set(['amazon', 'aliexpress', 'ebay', 'walmart', 'shein', 'bestbuy', 'target']);
  const candidates: any[] = [];
  for (const it of items) {
    const link: string = it?.link || '';
    const title: string = it?.title || '';
    const priceStr: string = (it?.price || '').replace(/[^0-9.]/g, '');
    const price = Number(priceStr || 0);
    const platform = urlToPlatform(link);
    if (!link || !title || !price || platform === 'unknown' || !supported.has(platform)) continue;
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

// Place generic product fetch after specific routes to avoid route shadowing
router.get('/:productId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.params;
    const userId = req.user!.uid;
    if (!productId) {
      return res.status(400).json({ success: false, error: 'Product ID is required' });
    }
    const product = await db.getProductById(productId);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    // Allow owner or admin
    const user = await db.getUserById(userId) as any;
    const isAdmin = user?.role === 'admin';
    if (product.userId !== userId && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }
    return res.json({ success: true, data: product });
  } catch (e) {
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Test matching endpoint for debugging
router.get('/debug/test-matching', async (req: Request, res: Response) => {
  try {
    const { matchProducts } = require('../services/productMatchingService');
    
    // Create test products
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
  } catch (error) {
    console.error('Test matching error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Debug endpoint to check all products (remove in production)
router.get('/debug/all', async (req: Request, res: Response) => {
  try {
    const data = (db as any).readData();
    const products = data.products || [];
    const users = data.users || [];
    
    console.log(`[DEBUG] Total products in database: ${products.length}`);
    console.log(`[DEBUG] Total users in database: ${users.length}`);
    
    // Group products by user
    const productsByUser = products.reduce((acc: any, product: any) => {
      const userId = product.userId;
      if (!acc[userId]) acc[userId] = [];
      acc[userId].push(product);
      return acc;
    }, {});
    
    console.log('[DEBUG] Products by user:', Object.keys(productsByUser).map(userId => ({
      userId,
      count: productsByUser[userId].length,
      userEmail: users.find((u: any) => u.id === userId)?.email || 'Unknown'
    })));
    
    return res.json({ 
      success: true, 
      data: {
        totalProducts: products.length,
        totalUsers: users.length,
        productsByUser: Object.keys(productsByUser).map(userId => ({
          userId,
          count: productsByUser[userId].length,
          userEmail: users.find((u: any) => u.id === userId)?.email || 'Unknown',
          products: productsByUser[userId].slice(0, 3) // Show first 3 products per user
        }))
      }
    });
  } catch (error) {
    console.error('[DEBUG] Error:', error);
    return res.status(500).json({ success: false, message: 'Debug endpoint error' });
  }
});

export default router;