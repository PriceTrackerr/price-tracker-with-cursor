import express, { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { realProductSearch } from '../services/realProductSearch';
import { getDb } from '../config/database';

const router = express.Router();
const db = getDb();

// Serper API key rotation (4 accounts = 10,000 free credits total)
function getRotatedSerperKey(): string {
    const keys = [
        process.env.SERPER_API_KEY_1,
        process.env.SERPER_API_KEY_2,
        process.env.SERPER_API_KEY_3,
        process.env.SERPER_API_KEY_4,
        process.env.SERPER_API_KEY // Fallback to original
    ].filter(Boolean); // Remove undefined keys

    if (keys.length === 0) {
        throw new Error('No Serper API keys configured');
    }

    // Rotate daily (day of year determines which key)
    const dayOfYear = Math.floor(Date.now() / 86400000);
    const keyIndex = dayOfYear % keys.length;

    console.log(`[CRON] 🔑 Using Serper key ${keyIndex + 1}/${keys.length}`);
    return keys[keyIndex]!;
}

// Extract clean search query from product title
function extractSearchQuery(title: string): string {
    if (!title) return '';

    // Remove common noise words and extract core product name
    const cleaned = title
        .replace(/\(.*?\)/g, '') // Remove parentheses content
        .replace(/\[.*?\]/g, '') // Remove bracket content
        .replace(/For Original|Original/gi, '') // Remove "For Original"
        .replace(/Renewed|Refurbished/gi, '') // Keep these but clean
        .trim();

    // Extract brand keywords (common brands)
    const brands = ['Apple', 'Samsung', 'Sony', 'Nike', 'Adidas', 'Dell', 'HP', 'Lenovo',
        'Asus', 'Microsoft', 'Google', 'Amazon', 'Walmart', 'Target', 'Shark'];
    const words = cleaned.split(/\s+/);
    const brand = words.find(w => brands.some(b => w.toLowerCase().includes(b.toLowerCase())));

    // Take first 4-6 meaningful words
    const meaningfulWords = words
        .filter(w => w.length > 2) // Skip short words
        .filter(w => !['with', 'and', 'for', 'the', 'new', 'pro', 'max'].includes(w.toLowerCase()))
        .slice(0, 6);

    const query = brand
        ? `${brand} ${meaningfulWords.filter(w => w !== brand).slice(0, 4).join(' ')}`
        : meaningfulWords.join(' ');

    return query.trim() || title.substring(0, 50); // Fallback to first 50 chars
}

router.get('/update-prices', async (req: Request, res: Response) => {
    const startTime = Date.now();
    const stats = { checked: 0, updated: 0, errors: 0, skipped: [] as string[], duration: 0 };

    try {
        console.log('[CRON] 🚀 Starting automated price update...');
        const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();

        const { data: productsToUpdate, error: fetchError } = await supabase
            .from('products')
            .select('id, title, url, platform, price, last_checked')
            .or(`last_checked.is.null,last_checked.lt.${twelveHoursAgo}`)
            .order('last_checked', { ascending: true, nullsFirst: true })
            .limit(20);

        if (fetchError) {
            console.error('[CRON] ❌ Database error:', fetchError);
            return res.status(500).json({ success: false, message: 'Failed to fetch products', error: fetchError.message });
        }

        if (!productsToUpdate || productsToUpdate.length === 0) {
            console.log('[CRON] ✅ No products need updating');
            return res.json({ success: true, message: 'No products need updating', stats: { ...stats, duration: Date.now() - startTime } });
        }

        console.log(`[CRON] 📦 Found ${productsToUpdate.length} products to update`);

        for (const product of productsToUpdate) {
            if (Date.now() - startTime > 8000) {
                console.log('[CRON] ⏱️ Approaching timeout, stopping early');
                break;
            }

            try {
                stats.checked++;
                const originalTitle = product.title || '';
                if (!originalTitle) {
                    stats.skipped.push(product.id);
                    console.log(`[CRON] ⚠️ Skipped ${product.id} - no title`);
                    continue;
                }

                // Extract clean search query for better Serper results
                const searchQuery = extractSearchQuery(originalTitle);
                console.log(`[CRON] 🔍 Checking: ${originalTitle.substring(0, 50)}...`);
                console.log(`[CRON] 🔎 Search query: "${searchQuery}"`);

                // Set the rotated API key temporarily
                const currentKey = getRotatedSerperKey();
                const originalKey = process.env.SERPER_API_KEY;
                process.env.SERPER_API_KEY = currentKey;

                let results;
                try {
                    results = await realProductSearch.searchProducts(searchQuery, 1);
                } catch (searchError: any) {
                    // Restore original key
                    process.env.SERPER_API_KEY = originalKey;
                    // If search fails (e.g., "All providers failed"), still update last_checked
                    console.log(`[CRON] ⚠️ Search failed for "${searchQuery}": ${searchError.message || 'Provider error'}`);
                    await db.updateProduct(product.id, { last_checked: new Date().toISOString() });
                    stats.skipped.push(product.id);
                    continue;
                }

                // Restore original API key after search
                process.env.SERPER_API_KEY = originalKey;

                if (!results || results.length === 0) {
                    await db.updateProduct(product.id, { last_checked: new Date().toISOString() });
                    stats.skipped.push(product.id);
                    console.log(`[CRON] ⚠️ No price found for ${product.id}`);
                    continue;
                }

                const newPrice = results[0].price;
                const oldPrice = product.price || 0;
                const updateData: any = { last_checked: new Date().toISOString() };

                // Always add price history entry (even if price didn't change)
                // This creates a continuous daily history for trend analysis
                await db.addPriceHistory({
                    productId: product.id,
                    price: newPrice,
                    currency: results[0].currency || 'USD'
                });

                if (newPrice !== oldPrice && newPrice > 0) {
                    updateData.price = newPrice;
                    await db.updateProduct(product.id, updateData);
                    stats.updated++;
                    console.log(`[CRON] ✅ Updated ${product.id}: $${oldPrice} → $${newPrice}`);
                } else {
                    await db.updateProduct(product.id, updateData);
                    console.log(`[CRON] ℹ️ No change ${product.id}: $${newPrice} (history saved)`);
                }
            } catch (productError: any) {
                stats.errors++;
                console.error(`[CRON] ❌ Error processing ${product.id}:`, productError?.message || productError);
                try {
                    // Always update last_checked to prevent infinite retry loop
                    await db.updateProduct(product.id, { last_checked: new Date().toISOString() });
                } catch (e) {
                    console.error(`[CRON] ❌ Failed to update last_checked for ${product.id}`);
                }
            }
        }

        stats.duration = Date.now() - startTime;
        console.log(`[CRON] 🎉 Complete:`, stats);
        return res.json({ success: true, message: 'Price update complete', stats });

    } catch (error: any) {
        stats.duration = Date.now() - startTime;
        console.error('[CRON] ❌ Fatal error:', error?.message || error);
        return res.status(500).json({ success: false, message: 'Price update failed', error: error?.message, stats });
    }
});

export default router;
