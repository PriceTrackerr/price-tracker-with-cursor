"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const supabase_1 = require("./supabase");
class SupabaseStorage {
    async getSubscriptionPlans() {
        try {
            const { data, error } = await supabase_1.supabase
                .from(supabase_1.TABLES.SUBSCRIPTION_PLANS)
                .select('*')
                .order('price', { ascending: true });
            if (error)
                throw error;
            return data || [];
        }
        catch (error) {
            (0, supabase_1.handleSupabaseError)(error, 'getSubscriptionPlans');
        }
    }
    async getDeletedSubscriptionPlanIds() {
        try {
            const { data, error } = await supabase_1.supabase
                .from(supabase_1.TABLES.SUBSCRIPTION_PLANS)
                .select('id')
                .eq('deleted', true);
            if (error)
                throw error;
            return data?.map((item) => item.id) || [];
        }
        catch (error) {
            (0, supabase_1.handleSupabaseError)(error, 'getDeletedSubscriptionPlanIds');
        }
    }
    async setSubscriptionPlans(plans) {
        try {
            const { error: deleteError } = await supabase_1.supabase
                .from(supabase_1.TABLES.SUBSCRIPTION_PLANS)
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000');
            if (deleteError)
                throw deleteError;
            if (plans.length > 0) {
                const { error: insertError } = await supabase_1.supabase
                    .from(supabase_1.TABLES.SUBSCRIPTION_PLANS)
                    .insert(plans);
                if (insertError)
                    throw insertError;
            }
        }
        catch (error) {
            (0, supabase_1.handleSupabaseError)(error, 'setSubscriptionPlans');
        }
    }
    async addSubscriptionPlan(plan) {
        try {
            const { error } = await supabase_1.supabase
                .from(supabase_1.TABLES.SUBSCRIPTION_PLANS)
                .insert(plan);
            if (error)
                throw error;
        }
        catch (error) {
            (0, supabase_1.handleSupabaseError)(error, 'addSubscriptionPlan');
        }
    }
    async updateSubscriptionPlan(id, update) {
        try {
            const { error } = await supabase_1.supabase
                .from(supabase_1.TABLES.SUBSCRIPTION_PLANS)
                .update(update)
                .eq('id', id);
            if (error)
                throw error;
            return true;
        }
        catch (error) {
            (0, supabase_1.handleSupabaseError)(error, 'updateSubscriptionPlan');
        }
    }
    async deleteSubscriptionPlan(id) {
        try {
            const { error } = await supabase_1.supabase
                .from(supabase_1.TABLES.SUBSCRIPTION_PLANS)
                .update({ deleted: true })
                .eq('id', id);
            if (error)
                throw error;
            return true;
        }
        catch (error) {
            (0, supabase_1.handleSupabaseError)(error, 'deleteSubscriptionPlan');
        }
    }
    async addProduct(productData) {
        try {
            const now = new Date().toISOString();
            const toInsert = {
                url: productData.url,
                title: productData.title,
                price: productData.price,
                currency: productData.currency,
                platform: productData.platform,
                image_url: productData.imageUrl || '',
                user_id: productData.userId,
                stock_status: productData.stockStatus || 'unknown',
                discount_info: productData.discountInfo ?? undefined,
                created_at: now,
                updated_at: now
            };
            const { data, error } = await supabase_1.supabase
                .from(supabase_1.TABLES.PRODUCTS)
                .insert(toInsert)
                .select()
                .single();
            if (error)
                throw error;
            return data.id;
        }
        catch (error) {
            (0, supabase_1.handleSupabaseError)(error, 'addProduct');
        }
    }
    async getProducts(userId) {
        try {
            let query = supabase_1.supabase.from(supabase_1.TABLES.PRODUCTS).select('*');
            if (userId) {
                query = query.eq('user_id', userId);
            }
            const { data, error } = await query.order('created_at', { ascending: false });
            if (error)
                throw error;
            const mapped = (data || []).map((row) => ({
                id: row.id,
                url: row.url,
                title: row.title,
                price: row.price,
                currency: row.currency,
                platform: row.platform,
                imageUrl: row.image_url || '',
                createdAt: row.created_at,
                updatedAt: row.updated_at,
                userId: row.user_id,
                stockStatus: row.stock_status || 'unknown',
                discountInfo: row.discount_info,
                matchedProducts: row.matched_products || [],
                totalMatches: row.total_matches || (row.matched_products ? row.matched_products.length : 0),
            }));
            return mapped;
        }
        catch (error) {
            (0, supabase_1.handleSupabaseError)(error, 'getProducts');
        }
    }
    async getProductById(id) {
        try {
            const { data, error } = await supabase_1.supabase
                .from(supabase_1.TABLES.PRODUCTS)
                .select('*')
                .eq('id', id)
                .single();
            if (error && error.code !== 'PGRST116')
                throw error;
            if (!data)
                return undefined;
            const row = data;
            return {
                id: row.id,
                url: row.url,
                title: row.title,
                price: row.price,
                currency: row.currency,
                platform: row.platform,
                imageUrl: row.image_url || '',
                createdAt: row.created_at,
                updatedAt: row.updated_at,
                userId: row.user_id,
                stockStatus: row.stock_status || 'unknown',
                discountInfo: row.discount_info,
                matchedProducts: row.matched_products || [],
                totalMatches: row.total_matches || (row.matched_products ? row.matched_products.length : 0),
            };
        }
        catch (error) {
            (0, supabase_1.handleSupabaseError)(error, 'getProductById');
        }
    }
    async deleteProduct(id) {
        try {
            const { error } = await supabase_1.supabase
                .from(supabase_1.TABLES.PRODUCTS)
                .delete()
                .eq('id', id);
            if (error)
                throw error;
            return true;
        }
        catch (error) {
            (0, supabase_1.handleSupabaseError)(error, 'deleteProduct');
        }
    }
    async updateProduct(id, update) {
        try {
            const mapped = {};
            const mapField = (from, to) => {
                if (update[from] !== undefined)
                    mapped[to] = update[from];
            };
            mapField('url', 'url');
            mapField('title', 'title');
            mapField('price', 'price');
            mapField('currency', 'currency');
            mapField('platform', 'platform');
            mapField('imageUrl', 'image_url');
            mapField('userId', 'user_id');
            mapField('stockStatus', 'stock_status');
            mapField('discountInfo', 'discount_info');
            mapField('matchedProducts', 'matched_products');
            mapField('totalMatches', 'total_matches');
            mapped['updated_at'] = new Date().toISOString();
            const { error } = await supabase_1.supabase
                .from(supabase_1.TABLES.PRODUCTS)
                .update(mapped)
                .eq('id', id);
            if (error)
                throw error;
            return true;
        }
        catch (error) {
            (0, supabase_1.handleSupabaseError)(error, 'updateProduct');
        }
    }
    async addUser(userData) {
        try {
            const now = new Date().toISOString();
            const user = {
                ...userData,
                createdAt: now,
                lastLogin: now
            };
            const { data, error } = await supabase_1.supabase
                .from(supabase_1.TABLES.USERS)
                .insert(user)
                .select()
                .single();
            if (error)
                throw error;
            return data.id;
        }
        catch (error) {
            (0, supabase_1.handleSupabaseError)(error, 'addUser');
        }
    }
    async getUserByEmail(email) {
        try {
            const { data, error } = await supabase_1.supabase
                .from(supabase_1.TABLES.USERS)
                .select('*')
                .eq('email', email)
                .single();
            if (error && error.code !== 'PGRST116')
                throw error;
            return data || undefined;
        }
        catch (error) {
            (0, supabase_1.handleSupabaseError)(error, 'getUserByEmail');
        }
    }
    async getUserById(id) {
        try {
            const { data, error } = await supabase_1.supabase
                .from(supabase_1.TABLES.USERS)
                .select('*')
                .eq('id', id)
                .single();
            if (error && error.code !== 'PGRST116')
                throw error;
            return data || undefined;
        }
        catch (error) {
            (0, supabase_1.handleSupabaseError)(error, 'getUserById');
        }
    }
    async updateUser(id, update) {
        try {
            const { error } = await supabase_1.supabase
                .from(supabase_1.TABLES.USERS)
                .update(update)
                .eq('id', id);
            if (error)
                throw error;
            return true;
        }
        catch (error) {
            (0, supabase_1.handleSupabaseError)(error, 'updateUser');
        }
    }
    async deleteUser(id) {
        try {
            const { error } = await supabase_1.supabase
                .from(supabase_1.TABLES.USERS)
                .delete()
                .eq('id', id);
            if (error)
                throw error;
            return true;
        }
        catch (error) {
            (0, supabase_1.handleSupabaseError)(error, 'deleteUser');
        }
    }
    async getUsers() {
        try {
            const { data, error } = await supabase_1.supabase
                .from(supabase_1.TABLES.USERS)
                .select('*')
                .order('createdAt', { ascending: false });
            if (error)
                throw error;
            return data || [];
        }
        catch (error) {
            (0, supabase_1.handleSupabaseError)(error, 'getUsers');
        }
    }
    async addAlert(alertData) {
        try {
            const now = new Date().toISOString();
            const alertToInsert = {
                user_id: alertData.userId,
                product_id: alertData.productId,
                product_title: alertData.productTitle,
                target_price: alertData.targetPrice,
                current_price: alertData.currentPrice,
                is_active: alertData.isActive,
                email: alertData.email || null,
                created_at: now
            };
            console.log('🔍 Inserting alert with data:', alertToInsert);
            const { data, error } = await supabase_1.supabase
                .from(supabase_1.TABLES.ALERTS)
                .insert(alertToInsert)
                .select()
                .single();
            if (error) {
                console.error('🚨 Supabase insert error:', error);
                throw error;
            }
            console.log('✅ Alert created successfully with ID:', data.id);
            return data.id;
        }
        catch (error) {
            console.error('🚨 addAlert error:', error);
            (0, supabase_1.handleSupabaseError)(error, 'addAlert');
        }
    }
    async getAlerts(userId) {
        try {
            let query = supabase_1.supabase.from(supabase_1.TABLES.ALERTS).select('*');
            if (userId) {
                query = query.eq('user_id', userId);
            }
            const { data, error } = await query.order('created_at', { ascending: false });
            if (error)
                throw error;
            return (data || []).map((alert) => ({
                id: alert.id,
                productId: alert.product_id,
                productTitle: alert.product_title,
                targetPrice: alert.target_price,
                currentPrice: alert.current_price,
                isActive: alert.is_active,
                email: alert.email,
                notifyOnRestock: alert.notify_on_restock || false,
                createdAt: alert.created_at,
                userId: alert.user_id
            }));
        }
        catch (error) {
            (0, supabase_1.handleSupabaseError)(error, 'getAlerts');
        }
    }
    async getAllAlerts() {
        try {
            const { data, error } = await supabase_1.supabase
                .from(supabase_1.TABLES.ALERTS)
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false });
            if (error)
                throw error;
            return (data || []).map((alert) => ({
                id: alert.id,
                productId: alert.product_id,
                productTitle: alert.product_title,
                targetPrice: alert.target_price,
                currentPrice: alert.current_price,
                isActive: alert.is_active,
                email: alert.email,
                notifyOnRestock: alert.notify_on_restock || false,
                createdAt: alert.created_at,
                userId: alert.user_id
            }));
        }
        catch (error) {
            (0, supabase_1.handleSupabaseError)(error, 'getAllAlerts');
        }
    }
    async getAlertById(id) {
        try {
            const { data, error } = await supabase_1.supabase
                .from(supabase_1.TABLES.ALERTS)
                .select('*')
                .eq('id', id)
                .single();
            if (error && error.code !== 'PGRST116')
                throw error;
            if (!data)
                return undefined;
            return {
                id: data.id,
                productId: data.product_id,
                productTitle: data.product_title,
                targetPrice: data.target_price,
                currentPrice: data.current_price,
                isActive: data.is_active,
                email: data.email,
                notifyOnRestock: data.notify_on_restock || false,
                createdAt: data.created_at,
                userId: data.user_id,
            };
        }
        catch (error) {
            (0, supabase_1.handleSupabaseError)(error, 'getAlertById');
        }
    }
    async updateAlert(id, update) {
        try {
            const { error } = await supabase_1.supabase
                .from(supabase_1.TABLES.ALERTS)
                .update(update)
                .eq('id', id);
            if (error)
                throw error;
            return true;
        }
        catch (error) {
            (0, supabase_1.handleSupabaseError)(error, 'updateAlert');
        }
    }
    async deleteAlert(id) {
        try {
            const { error } = await supabase_1.supabase
                .from(supabase_1.TABLES.ALERTS)
                .delete()
                .eq('id', id);
            if (error)
                throw error;
            return true;
        }
        catch (error) {
            (0, supabase_1.handleSupabaseError)(error, 'deleteAlert');
        }
    }
    async addNotification(notificationData) {
        try {
            const now = new Date().toISOString();
            const notificationToInsert = {
                ...notificationData,
                user_id: notificationData.userId,
                timestamp: now
            };
            delete notificationToInsert.userId;
            const { data, error } = await supabase_1.supabase
                .from(supabase_1.TABLES.NOTIFICATIONS)
                .insert(notificationToInsert)
                .select()
                .single();
            if (error)
                throw error;
            return data.id;
        }
        catch (error) {
            (0, supabase_1.handleSupabaseError)(error, 'addNotification');
        }
    }
    async getNotifications(userId) {
        try {
            let query = supabase_1.supabase.from(supabase_1.TABLES.NOTIFICATIONS).select('*');
            if (userId) {
                query = query.eq('user_id', userId);
            }
            const { data, error } = await query.order('timestamp', { ascending: false });
            if (error)
                throw error;
            return data || [];
        }
        catch (error) {
            (0, supabase_1.handleSupabaseError)(error, 'getNotifications');
        }
    }
    async getNotificationById(id) {
        try {
            const { data, error } = await supabase_1.supabase
                .from(supabase_1.TABLES.NOTIFICATIONS)
                .select('*')
                .eq('id', id)
                .single();
            if (error && error.code !== 'PGRST116')
                throw error;
            return data || undefined;
        }
        catch (error) {
            (0, supabase_1.handleSupabaseError)(error, 'getNotificationById');
        }
    }
    async updateNotification(id, update) {
        try {
            const { error } = await supabase_1.supabase
                .from(supabase_1.TABLES.NOTIFICATIONS)
                .update(update)
                .eq('id', id);
            if (error)
                throw error;
            return true;
        }
        catch (error) {
            (0, supabase_1.handleSupabaseError)(error, 'updateNotification');
        }
    }
    async deleteNotification(id) {
        try {
            const { error } = await supabase_1.supabase
                .from(supabase_1.TABLES.NOTIFICATIONS)
                .delete()
                .eq('id', id);
            if (error)
                throw error;
            return true;
        }
        catch (error) {
            (0, supabase_1.handleSupabaseError)(error, 'deleteNotification');
        }
    }
    async clearNotifications(userId) {
        try {
            const { error } = await supabase_1.supabase
                .from(supabase_1.TABLES.NOTIFICATIONS)
                .delete()
                .eq('user_id', userId);
            if (error)
                throw error;
        }
        catch (error) {
            (0, supabase_1.handleSupabaseError)(error, 'clearNotifications');
        }
    }
    async addProductMatch(matchData) {
        try {
            const now = new Date().toISOString();
            const matchToInsert = {
                source_product_id: matchData.sourceProductId,
                matched_product_id: matchData.matchedProductId,
                confidence: matchData.confidence,
                similarity: matchData.similarity,
                match_reason: matchData.matchReason,
                price_difference: matchData.priceDifference,
                price_difference_percent: matchData.priceDifferencePercent,
                savings: matchData.savings,
                created_at: now,
                updated_at: now
            };
            const { data, error } = await supabase_1.supabase
                .from(supabase_1.TABLES.PRODUCT_MATCHES)
                .insert(matchToInsert)
                .select()
                .single();
            if (error)
                throw error;
            return data.id;
        }
        catch (error) {
            (0, supabase_1.handleSupabaseError)(error, 'addProductMatch');
        }
    }
    async getProductMatches(sourceProductId) {
        try {
            const { data, error } = await supabase_1.supabase
                .from(supabase_1.TABLES.PRODUCT_MATCHES)
                .select('*')
                .eq('product_id', sourceProductId)
                .order('created_at', { ascending: false });
            if (error)
                throw error;
            return (data || []).map((match) => ({
                id: match.id,
                sourceProductId: match.source_product_id,
                matchedProductId: match.matched_product_id,
                confidence: match.confidence,
                similarity: match.similarity,
                matchReason: match.match_reason,
                priceDifference: match.price_difference,
                priceDifferencePercent: match.price_difference_percent,
                savings: match.savings,
                createdAt: match.created_at,
                updatedAt: match.updated_at
            }));
        }
        catch (error) {
            (0, supabase_1.handleSupabaseError)(error, 'getProductMatches');
        }
    }
    async deleteProductMatches(sourceProductId) {
        try {
            const { error } = await supabase_1.supabase
                .from(supabase_1.TABLES.PRODUCT_MATCHES)
                .delete()
                .eq('product_id', sourceProductId);
            if (error)
                throw error;
            return true;
        }
        catch (error) {
            (0, supabase_1.handleSupabaseError)(error, 'deleteProductMatches');
        }
    }
    async addPriceHistory(historyData) {
        try {
            const now = new Date().toISOString();
            const toInsert = {
                product_id: historyData.productId,
                price: historyData.price,
                currency: historyData.currency,
                timestamp: now
            };
            const { data, error } = await supabase_1.supabase
                .from(supabase_1.TABLES.PRICE_HISTORY)
                .insert(toInsert)
                .select()
                .single();
            if (error)
                throw error;
            return data.id;
        }
        catch (error) {
            (0, supabase_1.handleSupabaseError)(error, 'addPriceHistory');
        }
    }
    async getPriceHistory(productId) {
        try {
            const { data, error } = await supabase_1.supabase
                .from(supabase_1.TABLES.PRICE_HISTORY)
                .select('*')
                .eq('product_id', productId)
                .order('timestamp', { ascending: true });
            if (error)
                throw error;
            return data || [];
        }
        catch (error) {
            (0, supabase_1.handleSupabaseError)(error, 'getPriceHistory');
        }
    }
    async addPayment(paymentData) {
        try {
            const { data, error } = await supabase_1.supabase
                .from(supabase_1.TABLES.PAYMENTS)
                .insert(paymentData)
                .select()
                .single();
            if (error)
                throw error;
            return data.id;
        }
        catch (error) {
            (0, supabase_1.handleSupabaseError)(error, 'addPayment');
        }
    }
    async getUserPayments(userId) {
        try {
            const { data, error } = await supabase_1.supabase
                .from(supabase_1.TABLES.PAYMENTS)
                .select('*')
                .eq('userId', userId)
                .order('createdAt', { ascending: false });
            if (error)
                throw error;
            return data || [];
        }
        catch (error) {
            (0, supabase_1.handleSupabaseError)(error, 'getUserPayments');
        }
    }
    async getPaymentById(id) {
        try {
            const { data, error } = await supabase_1.supabase
                .from(supabase_1.TABLES.PAYMENTS)
                .select('*')
                .eq('id', id)
                .single();
            if (error && error.code !== 'PGRST116')
                throw error;
            return data || undefined;
        }
        catch (error) {
            (0, supabase_1.handleSupabaseError)(error, 'getPaymentById');
        }
    }
    async updatePayment(id, update) {
        try {
            const { error } = await supabase_1.supabase
                .from(supabase_1.TABLES.PAYMENTS)
                .update(update)
                .eq('id', id);
            if (error)
                throw error;
            return true;
        }
        catch (error) {
            (0, supabase_1.handleSupabaseError)(error, 'updatePayment');
        }
    }
    async addAffiliateTransaction(transactionData) {
        try {
            const { data, error } = await supabase_1.supabase
                .from(supabase_1.TABLES.AFFILIATE_TRANSACTIONS)
                .insert(transactionData)
                .select()
                .single();
            if (error)
                throw error;
            return data.id;
        }
        catch (error) {
            (0, supabase_1.handleSupabaseError)(error, 'addAffiliateTransaction');
        }
    }
    async getAffiliateTransactions(affiliateUserId) {
        try {
            const { data, error } = await supabase_1.supabase
                .from(supabase_1.TABLES.AFFILIATE_TRANSACTIONS)
                .select('*')
                .eq('affiliateUserId', affiliateUserId)
                .order('createdAt', { ascending: false });
            if (error)
                throw error;
            return data || [];
        }
        catch (error) {
            (0, supabase_1.handleSupabaseError)(error, 'getAffiliateTransactions');
        }
    }
    async getAffiliateReferrals(affiliateUserId) {
        try {
            const { data, error } = await supabase_1.supabase
                .from(supabase_1.TABLES.AFFILIATE_TRANSACTIONS)
                .select('referredUserId')
                .eq('affiliateUserId', affiliateUserId);
            if (error)
                throw error;
            const referredUserIds = data?.map((t) => t.referredUserId) || [];
            if (referredUserIds.length === 0)
                return [];
            const { data: users, error: usersError } = await supabase_1.supabase
                .from(supabase_1.TABLES.USERS)
                .select('*')
                .in('id', referredUserIds);
            if (usersError)
                throw usersError;
            return users || [];
        }
        catch (error) {
            (0, supabase_1.handleSupabaseError)(error, 'getAffiliateReferrals');
        }
    }
    async addPayoutRequest(payoutData) {
        try {
            const { data, error } = await supabase_1.supabase
                .from(supabase_1.TABLES.PAYOUT_REQUESTS)
                .insert(payoutData)
                .select()
                .single();
            if (error)
                throw error;
            return data.id;
        }
        catch (error) {
            (0, supabase_1.handleSupabaseError)(error, 'addPayoutRequest');
        }
    }
    async getPayoutRequests(affiliateUserId) {
        try {
            let query = supabase_1.supabase.from(supabase_1.TABLES.PAYOUT_REQUESTS).select('*');
            if (affiliateUserId) {
                query = query.eq('affiliateUserId', affiliateUserId);
            }
            const { data, error } = await query.order('requestedAt', { ascending: false });
            if (error)
                throw error;
            return data || [];
        }
        catch (error) {
            (0, supabase_1.handleSupabaseError)(error, 'getPayoutRequests');
        }
    }
    async updatePayoutRequest(id, update) {
        try {
            const { error } = await supabase_1.supabase
                .from(supabase_1.TABLES.PAYOUT_REQUESTS)
                .update(update)
                .eq('id', id);
            if (error)
                throw error;
            return true;
        }
        catch (error) {
            (0, supabase_1.handleSupabaseError)(error, 'updatePayoutRequest');
        }
    }
}
exports.default = new SupabaseStorage();
//# sourceMappingURL=supabaseStorage.js.map