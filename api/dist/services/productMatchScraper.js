"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.productMatchScraper = exports.ProductMatchScraper = void 0;
const database_1 = require("../config/database");
const productMatchingService_1 = require("./productMatchingService");
const supabase_1 = require("../config/supabase");
const axios_1 = __importDefault(require("axios"));
class ProductMatchScraper {
    constructor() {
        this.db = (0, database_1.getDb)();
        this.serperApiKey = process.env.SERPER_API_KEY || '';
    }
    async scrapeAndStoreMatches(sourceProduct) {
        try {
            console.log(`🔍 Pre-scraping real product matches for: ${sourceProduct.title}`);
            const searchTerm = this.extractSearchTerm(sourceProduct.title);
            console.log(`🔍 Extracted search term: "${searchTerm}"`);
            const realProducts = await this.fetchFromSerper(searchTerm);
            console.log(`🌐 Found ${realProducts.length} results from Serper`);
            const allProducts = await this.db.getProducts();
            const candidateProducts = allProducts.filter((p) => p.id !== sourceProduct.id);
            const allCandidates = [...realProducts, ...candidateProducts];
            if (allCandidates.length === 0) {
                console.log('⚠️ No candidates found for matching');
                return;
            }
            const matches = (0, productMatchingService_1.matchProducts)(sourceProduct, allCandidates);
            console.log(`🎯 Found ${matches.length} matches for ${sourceProduct.title}`);
            await this.db.deleteProductMatches(sourceProduct.id);
            let storedCount = 0;
            for (const match of matches) {
                try {
                    const matchedProduct = match.product;
                    if (matchedProduct && matchedProduct.platform) {
                        matchedProduct.platform = String(matchedProduct.platform).toLowerCase();
                    }
                    if (String(sourceProduct.id).startsWith('query-'))
                        continue;
                    const matchedProductId = matchedProduct.id.startsWith('temp_')
                        ? `real_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
                        : matchedProduct.id;
                    const confidence = typeof match.confidence === 'number'
                        ? match.confidence
                        : (typeof match.score === 'number' ? match.score : 0.7);
                    const similarity = typeof match.similarity === 'number'
                        ? match.similarity
                        : confidence;
                    const { supabase, TABLES } = require('../config/supabase');
                    const { error: insertError } = await supabase
                        .from(TABLES.PRODUCT_MATCHES)
                        .insert({
                        user_id: sourceProduct.userId || 'unknown',
                        product_id: sourceProduct.id,
                        title: matchedProduct.title,
                        price: matchedProduct.price || 0,
                        currency: matchedProduct.currency || 'USD',
                        url: matchedProduct.url || '',
                        image_url: matchedProduct.imageUrl || null,
                        platform: matchedProduct.platform || 'unknown'
                    });
                    if (insertError) {
                        console.error('❌ Failed to insert product match:', insertError);
                    }
                    storedCount++;
                }
                catch (error) {
                    console.error(`❌ Failed to store match for ${match.product?.title}:`, error);
                }
            }
            console.log(`✅ Stored ${storedCount} product matches for ${sourceProduct.title}`);
        }
        catch (error) {
            console.error('❌ Error scraping and storing real product matches:', error);
        }
    }
    async findAndStoreExternalMatches(userId, sourceProduct, limit = 21) {
        try {
            const query = sourceProduct?.title || '';
            if (!query) {
                console.warn('⚠️ findAndStoreExternalMatches called without a valid title');
                return [];
            }
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
                    const resp = await axios_1.default.post('https://google.serper.dev/search', { q, gl: 'us', hl: 'en' }, { headers: { 'X-API-KEY': SERPER_API_KEY, 'Content-Type': 'application/json' }, timeout: 30000 });
                    const organic = Array.isArray(resp.data?.organic) ? resp.data.organic : [];
                    return organic.slice(0, 3).map((r) => {
                        const { price, currency } = this.parsePriceCurrency(r);
                        return {
                            title: r.title || sourceProduct.title,
                            url: (r.link || '').split('#')[0],
                            price,
                            currency,
                            platform: p.name,
                            imageUrl: r.image || r.thumbnail || '',
                        };
                    }).filter((it) => !!it.url);
                }
                catch (err) {
                    console.warn(`🌐 Serper search failed for ${p.name}:`, err?.message || err);
                    return [];
                }
            });
            const perPlatformResults = await Promise.all(requests);
            const results = perPlatformResults.flat();
            if (!results.length)
                return [];
            const normalized = results.map((r) => ({
                ...r,
                platform: (r.platform || 'other').toString().toLowerCase(),
                url: (r.url || '').split('#')[0]
            })).filter((r) => r.url);
            if (!normalized.length)
                return [];
            const urls = normalized.map((n) => n.url);
            const productIdForCache = (typeof sourceProduct.id === 'string' && sourceProduct.id.startsWith('query-'))
                ? (sourceProduct.cacheProductId || sourceProduct.productId || sourceProduct.realId)
                : sourceProduct.id;
            if (!productIdForCache) {
                console.warn('⚠️ No valid productId for caching external matches');
                return normalized;
            }
            const { data: existingRows, error: existErr } = await supabase_1.supabase
                .from(supabase_1.TABLES.PRODUCT_MATCHES)
                .select('id,url')
                .eq('user_id', userId)
                .eq('product_id', productIdForCache)
                .in('url', urls);
            if (existErr) {
                console.warn('⚠️ Could not fetch existing product_matches for dedupe:', existErr);
            }
            const existingUrlSet = new Set((existingRows || []).map((row) => row.url));
            const toInsert = normalized.filter((n) => !existingUrlSet.has(n.url)).map((n) => ({
                user_id: userId,
                product_id: productIdForCache,
                title: n.title || sourceProduct.title,
                price: Number(n.price || 0),
                currency: n.currency || 'USD',
                url: n.url,
                image_url: n.imageUrl || null,
                platform: n.platform,
                created_at: new Date().toISOString(),
            }));
            if (toInsert.length) {
                const { error: insertErr } = await supabase_1.supabase
                    .from(supabase_1.TABLES.PRODUCT_MATCHES)
                    .insert(toInsert);
                if (insertErr) {
                    console.error('❌ Failed inserting product_matches:', insertErr);
                }
            }
            const zeroPriced = normalized.filter((n) => Number(n.price || 0) === 0).slice(0, 5);
            for (const z of zeroPriced) {
                try {
                    const { price, currency } = await this.fetchPriceFromProductPage(z.url);
                    if (price && isFinite(price) && price > 0) {
                        const { error: updErr } = await supabase_1.supabase
                            .from(supabase_1.TABLES.PRODUCT_MATCHES)
                            .update({ price, currency: currency || 'USD' })
                            .eq('user_id', userId)
                            .eq('product_id', productIdForCache)
                            .eq('url', z.url);
                        if (updErr)
                            console.warn('⚠️ Failed updating price for URL:', z.url, updErr);
                    }
                }
                catch (err) {
                    console.warn('⚠️ Enrichment fetch failed for', z.url, err?.message || err);
                }
                await new Promise(r => setTimeout(r, 150));
            }
            const { data: rows, error: fetchErr } = await supabase_1.supabase
                .from(supabase_1.TABLES.PRODUCT_MATCHES)
                .select('user_id,product_id,title,price,currency,url,image_url,platform,created_at')
                .eq('user_id', userId)
                .eq('product_id', productIdForCache)
                .in('url', urls);
            if (fetchErr) {
                console.error('❌ Failed fetching back product_matches:', fetchErr);
                return normalized;
            }
            const list = (rows || []).map((r) => ({
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
        }
        catch (err) {
            console.error('❌ findAndStoreExternalMatches error:', err);
            return [];
        }
    }
    async getStoredExternalMatches(userId, productId) {
        try {
            const { data, error } = await supabase_1.supabase
                .from(supabase_1.TABLES.PRODUCT_MATCHES)
                .select('user_id,product_id,title,price,currency,url,image_url,platform,created_at')
                .eq('user_id', userId)
                .eq('product_id', productId)
                .order('created_at', { ascending: false });
            if (error) {
                console.warn('⚠️ getStoredExternalMatches query failed:', error);
                return [];
            }
            return (data || []).map((r) => ({
                userId: r.user_id,
                productId: r.product_id,
                title: r.title,
                price: Number(r.price || 0),
                currency: r.currency || 'USD',
                url: r.url,
                imageUrl: r.image_url || '',
                platform: (r.platform || 'other').toLowerCase(),
                createdAt: r.created_at,
            }));
        }
        catch (err) {
            console.warn('⚠️ getStoredExternalMatches error:', err);
            return [];
        }
    }
    async enrichStoredZeroPriceMatches(userId, productId, cap = 10) {
        try {
            const { data, error } = await supabase_1.supabase
                .from(supabase_1.TABLES.PRODUCT_MATCHES)
                .select('url')
                .eq('user_id', userId)
                .eq('product_id', productId)
                .eq('price', 0)
                .limit(cap);
            if (error) {
                console.warn('⚠️ enrich query failed:', error);
                return 0;
            }
            const rows = data || [];
            let updated = 0;
            for (const r of rows) {
                try {
                    const { price, currency } = await this.fetchPriceFromProductPage(r.url);
                    if (price && isFinite(price) && price > 0) {
                        const { error: updErr } = await supabase_1.supabase
                            .from(supabase_1.TABLES.PRODUCT_MATCHES)
                            .update({ price, currency: currency || 'USD' })
                            .eq('user_id', userId)
                            .eq('product_id', productId)
                            .eq('url', r.url);
                        if (!updErr)
                            updated++;
                    }
                }
                catch { }
                await new Promise(r => setTimeout(r, 120));
            }
            return updated;
        }
        catch (err) {
            console.warn('⚠️ enrichStoredZeroPriceMatches error:', err);
            return 0;
        }
    }
    extractPrice(raw) {
        if (!raw)
            return 0;
        if (typeof raw === 'number')
            return raw;
        const cleaned = String(raw).replace(/[^\\d.,]/g, '').replace(',', '.');
        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : num;
    }
    detectCurrency(price) {
        if (!price)
            return 'USD';
        if (price.includes('$'))
            return 'USD';
        if (price.includes('€'))
            return 'EUR';
        if (price.includes('£'))
            return 'GBP';
        return 'USD';
    }
    parsePriceCurrency(r) {
        if (typeof r.extracted_price === 'number') {
            return { price: r.extracted_price, currency: 'USD' };
        }
        if (typeof r.price === 'number') {
            return { price: r.price, currency: 'USD' };
        }
        const candidates = [];
        if (typeof r.price === 'string')
            candidates.push(r.price);
        if (typeof r.priceText === 'string')
            candidates.push(r.priceText);
        if (typeof r.snippet === 'string')
            candidates.push(r.snippet);
        if (typeof r.title === 'string')
            candidates.push(r.title);
        for (const text of candidates) {
            const currency = this.detectCurrency(text);
            const amt = this.extractPrice(text);
            if (amt > 0)
                return { price: amt, currency };
        }
        return { price: 0, currency: 'USD' };
    }
    async fetchPriceFromProductPage(url) {
        try {
            const resp = await axios_1.default.get(url, { timeout: 12000, headers: { 'User-Agent': 'Mozilla/5.0' } });
            const html = String(resp.data || '');
            const u = url.toLowerCase();
            let price = 0;
            let currency = 'USD';
            const pick = (...regs) => {
                for (const re of regs) {
                    const m = html.match(re);
                    if (m && m[1])
                        return m[1];
                }
                return '';
            };
            if (u.includes('amazon.')) {
                const txt = pick(/\"priceblock_ourprice\"[^>]*>\s*\$?([0-9.,]+)/i, /\"priceToPay\"[\s\S]*?\$([0-9.,]+)/i, /\$([0-9.,]+)\s*<\/?span/i);
                price = this.extractPrice(txt);
                currency = 'USD';
            }
            else if (u.includes('ebay.')) {
                const txt = pick(/itemprop=\"price\"[^>]*content=\"([0-9.]+)\"/i, /\$([0-9.,]+)\s*<\/?span/i);
                price = this.extractPrice(txt);
                currency = 'USD';
            }
            else if (u.includes('walmart.')) {
                const txt = pick(/\$([0-9.,]+)\s*<\/?span/i, /content=\"USD\"[^>]*content=\"([0-9.]+)\"/i);
                price = this.extractPrice(txt);
                currency = 'USD';
            }
            else if (u.includes('bestbuy.')) {
                const txt = pick(/\$([0-9.,]+)\s*<\/?/i, /data-currency=\"USD\"[^>]*data-price=\"([0-9.]+)\"/i);
                price = this.extractPrice(txt);
                currency = 'USD';
            }
            else if (u.includes('target.')) {
                const txt = pick(/\$([0-9.,]+)\s*<\/?/i);
                price = this.extractPrice(txt);
                currency = 'USD';
            }
            else if (u.includes('aliexpress.')) {
                const txt = pick(/itemprop=\"price\"[^>]*content=\"([0-9.]+)\"/i, /US\$\s*([0-9.,]+)/i, /\$([0-9.,]+)/i);
                price = this.extractPrice(txt);
                currency = 'USD';
            }
            else if (u.includes('shein.')) {
                const txt = pick(/US\$\s*([0-9.,]+)/i, /\$([0-9.,]+)/i);
                price = this.extractPrice(txt);
                currency = 'USD';
            }
            if (!price || !isFinite(price))
                return { price: 0, currency: 'USD' };
            return { price, currency };
        }
        catch (err) {
            return { price: 0, currency: 'USD' };
        }
    }
    async fetchFromSerper(query) {
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
            const data = await response.json();
            if (!data || !data.shopping || !Array.isArray(data.shopping)) {
                console.warn('⚠️ No shopping results found for query:', query);
                return [];
            }
            const products = data.shopping.map((item) => ({
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
        }
        catch (error) {
            console.error('❌ Serper API error:', error);
            return [];
        }
    }
    detectPlatform(url) {
        const domain = url?.toLowerCase() || '';
        if (domain.includes('amazon'))
            return 'Amazon';
        if (domain.includes('ebay'))
            return 'eBay';
        if (domain.includes('aliexpress'))
            return 'AliExpress';
        if (domain.includes('temu'))
            return 'Temu';
        if (domain.includes('walmart'))
            return 'Walmart';
        return 'Other';
    }
    extractSearchTerm(title) {
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
    async rescrapeAllMatches() {
        try {
            console.log('🔄 Re-scraping all product matches...');
            const allProducts = await this.db.getProducts();
            for (const product of allProducts) {
                await this.scrapeAndStoreMatches(product);
                await new Promise((res) => setTimeout(res, 100));
            }
            console.log('✅ Completed full re-scrape');
        }
        catch (error) {
            console.error('❌ Error during full re-scrape:', error);
        }
    }
    async getStoredMatches(sourceProductId) {
        try {
            return [];
        }
        catch (error) {
            console.error('❌ Error getting stored matches:', error);
            return [];
        }
    }
}
exports.ProductMatchScraper = ProductMatchScraper;
exports.productMatchScraper = new ProductMatchScraper();
//# sourceMappingURL=productMatchScraper.js.map