import { getDb } from '../config/database';
import { matchProducts } from './productMatchingService';
import { realProductSearch } from './realProductSearch';

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
   * Find and store matches for a newly tracked product using real product search
   */
  async scrapeAndStoreMatches(sourceProduct: any): Promise<void> {
    try {
      console.log(`🔍 Pre-scraping real product matches for: ${sourceProduct.title}`);
      
      // Extract search term from product title
      const searchTerm = this.extractSearchTerm(sourceProduct.title);
      console.log(`🔍 Search term extracted: "${searchTerm}"`);
      
      // Search for real products across platforms
      const realProducts = await realProductSearch.searchProducts(searchTerm, 21);
      console.log(`🌐 Found ${realProducts.length} real products across platforms`);
      
      // Also get existing database products for comparison
      const allProducts = await this.db.getProducts();
      const candidateProducts = allProducts.filter((p: any) => p.id !== sourceProduct.id);
      
      // Combine real products with database products
      const allCandidates = [...realProducts, ...candidateProducts];
      console.log(`📊 Total candidates: ${allCandidates.length} (${realProducts.length} real + ${candidateProducts.length} database)`);
      
      if (allCandidates.length === 0) {
        console.log('⚠️ No candidate products found for matching');
        return;
      }

      // Find matches using the existing matching service
      const matches = matchProducts(sourceProduct, allCandidates);
      
      console.log(`🎯 Found ${matches.length} matches for ${sourceProduct.title}`);
      
      // Clear existing matches for this product
      await this.db.deleteProductMatches(sourceProduct.id);
      
      // Store new matches in database
      let storedCount = 0;
      for (const match of matches) {
        try {
          // For real products, we need to create a temporary ID
          const matchedProductId = match.product.id.startsWith('temp_') ? 
            `real_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` : 
            match.product.id;
            
          await this.db.addProductMatch({
            sourceProductId: sourceProduct.id,
            matchedProductId: matchedProductId,
            confidence: match.confidence || match.score || 0.5,
            similarity: (match as any).similarity || 0.5,
            matchReason: match.matchReason || 'Real product match from platform search',
            priceDifference: match.priceDifference || 0,
            priceDifferencePercent: match.priceDifferencePercent || 0,
            savings: match.savings || 'No savings'
          });
          storedCount++;
        } catch (error) {
          console.error(`❌ Failed to store match for ${match.product.title}:`, error);
        }
      }
      
      console.log(`✅ Stored ${storedCount} real product matches for ${sourceProduct.title}`);
      // Skip updating totalMatches to avoid schema/version issues
      
    } catch (error) {
      console.error('❌ Error scraping and storing real product matches:', error);
    }
  }

  /**
   * Extract search term from product title
   */
  private extractSearchTerm(title: string): string {
    // Remove common words and extract the main product name
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'among', 'under', 'over', 'around', 'near', 'far', 'here', 'there', 'where', 'when', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'can', 'will', 'just', 'should', 'now'];
    
    const words = title.toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.includes(word))
      .slice(0, 3); // Take first 3 meaningful words
    
    return words.join(' ');
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
        let matchedProduct;
        
        // Check if it's a real product (stored with real_ prefix)
        if (match.matchedProductId.startsWith('real_')) {
          // For real products, we need to regenerate the product data
          // This is a simplified approach - in production you'd store more product data
          matchedProduct = {
            id: match.matchedProductId,
            title: `Real Product Match (${match.matchedProductId})`,
            price: 0, // Would be stored in match data
            currency: 'USD',
            platform: 'unknown',
            imageUrl: '',
            url: `https://example.com/product/${match.matchedProductId}`,
            stockStatus: 'unknown'
          };
        } else {
          // Regular database product
          matchedProduct = await this.db.getProductById(match.matchedProductId);
        }
        
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
