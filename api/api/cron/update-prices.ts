import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../src/config/supabase';
import { realProductSearch } from '../../src/services/realProductSearch';
import { getDb } from '../../src/config/database';

const db = getDb();

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Only allow GET requests (Vercel cron uses GET)
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Method not allowed' });
    }

    const startTime = Date.now();
    const stats = { checked: 0, updated: 0, errors: 0, skipped: [] as string[], duration: 0 };

    try {
        console.log('[CRON] 🚀 Starting automated price update...');
        const tenHoursAgo = new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString();

        const { data: productsToUpdate, error: fetchError } = await supabase
            .from('products')
            .select('id, title, url, platform, current_price, last_checked')
            .or(`last_checked.is.null,last_checked.lt.${tenHoursAgo}`)
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
            // Respect Vercel's 60s timeout
            if (Date.now() - startTime > 55000) {
                console.log('[CRON] ⏱️ Approaching timeout, stopping early');
                break;
            }

            try {
                stats.checked++;
                const searchQuery = product.title || '';
                if (!searchQuery) {
                    stats.skipped.push(product.id);
                    console.log(`[CRON] ⚠️ Skipped ${product.id} - no title`);
                    continue;
                }

                console.log(`[CRON] 🔍 Checking: ${product.title.substring(0, 50)}...`);
                const results = await realProductSearch.searchProducts(searchQuery, 1);

                if (results.length === 0) {
                    await db.updateProduct(product.id, { last_checked: new Date().toISOString() });
                    stats.skipped.push(product.id);
                    console.log(`[CRON] ⚠️ No price found for ${product.id}`);
                    continue;
                }

                const newPrice = results[0].price;
                const oldPrice = product.current_price || 0;
                const updateData: any = { last_checked: new Date().toISOString() };

                if (newPrice !== oldPrice && newPrice > 0) {
                    updateData.current_price = newPrice;
                    await db.updateProduct(product.id, updateData);
                    await db.addPriceHistory({
                        productId: product.id,
                        price: newPrice,
                        currency: results[0].currency || 'USD'
                    });
                    stats.updated++;
                    console.log(`[CRON] ✅ Updated ${product.id}: $${oldPrice} → $${newPrice}`);
                } else {
                    await db.updateProduct(product.id, updateData);
                    console.log(`[CRON] ℹ️ No change ${product.id}: $${oldPrice}`);
                }
            } catch (productError: any) {
                stats.errors++;
                console.error(`[CRON] ❌ Error processing ${product.id}:`, productError?.message || productError);
                try {
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
}
