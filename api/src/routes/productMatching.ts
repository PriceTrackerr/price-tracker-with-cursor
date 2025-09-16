import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { getDb } from '../config/database';

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