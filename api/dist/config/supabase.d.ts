export declare const supabase: any;
export declare const supabasePublic: any;
export declare const TABLES: {
    readonly USERS: "users";
    readonly PRODUCTS: "products";
    readonly ALERTS: "alerts";
    readonly NOTIFICATIONS: "notifications";
    readonly PRICE_HISTORY: "price_history";
    readonly PAYMENTS: "payments";
    readonly AFFILIATE_TRANSACTIONS: "affiliate_transactions";
    readonly PAYOUT_REQUESTS: "payout_requests";
    readonly SUBSCRIPTION_PLANS: "subscription_plans";
    readonly COUPONS: "coupons";
    readonly COUPON_STACKS: "coupon_stacks";
    readonly PRICE_GUARANTEES: "price_guarantees";
    readonly EXPERT_CURATORS: "expert_curators";
    readonly SHARED_WATCHLISTS: "shared_watchlists";
    readonly COMMUNITY_VOTES: "community_votes";
    readonly DEAL_COMMENTS: "deal_comments";
    readonly GLOBAL_MARKET_DATA: "global_market_data";
    readonly AUTOMATION_RULES: "automation_rules";
};
export declare function handleSupabaseError(error: any, operation: string): never;
export declare function isSupabaseConfigured(): boolean;
export default supabase;
//# sourceMappingURL=supabase.d.ts.map