import { supabase, TABLES, handleSupabaseError } from './supabase';
import type { 
  Product, User, Alert, Notification, PriceHistory, Payment, 
  AffiliateTransaction, PayoutRequest, SubscriptionPlan,
  CouponInfo, CouponStack, PriceGuarantee, ExpertCurator,
  WatchlistShared, CommunityVote, DealComment, GlobalMarketData,
  AutomationRule
} from './storage';

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
      const product: Omit<Product, 'id'> = {
        ...productData,
        stockStatus: productData.stockStatus || 'unknown',
        discountInfo: productData.discountInfo ?? undefined,
        createdAt: now,
        updatedAt: now
      };

      const { data, error } = await supabase
        .from(TABLES.PRODUCTS)
        .insert(product)
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
      return data || [];
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
      return data || undefined;
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
      const { error } = await supabase
        .from(TABLES.PRODUCTS)
        .update({ ...update, updatedAt: new Date().toISOString() })
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
        ...alertData,
        user_id: (alertData as any).userId,
        created_at: now
      };
      delete (alertToInsert as any).userId;
      delete (alertToInsert as any).createdAt;

      const { data, error } = await supabase
        .from(TABLES.ALERTS)
        .insert(alertToInsert)
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
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
      return data || [];
    } catch (error) {
      handleSupabaseError(error, 'getAlerts');
    }
  }

  async getAllAlerts(): Promise<Alert[]> {
    try {
      const { data, error } = await supabase
        .from(TABLES.ALERTS)
        .select('*')
        .eq('isActive', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
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

  // Price history methods
  async addPriceHistory(historyData: Omit<PriceHistory, 'id' | 'timestamp'>): Promise<string> {
    try {
      const now = new Date().toISOString();
      const history: Omit<PriceHistory, 'id'> = {
        ...historyData,
        timestamp: now
      };

      const { data, error } = await supabase
        .from(TABLES.PRICE_HISTORY)
        .insert(history)
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
        .eq('productId', productId)
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