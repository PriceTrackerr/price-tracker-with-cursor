import fileStorage from './storage';
import supabaseStorage from './supabaseStorage';
import { isSupabaseConfigured } from './supabase';

export type Db = {
  // Users
  getUserByEmail(email: string): Promise<any>;
  getUserById(id: string): Promise<any>;
  getUsers(): Promise<any[]>;
  addUser(userData: any): Promise<string>;
  updateUser(id: string, update: any): Promise<boolean> | Promise<void>;
  deleteUser(id: string): Promise<boolean> | Promise<void>;

  // Products
  getProducts(userId?: string): Promise<any[]>;
  addProduct(productData: any): Promise<string>;
  getProductById(id: string): Promise<any | undefined>;
  updateProduct(id: string, update: any): Promise<boolean>;
  deleteProduct(id: string): Promise<boolean>;

  // Alerts
  getAlerts(userId?: string): Promise<any[]>;
  getAllAlerts(): Promise<any[]>;
  getAlertById(id: string): Promise<any | undefined>;
  addAlert(alertData: any): Promise<string>;
  updateAlert(id: string, update: any): Promise<boolean>;
  deleteAlert(id: string): Promise<boolean>;

  // Notifications
  getNotifications(userId?: string): Promise<any[]>;
  getNotificationById(id: string): Promise<any | undefined>;
  addNotification(data: any): Promise<string>;
  updateNotification(id: string, update: any): Promise<boolean>;
  deleteNotification(id: string): Promise<boolean>;
  clearNotifications(userId: string): Promise<void>;

  // Price history
  addPriceHistory(data: any): Promise<string>;
  getPriceHistory(productId: string): Promise<any[]>;

  // Payments
  addPayment(payment: any): Promise<string>;
  getUserPayments(userId: string): Promise<any[]>;
  getPaymentById(id: string): Promise<any | undefined>;
  updatePayment(id: string, update: any): Promise<boolean>;

  // Affiliate
  addAffiliateTransaction(data: any): Promise<string>;
  getAffiliateTransactions(affiliateUserId: string): Promise<any[]>;
  getAffiliateReferrals(affiliateUserId: string): Promise<any[]>;
  addPayoutRequest(data: any): Promise<string>;
  getPayoutRequests(affiliateUserId?: string): Promise<any[]>;
  updatePayoutRequest(id: string, update: any): Promise<boolean>;

  // Subscription plans (some methods may exist only on certain backends)
  getSubscriptionPlans(): Promise<any[]>;
  getDeletedSubscriptionPlanIds?: () => Promise<string[]>;
  setSubscriptionPlans?: (plans: any[]) => Promise<void>;
  addSubscriptionPlan?: (plan: any) => Promise<void>;
  updateSubscriptionPlan?: (id: string, update: any) => Promise<boolean>;
  deleteSubscriptionPlan?: (id: string) => Promise<boolean>;
};

// Factory that returns the active database implementation
export function getDb(): Db {
  const forceLocal = process.env.USE_LOCAL_DB === 'true';
  const forceSupabase = process.env.USE_SUPABASE === 'true';

  if (!forceLocal) {
    try {
      if (forceSupabase || isSupabaseConfigured()) {
        return supabaseStorage as unknown as Db; // Supabase-backed storage
      }
    } catch (_) {
      // Supabase not configured; fall back to file storage
    }
  }

  return fileStorage as unknown as Db; // JSON file-backed storage
}