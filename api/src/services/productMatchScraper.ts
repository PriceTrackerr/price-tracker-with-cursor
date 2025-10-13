import { getDb } from '../config/database';
import { matchProducts } from './productMatchingService';
import { supabase, TABLES } from '../config/supabase';
import { realProductSearch } from './realProductSearch';
import axios from 'axios';

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
   * Fetch real matches using realProductSearch and persist into product_matches.
   * - Deduplicate by URL per user+product
   * - Return normalized list of found matches
   */
  async findAndStoreExternalMatches(userId: string, sourceProduct: any, limit: number = 21): Promise<any[]> {
    try {
      const query = sourceProduct?.title || '';
      if (!query) {
        console.warn('⚠️ findAndStoreExternalMatches called without a valid title');
        return [];
      }
      
      // 1) Per-platform Serper searches in parallel (organic search, direct links)
      const SERPER_API_KEY = process.env.SERPER_API_KEY;
      if (!SERPER_API_KEY) {
        console.warn('⚠️ SERPER_API_KEY missing; external matching disabled');
        return [];
      }

      const platforms = [
        { name: 'amazon', domain: 'amazon.com' },
        { name: 'aliexpress', domain: 'aliexpress.com' },
        { name: 'ebay', domain: 'ebay.com' },
        { name: 'walmart', domain: 'walmart.com' },
        { name: 'shein', domain: 'shein.com' },
        { name: 'target', domain: 'target.com' },
        { name: 'bestbuy', domain: 'bestbuy.com' },
      ];

      const requests = platforms.map(async (p) => {
        try {
          const q = `${query} site:${p.domain}`;
          const resp = await axios.post(
            'https://google.serper.dev/search',
            { q, gl: 'us', hl: 'en' },
            { headers: { 'X-API-KEY': SERPER_API_KEY, 'Content-Type': 'application/json' }, timeout: 30000 }
          );
          const organic = Array.isArray(resp.data?.organic) ? resp.data.organic : [];
          // Take up to 3 per platform
          return organic.slice(0, 3).map((r: any) => {
            const { price, currency } = this.parsePriceCurrency(r);
            return {
              title: r.title || sourceProduct.title,
              url: (r.link || '').split('#')[0],
              price,
              currency,
              platform: p.name,
              imageUrl: r.image || r.thumbnail || '',
            };
          }).filter((it: any) => !!it.url);
        } catch (err) {
          console.warn(`🌐 Serper search failed for ${p.name}:`, (err as any)?.message || err);
          return [] as any[];
        }
      });

      const perPlatformResults = await Promise.all(requests);
      const results = perPlatformResults.flat();
      if (!results.length) return [];

      // Normalize platforms to lowercase and clean URLs
      const normalized = results.map((r: any) => ({
        ...r,
        platform: (r.platform || 'other').toString().toLowerCase(),
        url: (r.url || '').split('#')[0]
      })).filter((r: any) => r.url);

      if (!normalized.length) return [];

      // 2) Deduplicate by URL against existing rows for this user+product
      const urls = normalized.map((n: any) => n.url);
      const { data: existingRows, error: existErr } = await supabase
        .from(TABLES.PRODUCT_MATCHES)
        .select('id,url')
        .eq('user_id', userId)
        .eq('product_id', sourceProduct.id)
        .in('url', urls);
      if (existErr) {
        console.warn('⚠️ Could not fetch existing product_matches for dedupe:', existErr);
      }
      const existingUrlSet = new Set((existingRows || []).map((row: any) => row.url));

      const toInsert = normalized.filter((n: any) => !existingUrlSet.has(n.url)).map((n: any) => ({
        user_id: userId,
        product_id: sourceProduct.id,
        title: n.title || sourceProduct.title,
        price: Number(n.price || 0),
        currency: n.currency || 'USD',
        url: n.url,
        image_url: n.imageUrl || null,
        platform: n.platform,
        created_at: new Date().toISOString(),
      }));

      if (toInsert.length) {
        const { error: insertErr } = await supabase
          .from(TABLES.PRODUCT_MATCHES)
          .insert(toInsert);
        if (insertErr) {
          console.error('❌ Failed inserting product_matches:', insertErr);
        }
      }

      // 3) Return the union of existing + new for the requested URLs (ordered by platform then title)
      const { data: rows, error: fetchErr } = await supabase
        .from(TABLES.PRODUCT_MATCHES)
        .select('user_id,product_id,title,price,currency,url,image_url,platform,created_at')
        .eq('user_id', userId)
        .eq('product_id', sourceProduct.id)
        .in('url', urls);
      if (fetchErr) {
        console.error('❌ Failed fetching back product_matches:', fetchErr);
        // Fallback to returning normalized results when fetch fails
        return normalized;
      }

      const list = (rows || []).map((r: any) => ({
        userId: r.user_id,
        productId: r.product_id,
        title: r.title,
        price: r.price,
        currency: r.currency,
        url: r.url,
        imageUrl: r.image_url,
        platform: r.platform,
        createdAt: r.created_at,
      }));

      return list;
    } catch (err) {
      console.error('❌ findAndStoreExternalMatches error:', err);
      return [];
    }
  }

  private extractPrice(raw: any): number {
    if (!raw) return 0;
    if (typeof raw === 'number') return raw;
    const cleaned = String(raw).replace(/[^\\d.,]/g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }

  private detectCurrency(price: string): string {
    if (!price) return 'USD';
    if (price.includes('$')) return 'USD';
    if (price.includes('€')) return 'EUR';
    if (price.includes('£')) return 'GBP';
    return 'USD';
  }

  private parsePriceCurrency(r: any): { price: number; currency: string } {
    // Prefer explicit numeric fields
    if (typeof r.extracted_price === 'number') {
      return { price: r.extracted_price, currency: 'USD' };
    }
    if (typeof r.price === 'number') {
      return { price: r.price, currency: 'USD' };
    }

    // Try string sources in priority order
    const candidates: string[] = [];
    if (typeof r.price === 'string') candidates.push(r.price);
    if (typeof r.priceText === 'string') candidates.push(r.priceText);
    if (typeof r.snippet === 'string') candidates.push(r.snippet);
    if (typeof r.title === 'string') candidates.push(r.title);

    for (const text of candidates) {
      const currency = this.detectCurrency(text);
      const amt = this.extractPrice(text);
      if (amt > 0) return { price: amt, currency };
    }

    return { price: 0, currency: 'USD' };
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
