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
            const product = {
                ...productData,
                stockStatus: productData.stockStatus || 'unknown',
                discountInfo: productData.discountInfo ?? undefined,
                createdAt: now,
                updatedAt: now
            };
            const { data, error } = await supabase_1.supabase
                .from(supabase_1.TABLES.PRODUCTS)
                .insert(product)
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
                query = query.eq('userId', userId);
            }
            const { data, error } = await query.order('createdAt', { ascending: false });
            if (error)
                throw error;
            return data || [];
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
            return data || undefined;
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
            const { error } = await supabase_1.supabase
                .from(supabase_1.TABLES.PRODUCTS)
                .update({ ...update, updatedAt: new Date().toISOString() })
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
            const alert = {
                ...alertData,
                createdAt: now
            };
            const { data, error } = await supabase_1.supabase
                .from(supabase_1.TABLES.ALERTS)
                .insert(alert)
                .select()
                .single();
            if (error)
                throw error;
            return data.id;
        }
        catch (error) {
            (0, supabase_1.handleSupabaseError)(error, 'addAlert');
        }
    }
    async getAlerts(userId) {
        try {
            let query = supabase_1.supabase.from(supabase_1.TABLES.ALERTS).select('*');
            if (userId) {
                query = query.eq('userId', userId);
            }
            const { data, error } = await query.order('createdAt', { ascending: false });
            if (error)
                throw error;
            return data || [];
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
                .eq('isActive', true)
                .order('createdAt', { ascending: false });
            if (error)
                throw error;
            return data || [];
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
            return data || undefined;
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
            const notification = {
                ...notificationData,
                timestamp: now
            };
            const { data, error } = await supabase_1.supabase
                .from(supabase_1.TABLES.NOTIFICATIONS)
                .insert(notification)
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
                query = query.eq('userId', userId);
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
                .eq('userId', userId);
            if (error)
                throw error;
        }
        catch (error) {
            (0, supabase_1.handleSupabaseError)(error, 'clearNotifications');
        }
    }
    async addPriceHistory(historyData) {
        try {
            const now = new Date().toISOString();
            const history = {
                ...historyData,
                timestamp: now
            };
            const { data, error } = await supabase_1.supabase
                .from(supabase_1.TABLES.PRICE_HISTORY)
                .insert(history)
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
                .eq('productId', productId)
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