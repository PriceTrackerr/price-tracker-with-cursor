import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

// Create Supabase client with service role key for admin operations
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Create public client for user operations
export const supabasePublic = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// Database table names
export const TABLES = {
  USERS: 'users',
  PRODUCTS: 'products',
  ALERTS: 'alerts',
  NOTIFICATIONS: 'notifications',
  PRICE_HISTORY: 'price_history',
  PAYMENTS: 'payments',
  AFFILIATE_TRANSACTIONS: 'affiliate_transactions',
  PAYOUT_REQUESTS: 'payout_requests',
  SUBSCRIPTION_PLANS: 'subscription_plans',
  COUPONS: 'coupons',
  COUPON_STACKS: 'coupon_stacks',
  PRICE_GUARANTEES: 'price_guarantees',
  EXPERT_CURATORS: 'expert_curators',
  SHARED_WATCHLISTS: 'shared_watchlists',
  COMMUNITY_VOTES: 'community_votes',
  DEAL_COMMENTS: 'deal_comments',
  GLOBAL_MARKET_DATA: 'global_market_data',
  AUTOMATION_RULES: 'automation_rules'
} as const;

// Helper function to handle Supabase errors
export function handleSupabaseError(error: any, operation: string): never {
  console.error(`Supabase ${operation} error:`, error);
  throw new Error(`Database ${operation} failed: ${error.message}`);
}

// Helper function to check if Supabase is properly configured
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseServiceKey);
}

export default supabase; 