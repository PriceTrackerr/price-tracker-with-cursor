"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TABLES = exports.supabasePublic = exports.supabase = void 0;
exports.handleSupabaseError = handleSupabaseError;
exports.isSupabaseConfigured = isSupabaseConfigured;
const supabase_js_1 = require("@supabase/supabase-js");
const supabaseUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseAnonKey = (process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const configuredService = !!(supabaseUrl && supabaseServiceKey);
const configuredPublic = !!(supabaseUrl && supabaseAnonKey);
exports.supabase = configuredService
    ? (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
    : null;
exports.supabasePublic = configuredPublic
    ? (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey)
    : null;
exports.TABLES = {
    USERS: 'users',
    PRODUCTS: 'products',
    ALERTS: 'alerts',
    NOTIFICATIONS: 'notifications',
    PRICE_HISTORY: 'price_history',
    PRODUCT_MATCHES: 'product_matches',
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
    AUTOMATION_RULES: 'automation_rules',
};
function handleSupabaseError(error, operation) {
    console.error(`Supabase ${operation} error:`, error);
    throw new Error(`Database ${operation} failed: ${error.message}`);
}
function isSupabaseConfigured() {
    const ready = configuredService && configuredPublic;
    console.log('Supabase configured:', ready, 'SUPABASE_URL set:', !!process.env.SUPABASE_URL || !!process.env.NEXT_PUBLIC_SUPABASE_URL, 'SUPABASE_ANON_KEY set:', !!process.env.SUPABASE_ANON_KEY || !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'SUPABASE_SERVICE_ROLE_KEY set:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
    if (!ready) {
        throw new Error('Supabase configuration incomplete');
    }
    return ready;
}
exports.default = exports.supabase;
//# sourceMappingURL=supabase.js.map