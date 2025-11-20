import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { getDb } from '../config/database';
import { supabase, TABLES } from '../config/supabase';
import { realProductSearch } from '../services/realProductSearch';

// Type definitions for product matching
interface ProductMatch {
  product: {
    id: string;
    title: string;
    price: number;
    currency: string;
    platform: string;
    imageUrl: string;
    url: string;
    stockStatus?: string;
  };
  confidence: number;
  matchReason: string;
  priceDifference: number;
  priceDifferencePercent: number;
  savings: string;
}

// Import the service directly
import { matchProducts } from '../services/productMatchingService';
import type { Product } from '../config/storage';

const router = express.Router();

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

function generateProductKey(title: string): string {
  if (!title) return '';
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

/**
 * Global product matches cache shared across all users
 * GET /api/product-matching/global-product-matches?tracked_id=<uuid>
 */
router.get('/global-product-matches', async (req: Request, res: Response) => {
  const trackedId = (req.query.tracked_id || req.query.trackedId) as string | undefined;
  if (!trackedId) {
    return res.status(400).json({ success: false, error: 'tracked_id query param is required' });
  }

  if (!supabase) {
    console.error('❌ Supabase client not configured');
    return res.status(500).json({ success: false, error: 'Server configuration error' });
  }

  try {
    console.log(`🔍 Global match lookup for tracked_id=${trackedId}`);

    const { data: trackedProduct, error: trackedError } = await supabase
      .from(TABLES.PRODUCTS || 'products')
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

    const { data: cached, error: cacheError } = await supabase
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

    console.log(`🌐 Cache miss for key=${productKey}, calling Serper...`);
    const serperResults = await realProductSearch.searchProducts(rawTitle, 21);

    if (!serperResults || serperResults.length === 0) {
      console.warn(`⚠️ Serper returned no results for key=${productKey}`);
      return res.status(500).json({ success: false, error: 'No matches found from external provider' });
    }

    const matches = serperResults.map((item: any, index: number) => ({
      id: item.id || `global_match_${Date.now()}_${index}`,
      title: item.title || rawTitle,
      price: item.price || 0,
      currency: item.currency || 'USD',
      platform: item.platform || 'other',
      imageUrl: item.imageUrl || '',
      url: item.url || ''
    }));

    const matchCount = matches.length;

    const { error: upsertError } = await supabase
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

    console.log(`✅ Stored ${matchCount} matches for key=${productKey}`);
    return res.json({
      success: true,
      data: {
        matches,
        count: matchCount,
        cached: false
      }
    });
  } catch (error: any) {
    console.error('❌ Global product matches error:', error);
    const message = error?.message || 'Unexpected error';
    return res.status(500).json({ success: false, error: message });
  }
});

/**
 * Find product matches across all platforms
 * POST /api/product-matching/find-matches
 */
router.post('/find-matches', [
  body('productId').isString().notEmpty().withMessage('Product ID is required'),
  body('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1 and 20')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { productId, limit = 10 } = req.body;
    const db = getDb();

    // Get the source product
    const sourceProduct = await db.getProductById(productId);
    if (!sourceProduct) {
      return res.status(404).json({
        success: false,
        message: 'Source product not found'
      });
    }

    console.log(`🔍 Finding matches for product: ${sourceProduct.title}`);

    // Get all products for matching
    const allProducts = await db.getProducts();
    const candidateProducts = allProducts.filter((p: any) => p.id !== sourceProduct.id);

    // Find matches using the consolidated service
    const matches = matchProducts(sourceProduct, candidateProducts);

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
        matches: matches.map((match: any) => ({
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

  } catch (error) {
    console.error('Product matching error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to find product matches',
      error: error.message
    });
  }
});

/**
 * Find matches by URL (for browser extension)
 * POST /api/product-matching/find-matches-by-url
 */
router.post('/find-matches-by-url', [
  body('url').isURL().withMessage('Valid URL is required'),
  body('title').optional().isString().withMessage('Title must be a string'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1 and 20')
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { url, title, price, limit = 10 } = req.body;
    const db = getDb();

    // Create a temporary product object for matching
    const tempProduct: any = {
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

    // Get all products for matching
    const allProducts = await db.getProducts();
    const candidateProducts = allProducts; // Use all products for URL-based matching

    // Find matches using the consolidated service
    const matches = matchProducts(tempProduct, candidateProducts);

    res.json({
      success: true,
      data: {
        sourceUrl: url,
        sourceTitle: title,
        sourcePrice: price,
        matches: matches.map((match: any) => ({
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

  } catch (error) {
    console.error('URL-based matching error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to find product matches',
      error: error.message
    });
  }
});

/**
 * Get matching statistics
 * GET /api/product-matching/stats
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const db = getDb();
    const allProducts = await db.getProducts();
    let totalMatches = 0;
    let productsWithMatches = 0;
    const platformStats: Record<string, number> = {};

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
        averageConfidence: 0.75, // Default average confidence
        matchDistribution: platformStats,
        recentMatches: [],
        totalProducts: allProducts.length,
        productsWithMatches
      }
    });

  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get matching statistics',
      error: error.message
    });
  }
});

/**
 * Test product matching with sample data
 * POST /api/product-matching/test
 */
router.post('/test', async (req: Request, res: Response) => {
  try {
    const db = getDb();

    // Sample product for testing
    const sampleProduct: any = {
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

    // Get all products for matching
    const allProducts = await db.getProducts();

    // Find matches using the consolidated service
    const matches = matchProducts(sampleProduct, allProducts);

    res.json({
      success: true,
      data: {
        testProduct: sampleProduct,
        matches: matches.map((match: any) => ({
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

  } catch (error) {
    console.error('Test matching error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test product matching',
      error: error.message
    });
  }
});

export default router; 