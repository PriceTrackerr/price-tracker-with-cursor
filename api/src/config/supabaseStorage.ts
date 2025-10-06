import { supabase, TABLES, handleSupabaseError } from './supabase';
import type { 
  Product, User, Alert, Notification, PriceHistory, Payment, 
  AffiliateTransaction, PayoutRequest, SubscriptionPlan,
  CouponInfo, CouponStack, PriceGuarantee, ExpertCurator,
  WatchlistShared, CommunityVote, DealComment, GlobalMarketData,
  AutomationRule
} from './storage';

// Product Match interface
interface ProductMatch {
  id?: string;
  sourceProductId: string;
  matchedProductId: string;
  confidence: number;
  similarity: number;
  matchReason: string;
  priceDifference: number;
  priceDifferencePercent: number;
  savings: string;
  createdAt: string;
  updatedAt: string;
}

class SupabaseStorage {
  // Subscription plan methods
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.SUBSCRIPTION_PLANS)
        .select('*')
        .order('price', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleSupabaseError(error, 'getSubscriptionPlans');
    }
  }

  async getDeletedSubscriptionPlanIds(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.SUBSCRIPTION_PLANS)
        .select('id')
        .eq('deleted', true);

      if (error) throw error;
      return (data as Array<{ id: string }> | null)?.map((item: { id: string }) => item.id) || [];
    } catch (error) {
      handleSupabaseError(error, 'getDeletedSubscriptionPlanIds');
    }
  }

  async setSubscriptionPlans(plans: SubscriptionPlan[]): Promise<void> {
    try {
      // Clear existing plans
      const { error: deleteError } = await supabase
        .from(TABLES.SUBSCRIPTION_PLANS)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all except dummy

      if (deleteError) throw deleteError;

      // Insert new plans
      if (plans.length > 0) {
        const { error: insertError } = await supabase
          .from(TABLES.SUBSCRIPTION_PLANS)
          .insert(plans);

        if (insertError) throw insertError;
      }
    } catch (error) {
      handleSupabaseError(error, 'setSubscriptionPlans');
    }
  }

  async addSubscriptionPlan(plan: SubscriptionPlan): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLES.SUBSCRIPTION_PLANS)
        .insert(plan);

      if (error) throw error;
    } catch (error) {
      handleSupabaseError(error, 'addSubscriptionPlan');
    }
  }

  async updateSubscriptionPlan(id: string, update: Partial<SubscriptionPlan>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(TABLES.SUBSCRIPTION_PLANS)
        .update(update)
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      handleSupabaseError(error, 'updateSubscriptionPlan');
    }
  }

  async deleteSubscriptionPlan(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(TABLES.SUBSCRIPTION_PLANS)
        .update({ deleted: true })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      handleSupabaseError(error, 'deleteSubscriptionPlan');
    }
  }

  // Product methods
  async addProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = new Date().toISOString();
      // Map to snake_case columns expected by Supabase
      const toInsert: any = {
        url: (productData as any).url,
        title: (productData as any).title,
        price: (productData as any).price,
        currency: (productData as any).currency,
        platform: (productData as any).platform,
        image_url: (productData as any).imageUrl || '',
        user_id: (productData as any).userId,
        stock_status: (productData as any).stockStatus || 'unknown',
        discount_info: (productData as any).discountInfo ?? undefined,
        created_at: now,
        updated_at: now
      };

      const { data, error } = await supabase
        .from(TABLES.PRODUCTS)
        .insert(toInsert)
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      handleSupabaseError(error, 'addProduct');
    }
  }

  async getProducts(userId?: string): Promise<Product[]> {
    try {
      let query = supabase.from(TABLES.PRODUCTS).select('*');

      if (userId) {
        // DB uses snake_case: user_id
        query = query.eq('user_id', userId);
      }

      // DB uses snake_case: created_at
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      const mapped = (data || []).map((row: any) => ({
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
    } catch (error) {
      handleSupabaseError(error, 'getProducts');
    }
  }

  async getProductById(id: string): Promise<Product | undefined> {
    try {
      const { data, error } = await supabase
        .from(TABLES.PRODUCTS)
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      if (!data) return undefined;
      const row: any = data;
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
      } as any;
    } catch (error) {
      handleSupabaseError(error, 'getProductById');
    }
  }

  async deleteProduct(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(TABLES.PRODUCTS)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      handleSupabaseError(error, 'deleteProduct');
    }
  }

  async updateProduct(id: string, update: Partial<Product>): Promise<boolean> {
    try {
      // Map known camelCase fields to snake_case
      const mapped: any = {};
      const mapField = (from: string, to: string) => {
        if ((update as any)[from] !== undefined) mapped[to] = (update as any)[from];
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

      const { error } = await supabase
        .from(TABLES.PRODUCTS)
        .update(mapped)
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      handleSupabaseError(error, 'updateProduct');
    }
  }

  // User methods
  async addUser(userData: Omit<User, 'id' | 'createdAt' | 'lastLogin'>): Promise<string> {
    try {
      const now = new Date().toISOString();
      const user: Omit<User, 'id'> = {
        ...userData,
        createdAt: now,
        lastLogin: now
      };

      const { data, error } = await supabase
        .from(TABLES.USERS)
        .insert(user)
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      handleSupabaseError(error, 'addUser');
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || undefined;
    } catch (error) {
      handleSupabaseError(error, 'getUserByEmail');
    }
  }

  async getUserById(id: string): Promise<User | undefined> {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || undefined;
    } catch (error) {
      handleSupabaseError(error, 'getUserById');
    }
  }

  async updateUser(id: string, update: Partial<User>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(TABLES.USERS)
        .update(update)
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      handleSupabaseError(error, 'updateUser');
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(TABLES.USERS)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      handleSupabaseError(error, 'deleteUser');
    }
  }

  async getUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .order('createdAt', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleSupabaseError(error, 'getUsers');
    }
  }

  // Alert methods
  async addAlert(alertData: Omit<Alert, 'id' | 'createdAt'>): Promise<string> {
    try {
      const now = new Date().toISOString();
      // Map to snake_case columns stored in Supabase
      const alertToInsert: any = {
        user_id: (alertData as any).userId,
        product_id: (alertData as any).productId,
        product_title: (alertData as any).productTitle,
        target_price: (alertData as any).targetPrice,
        current_price: (alertData as any).currentPrice,
        is_active: (alertData as any).isActive,
        email: (alertData as any).email || null,
        created_at: now
      };

      // Skip notify_on_restock for now - column might not exist in schema
      // TODO: Add notify_on_restock column to Supabase alerts table

      console.log('🔍 Inserting alert with data:', alertToInsert);

      const { data, error } = await supabase
        .from(TABLES.ALERTS)
        .insert(alertToInsert)
        .select()
        .single();

      if (error) {
        console.error('🚨 Supabase insert error:', error);
        throw error;
      }
      
      console.log('✅ Alert created successfully with ID:', data.id);
      return data.id;
    } catch (error) {
      console.error('🚨 addAlert error:', error);
      handleSupabaseError(error, 'addAlert');
    }
  }

  async getAlerts(userId?: string): Promise<Alert[]> {
    try {
      let query = supabase.from(TABLES.ALERTS).select('*');
      
      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map snake_case columns back to camelCase
      return (data || []).map((alert: any) => ({
        id: alert.id,
        productId: alert.product_id,
        productTitle: alert.product_title,
        targetPrice: alert.target_price,
        currentPrice: alert.current_price,
        isActive: alert.is_active,
        email: alert.email,
        notifyOnRestock: alert.notify_on_restock || false, // Default to false if column doesn't exist
        createdAt: alert.created_at,
        userId: alert.user_id
      }));
    } catch (error) {
      handleSupabaseError(error, 'getAlerts');
    }
  }

  async getAllAlerts(): Promise<Alert[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.ALERTS)
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map((alert: any) => ({
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
    } catch (error) {
      handleSupabaseError(error, 'getAllAlerts');
    }
  }

  async getAlertById(id: string): Promise<Alert | undefined> {
    try {
      const { data, error } = await supabase
        .from(TABLES.ALERTS)
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || undefined;
    } catch (error) {
      handleSupabaseError(error, 'getAlertById');
    }
  }

  async updateAlert(id: string, update: Partial<Alert>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(TABLES.ALERTS)
        .update(update)
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      handleSupabaseError(error, 'updateAlert');
    }
  }

  async deleteAlert(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(TABLES.ALERTS)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      handleSupabaseError(error, 'deleteAlert');
    }
  }

  // Notification methods
  async addNotification(notificationData: Omit<Notification, 'id' | 'timestamp'>): Promise<string> {
    try {
      const now = new Date().toISOString();
      const notificationToInsert: any = {
        ...notificationData,
        user_id: (notificationData as any).userId,
        timestamp: now
      };
      delete (notificationToInsert as any).userId;

      const { data, error } = await supabase
        .from(TABLES.NOTIFICATIONS)
        .insert(notificationToInsert)
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      handleSupabaseError(error, 'addNotification');
    }
  }

  async getNotifications(userId?: string): Promise<Notification[]> {
    try {
      let query = supabase.from(TABLES.NOTIFICATIONS).select('*');
      
      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query.order('timestamp', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleSupabaseError(error, 'getNotifications');
    }
  }

  async getNotificationById(id: string): Promise<Notification | undefined> {
    try {
      const { data, error } = await supabase
        .from(TABLES.NOTIFICATIONS)
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || undefined;
    } catch (error) {
      handleSupabaseError(error, 'getNotificationById');
    }
  }

  async updateNotification(id: string, update: Partial<Notification>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(TABLES.NOTIFICATIONS)
        .update(update)
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      handleSupabaseError(error, 'updateNotification');
    }
  }

  async deleteNotification(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(TABLES.NOTIFICATIONS)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      handleSupabaseError(error, 'deleteNotification');
    }
  }

  async clearNotifications(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from(TABLES.NOTIFICATIONS)
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      handleSupabaseError(error, 'clearNotifications');
    }
  }

  // Product match methods
  async addProductMatch(matchData: Omit<ProductMatch, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = new Date().toISOString();
      const matchToInsert: any = {
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

      const { data, error } = await supabase
        .from(TABLES.PRODUCT_MATCHES)
        .insert(matchToInsert)
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      handleSupabaseError(error, 'addProductMatch');
    }
  }

  async getProductMatches(sourceProductId: string): Promise<ProductMatch[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.PRODUCT_MATCHES)
        .select('*')
        .eq('source_product_id', sourceProductId)
        .order('confidence', { ascending: false });

      if (error) throw error;
      
      return (data || []).map((match: any) => ({
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
    } catch (error) {
      handleSupabaseError(error, 'getProductMatches');
    }
  }

  async deleteProductMatches(sourceProductId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(TABLES.PRODUCT_MATCHES)
        .delete()
        .eq('source_product_id', sourceProductId);

      if (error) throw error;
      return true;
    } catch (error) {
      handleSupabaseError(error, 'deleteProductMatches');
    }
  }

  // Price history methods
  async addPriceHistory(historyData: Omit<PriceHistory, 'id' | 'timestamp'>): Promise<string> {
    try {
      const now = new Date().toISOString();
      // Map to snake_case columns
      const toInsert: any = {
        product_id: (historyData as any).productId,
        price: (historyData as any).price,
        currency: (historyData as any).currency,
        timestamp: now
      };

      const { data, error } = await supabase
        .from(TABLES.PRICE_HISTORY)
        .insert(toInsert)
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      handleSupabaseError(error, 'addPriceHistory');
    }
  }

  async getPriceHistory(productId: string): Promise<PriceHistory[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.PRICE_HISTORY)
        .select('*')
        .eq('product_id', productId)
        .order('timestamp', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleSupabaseError(error, 'getPriceHistory');
    }
  }

  // Payment methods
  async addPayment(paymentData: Payment): Promise<string> {
    try {
      const { data, error } = await supabase
        .from(TABLES.PAYMENTS)
        .insert(paymentData)
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      handleSupabaseError(error, 'addPayment');
    }
  }

  async getUserPayments(userId: string): Promise<Payment[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.PAYMENTS)
        .select('*')
        .eq('userId', userId)
        .order('createdAt', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleSupabaseError(error, 'getUserPayments');
    }
  }

  async getPaymentById(id: string): Promise<Payment | undefined> {
    try {
      const { data, error } = await supabase
        .from(TABLES.PAYMENTS)
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || undefined;
    } catch (error) {
      handleSupabaseError(error, 'getPaymentById');
    }
  }

  async updatePayment(id: string, update: Partial<Payment>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(TABLES.PAYMENTS)
        .update(update)
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      handleSupabaseError(error, 'updatePayment');
    }
  }

  // Affiliate methods
  async addAffiliateTransaction(transactionData: AffiliateTransaction): Promise<string> {
    try {
      const { data, error } = await supabase
        .from(TABLES.AFFILIATE_TRANSACTIONS)
        .insert(transactionData)
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      handleSupabaseError(error, 'addAffiliateTransaction');
    }
  }

  async getAffiliateTransactions(affiliateUserId: string): Promise<AffiliateTransaction[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.AFFILIATE_TRANSACTIONS)
        .select('*')
        .eq('affiliateUserId', affiliateUserId)
        .order('createdAt', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleSupabaseError(error, 'getAffiliateTransactions');
    }
  }

  async getAffiliateReferrals(affiliateUserId: string): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.AFFILIATE_TRANSACTIONS)
        .select('referredUserId')
        .eq('affiliateUserId', affiliateUserId);

      if (error) throw error;

      const referredUserIds = (data as Array<{ referredUserId: string }> | null)?.map((t: { referredUserId: string }) => t.referredUserId) || [];
      
      if (referredUserIds.length === 0) return [];

      const { data: users, error: usersError } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .in('id', referredUserIds);

      if (usersError) throw usersError;
      return users || [];
    } catch (error) {
      handleSupabaseError(error, 'getAffiliateReferrals');
    }
  }

  async addPayoutRequest(payoutData: PayoutRequest): Promise<string> {
    try {
      const { data, error } = await supabase
        .from(TABLES.PAYOUT_REQUESTS)
        .insert(payoutData)
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      handleSupabaseError(error, 'addPayoutRequest');
    }
  }

  async getPayoutRequests(affiliateUserId?: string): Promise<PayoutRequest[]> {
    try {
      let query = supabase.from(TABLES.PAYOUT_REQUESTS).select('*');
      
      if (affiliateUserId) {
        query = query.eq('affiliateUserId', affiliateUserId);
      }

      const { data, error } = await query.order('requestedAt', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleSupabaseError(error, 'getPayoutRequests');
    }
  }

  async updatePayoutRequest(id: string, update: Partial<PayoutRequest>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from(TABLES.PAYOUT_REQUESTS)
        .update(update)
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      handleSupabaseError(error, 'updatePayoutRequest');
    }
  }
}

export default new SupabaseStorage(); 