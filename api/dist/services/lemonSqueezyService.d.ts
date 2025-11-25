export interface SubscriptionTier {
    name: 'free' | 'pro';
    productLimit: number;
    aiRecommendation: boolean;
    exportData: boolean;
    notificationsPerDay: number;
    trialDays?: number;
}
export declare const SUBSCRIPTION_TIERS: Record<string, SubscriptionTier>;
declare class LemonSqueezyService {
    createCheckoutSession(userId: string, planId: string, email: string, customData?: Record<string, any>): Promise<{
        checkoutUrl: string;
        checkoutId: string;
    }>;
    getSubscription(subscriptionId: string): Promise<any>;
    cancelSubscription(subscriptionId: string): Promise<any>;
    updateSubscription(subscriptionId: string, variantId: number): Promise<any>;
    verifyWebhookSignature(payload: string, signature: string): boolean;
    handleWebhookEvent(event: any, supabase: any): Promise<void>;
    private handleSubscriptionCreated;
    private handleSubscriptionUpdated;
    private handleSubscriptionCancelled;
    private handleSubscriptionResumed;
    private handleSubscriptionExpired;
    private handlePaymentSuccess;
    private handlePaymentFailed;
    checkFeatureAccess(userId: string, feature: 'aiRecommendation' | 'exportData', supabase: any): Promise<boolean>;
    checkProductLimit(userId: string, supabase: any): Promise<{
        canTrack: boolean;
        currentCount: number;
        limit: number;
        tier: string;
    }>;
    checkNotificationLimit(userId: string, supabase: any): Promise<{
        canSend: boolean;
        currentCount: number;
        limit: number;
    }>;
}
declare const _default: LemonSqueezyService;
export default _default;
//# sourceMappingURL=lemonSqueezyService.d.ts.map