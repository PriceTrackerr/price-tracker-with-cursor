import { getDb } from '../config/database';
import { matchProducts } from './productMatchingService';

/**
 * Pre-scrape and store product matches when a product is tracked
 * This mimics BuyHatke's approach - store matches in database instead of live scraping
 */
export class ProductMatchScraper {
  private db: any;

  constructor() {
    this.db = getDb();
  }

  /**
   * Find and store matches for a newly tracked product
   */
  async scrapeAndStoreMatches(sourceProduct: any): Promise<void> {
    try {
      console.log(`🔍 Pre-scraping matches for: ${sourceProduct.title}`);
      
      // Get all existing products as candidates
      const allProducts = await this.db.getProducts();
      const candidateProducts = allProducts.filter((p: any) => p.id !== sourceProduct.id);
      
      console.log(`📊 Found ${candidateProducts.length} candidate products for matching`);
      
      if (candidateProducts.length === 0) {
        console.log('⚠️ No candidate products found for matching');
        return;
      }

      // Find matches using the existing matching service
      const matches = matchProducts(sourceProduct, candidateProducts);
      
      console.log(`🎯 Found ${matches.length} matches for ${sourceProduct.title}`);
      
      // Clear existing matches for this product
      await this.db.deleteProductMatches(sourceProduct.id);
      
      // Store new matches in database
      let storedCount = 0;
      for (const match of matches) {
        try {
          await this.db.addProductMatch({
            sourceProductId: sourceProduct.id,
            matchedProductId: match.product.id,
            confidence: match.confidence || match.score || 0.5,
            similarity: (match as any).similarity || 0.5,
            matchReason: match.matchReason || 'Product similarity match',
            priceDifference: match.priceDifference || 0,
            priceDifferencePercent: match.priceDifferencePercent || 0,
            savings: match.savings || 'No savings'
          });
          storedCount++;
        } catch (error) {
          console.error(`❌ Failed to store match for ${match.product.title}:`, error);
        }
      }
      
      console.log(`✅ Stored ${storedCount} matches for ${sourceProduct.title}`);
      
      // Update product's totalMatches count
      await this.db.updateProduct(sourceProduct.id, { totalMatches: storedCount });
      
    } catch (error) {
      console.error('❌ Error scraping and storing matches:', error);
    }
  }

  /**
   * Re-scrape matches for all products (for maintenance)
   */
  async rescrapeAllMatches(): Promise<void> {
    try {
      console.log('🔄 Starting full re-scrape of all product matches...');
      
      const allProducts = await this.db.getProducts();
      console.log(`📊 Found ${allProducts.length} products to re-scrape`);
      
      for (const product of allProducts) {
        await this.scrapeAndStoreMatches(product);
        // Add small delay to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      console.log('✅ Completed full re-scrape of all product matches');
    } catch (error) {
      console.error('❌ Error during full re-scrape:', error);
    }
  }

  /**
   * Get stored matches for a product (fast database lookup)
   */
  async getStoredMatches(sourceProductId: string): Promise<any[]> {
    try {
      const matches = await this.db.getProductMatches(sourceProductId);
      
      // Enrich matches with full product data
      const enrichedMatches = [];
      for (const match of matches) {
        const matchedProduct = await this.db.getProductById(match.matchedProductId);
        if (matchedProduct) {
          enrichedMatches.push({
            product: {
              id: matchedProduct.id,
              title: matchedProduct.title,
              price: matchedProduct.price,
              currency: matchedProduct.currency || 'USD',
              platform: matchedProduct.platform,
              imageUrl: matchedProduct.imageUrl || '',
              url: matchedProduct.url || '',
              stockStatus: matchedProduct.stockStatus || 'unknown'
            },
            confidence: match.confidence,
            similarity: match.similarity,
            matchReason: match.matchReason,
            priceDifference: match.priceDifference,
            priceDifferencePercent: match.priceDifferencePercent,
            savings: match.savings
          });
        }
      }
      
      return enrichedMatches;
    } catch (error) {
      console.error('❌ Error getting stored matches:', error);
      return [];
    }
  }
}

export const productMatchScraper = new ProductMatchScraper();
