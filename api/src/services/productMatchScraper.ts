import { getDb } from '../config/database';
import { matchProducts } from './productMatchingService';

export class ProductMatchScraper {
  private db: any;
  private serperApiKey: string;

  constructor() {
    this.db = getDb();
    this.serperApiKey = process.env.SERPER_API_KEY || '';
  }

  /**
   * 🔍 Main logic — Search real matches via Serper (Google Shopping) and store in Supabase
   */
  async scrapeAndStoreMatches(sourceProduct: any): Promise<void> {
    try {
      console.log(`🔍 Pre-scraping real product matches for: ${sourceProduct.title}`);

      const searchTerm = this.extractSearchTerm(sourceProduct.title);
      console.log(`🔍 Extracted search term: "${searchTerm}"`);

      // Fetch results from Serper
      const realProducts = await this.fetchFromSerper(searchTerm);
      console.log(`🌐 Found ${realProducts.length} results from Serper`);

      const allProducts = await this.db.getProducts();
      const candidateProducts = allProducts.filter((p: any) => p.id !== sourceProduct.id);
      const allCandidates = [...realProducts, ...candidateProducts];

      if (allCandidates.length === 0) {
        console.log('⚠️ No candidates found for matching');
        return;
      }

      const matches = matchProducts(sourceProduct, allCandidates);
      console.log(`🎯 Found ${matches.length} matches for ${sourceProduct.title}`);

      await this.db.deleteProductMatches(sourceProduct.id);

      let storedCount = 0;
      for (const match of matches) {
        try {
          const matchedProduct = match.product;
          // Normalize platform to lowercase expected by DB/API
          if (matchedProduct && matchedProduct.platform) {
            matchedProduct.platform = String(matchedProduct.platform).toLowerCase();
          }

          if (String(sourceProduct.id).startsWith('query-')) continue; // skip synthetic ids
          const matchedProductId = matchedProduct.id.startsWith('temp_')
            ? `real_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
            : matchedProduct.id;

          const confidence = typeof (match as any).confidence === 'number'
            ? (match as any).confidence
            : (typeof (match as any).score === 'number' ? (match as any).score : 0.7);
          const similarity = typeof (match as any).similarity === 'number'
            ? (match as any).similarity
            : confidence;

          // 🧩 Save to Supabase "product_matches" table
          await this.db.addProductMatch({
            sourceProductId: sourceProduct.id,
            matchedProductId,
            confidence,
            similarity,
            matchReason: match.matchReason || 'Serper match',
            priceDifference: match.priceDifference || 0,
            priceDifferencePercent: match.priceDifferencePercent || 0,
            savings: match.savings || 'N/A',
          });

          storedCount++;
        } catch (error) {
          console.error(`❌ Failed to store match for ${match.product?.title}:`, error);
        }
      }

      console.log(`✅ Stored ${storedCount} product matches for ${sourceProduct.title}`);
    } catch (error) {
      console.error('❌ Error scraping and storing real product matches:', error);
    }
  }

  /**
   * 🔍 Fetch real shopping products from Serper API
   */
  private async fetchFromSerper(query: string): Promise<any[]> {
    try {
      if (!this.serperApiKey) {
        throw new Error('Missing SERPER_API_KEY in environment');
      }

      const response = await fetch('https://google.serper.dev/shopping', {
        method: 'POST',
        headers: {
          'X-API-KEY': this.serperApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q: query }),
      });

      const data: any = await response.json();

      if (!data || !data.shopping || !Array.isArray(data.shopping)) {
        console.warn('⚠️ No shopping results found for query:', query);
        return [];
      }

      const products = data.shopping.map((item: any) => ({
        id: `temp_${item.productId || Math.random().toString(36).substring(2, 10)}`,
        title: item.title,
        price: parseFloat(item.price?.value) || 0,
        currency: item.price?.currency || 'USD',
        platform: this.detectPlatform(item.source || item.link),
        imageUrl: item.thumbnail || '',
        url: item.link || '',
        stockStatus: 'unknown',
      }));

      return products;
    } catch (error) {
      console.error('❌ Serper API error:', error);
      return [];
    }
  }

  /**
   * Detect platform (Amazon, eBay, AliExpress, Temu...) based on URL
   */
  private detectPlatform(url: string): string {
    const domain = url?.toLowerCase() || '';
    if (domain.includes('amazon')) return 'Amazon';
    if (domain.includes('ebay')) return 'eBay';
    if (domain.includes('aliexpress')) return 'AliExpress';
    if (domain.includes('temu')) return 'Temu';
    if (domain.includes('walmart')) return 'Walmart';
    return 'Other';
  }

  /**
   * Extract main keywords from product title
   */
  private extractSearchTerm(title: string): string {
    const commonWords = [
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
      'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before',
      'after', 'above', 'below', 'between', 'among', 'under', 'over', 'around',
      'near', 'far', 'here', 'there', 'where', 'when', 'why', 'how', 'all',
      'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
      'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
      'can', 'will', 'just', 'should', 'now',
    ];

    const words = title
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !commonWords.includes(w))
      .slice(0, 4);

    return words.join(' ');
  }

  /**
   * Re-scrape all products
   */
  async rescrapeAllMatches(): Promise<void> {
    try {
      console.log('🔄 Re-scraping all product matches...');
      const allProducts = await this.db.getProducts();
      for (const product of allProducts) {
        await this.scrapeAndStoreMatches(product);
        await new Promise((res) => setTimeout(res, 100));
      }
      console.log('✅ Completed full re-scrape');
    } catch (error) {
      console.error('❌ Error during full re-scrape:', error);
    }
  }

  /**
   * Get stored matches from DB
   */
  async getStoredMatches(sourceProductId: string): Promise<any[]> {
    try {
      const matches = await this.db.getProductMatches(sourceProductId);
      const enriched = [];

      for (const m of matches) {
        let matchedProduct;
        if (m.matchedProductId.startsWith('real_')) {
          // Skip placeholder real_* entries; show only real links from external search
          continue;
        } else {
          matchedProduct = await this.db.getProductById(m.matchedProductId);
        }

        if (matchedProduct) {
          enriched.push({
            product: matchedProduct,
            confidence: m.confidence,
            similarity: m.similarity,
            matchReason: m.matchReason,
            priceDifference: m.priceDifference,
            priceDifferencePercent: m.priceDifferencePercent,
            savings: m.savings,
          });
        }
      }

      return enriched;
    } catch (error) {
      console.error('❌ Error getting stored matches:', error);
      return [];
    }
  }
}

export const productMatchScraper = new ProductMatchScraper();
