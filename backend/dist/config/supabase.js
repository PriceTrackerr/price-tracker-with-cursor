"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TABLES = exports.supabasePublic = exports.supabase = void 0;
exports.handleSupabaseError = handleSupabaseError;
exports.isSupabaseConfigured = isSupabaseConfigured;
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}
exports.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
exports.supabasePublic = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
exports.TABLES = {
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
};
function handleSupabaseError(error, operation) {
    console.error(`Supabase ${operation} error:`, error);
    throw new Error(`Database ${operation} failed: ${error.message}`);
}
function isSupabaseConfigured() {
    return !!(supabaseUrl && supabaseServiceKey);
}
exports.default = exports.supabase;
//# sourceMappingURL=supabase.js.map