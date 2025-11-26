import { lemonSqueezySetup } from '@lemonsqueezy/lemonsqueezy.js';
import crypto from 'crypto';

// Initialize LemonSqueezy with API key
const LEMONSQUEEZY_API_KEY = process.env.LEMONSQUEEZY_API_KEY || '';
const LEMONSQUEEZY_WEBHOOK_SECRET = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || '';
const LEMONSQUEEZY_STORE_ID = parseInt(process.env.LEMONSQUEEZY_STORE_ID || '0', 10);

lemonSqueezySetup({
    apiKey: LEMONSQUEEZY_API_KEY,
    onError: (error) => {
        console.error('LemonSqueezy Error:', error);
    },
});

export interface SubscriptionTier {
    name: 'free' | 'pro';
    productLimit: number;
    aiRecommendation: boolean;
    exportData: boolean;
    notificationsPerDay: number;
    trialDays?: number;
}

export const SUBSCRIPTION_TIERS: Record<string, SubscriptionTier> = {
    free: {
        name: 'free',
        productLimit: 5,
        aiRecommendation: false,
        exportData: false,
        notificationsPerDay: 1,
    },
    pro: {
        name: 'pro',
        productLimit: 999,
        aiRecommendation: true,
        exportData: true,
        notificationsPerDay: 100,
        trialDays: 7,
    },
};

class LemonSqueezyService {
    /**
     * Create a checkout session for a subscription
     */
    async createCheckoutSession(
        userId: string,
        planId: string,
        email: string,
        customData?: Record<string, any>
    ): Promise<{ checkoutUrl: string; checkoutId: string }> {
        try {
            const { createCheckout } = await import('@lemonsqueezy/lemonsqueezy.js');

            // Convert planId to number (LemonSqueezy expects numeric variant IDs)
            const variantId = parseInt(planId, 10);
            if (isNaN(variantId)) {
                throw new Error(`Invalid variant ID: ${planId}`);
            }

            console.log('Creating checkout with:', {
                storeId: LEMONSQUEEZY_STORE_ID,
                variantId,
                email
            });

            const checkout: any = await createCheckout(LEMONSQUEEZY_STORE_ID, variantId, {
                checkoutData: {
                    email,
                    custom: {
                        user_id: userId,
                        ...customData,
                    },
                },
            });

            if (!checkout || !checkout.data) {
                throw new Error('Failed to create checkout session');
            }

            return {
                checkoutUrl: checkout.data.attributes?.url || '',
                checkoutId: checkout.data.id || '',
            };
        } catch (error) {
            console.error('Error creating checkout session:', error);
            throw new Error('Failed to create checkout session');
        }
    }

    /**
     * Get subscription details
     */
    async getSubscription(subscriptionId: string) {
        try {
            const { getSubscription } = await import('@lemonsqueezy/lemonsqueezy.js');
            const subscription: any = await getSubscription(subscriptionId);
            return subscription.data;
        } catch (error) {
            console.error('Error fetching subscription:', error);
            throw new Error('Failed to fetch subscription');
        }
    }

    /**
     * Cancel a subscription
     */
    async cancelSubscription(subscriptionId: string) {
        try {
            const { cancelSubscription } = await import('@lemonsqueezy/lemonsqueezy.js');
            const result: any = await cancelSubscription(subscriptionId);
            return result.data;
        } catch (error) {
            console.error('Error canceling subscription:', error);
            throw new Error('Failed to cancel subscription');
        }
    }

    /**
     * Update subscription (upgrade/downgrade)
     */
    async updateSubscription(subscriptionId: string, variantId: number) {
        try {
            const { updateSubscription } = await import('@lemonsqueezy/lemonsqueezy.js');
            const result: any = await updateSubscription(subscriptionId, {
                variantId,
            });
            return result.data;
        } catch (error) {
            console.error('Error updating subscription:', error);
            throw new Error('Failed to update subscription');
        }
    }

    /**
     * Verify webhook signature
     */
    verifyWebhookSignature(payload: string, signature: string): boolean {
        try {
            const hmac = crypto.createHmac('sha256', LEMONSQUEEZY_WEBHOOK_SECRET);
            const digest = hmac.update(payload).digest('hex');
            return crypto.timingSafeEqual(
                Buffer.from(signature),
                Buffer.from(digest)
            );
        } catch (error) {
            console.error('Error verifying webhook signature:', error);
            return false;
        }
    }

    /**
     * Handle webhook events
     */
    async handleWebhookEvent(event: any, supabase: any) {
        const eventName = event.meta.event_name;
        const subscriptionData = event.data.attributes;

        console.log(`Processing webhook event: ${eventName}`);

        try {
            switch (eventName) {
                case 'subscription_created':
                    await this.handleSubscriptionCreated(subscriptionData, supabase);
                    break;

                case 'subscription_updated':
                    await this.handleSubscriptionUpdated(subscriptionData, supabase);
                    break;

                case 'subscription_cancelled':
                    await this.handleSubscriptionCancelled(subscriptionData, supabase);
                    break;

                case 'subscription_resumed':
                    await this.handleSubscriptionResumed(subscriptionData, supabase);
                    break;

                case 'subscription_expired':
                    await this.handleSubscriptionExpired(subscriptionData, supabase);
                    break;

                case 'subscription_payment_success':
                    await this.handlePaymentSuccess(subscriptionData, supabase);
                    break;

                case 'subscription_payment_failed':
                    await this.handlePaymentFailed(subscriptionData, supabase);
                    break;

                default:
                    console.log(`Unhandled event: ${eventName}`);
            }
        } catch (error) {
            console.error(`Error handling webhook event ${eventName}:`, error);
            throw error;
        }
    }

    private async handleSubscriptionCreated(data: any, supabase: any) {
        const userId = data.custom_data?.user_id;
        if (!userId) {
            throw new Error('User ID not found in subscription data');
        }

        const { error } = await supabase
            .from('users')
            .update({
                subscription_tier: 'pro',
                subscription_status: data.status,
                subscription_id: data.id,
                lemon_squeezy_customer_id: data.customer_id,
                subscription_renews_at: data.renews_at,
                subscription_ends_at: data.ends_at,
            })
            .eq('id', userId);

        if (error) {
            console.error('Error updating user subscription:', error);
            throw error;
        }

        console.log(`Subscription created for user ${userId}`);
    }

    private async handleSubscriptionUpdated(data: any, supabase: any) {
        const userId = data.custom_data?.user_id;
        if (!userId) {
            throw new Error('User ID not found in subscription data');
        }

        const { error } = await supabase
            .from('users')
            .update({
                subscription_status: data.status,
                subscription_renews_at: data.renews_at,
                subscription_ends_at: data.ends_at,
            })
            .eq('id', userId);

        if (error) {
            console.error('Error updating subscription:', error);
            throw error;
        }

        console.log(`Subscription updated for user ${userId}`);
    }

    private async handleSubscriptionCancelled(data: any, supabase: any) {
        const userId = data.custom_data?.user_id;
        if (!userId) {
            throw new Error('User ID not found in subscription data');
        }

        const { error } = await supabase
            .from('users')
            .update({
                subscription_status: 'cancelled',
                subscription_ends_at: data.ends_at,
            })
            .eq('id', userId);

        if (error) {
            console.error('Error cancelling subscription:', error);
            throw error;
        }

        console.log(`Subscription cancelled for user ${userId}`);
    }

    private async handleSubscriptionResumed(data: any, supabase: any) {
        const userId = data.custom_data?.user_id;
        if (!userId) {
            throw new Error('User ID not found in subscription data');
        }

        const { error } = await supabase
            .from('users')
            .update({
                subscription_status: 'active',
                subscription_renews_at: data.renews_at,
            })
            .eq('id', userId);

        if (error) {
            console.error('Error resuming subscription:', error);
            throw error;
        }

        console.log(`Subscription resumed for user ${userId}`);
    }

    private async handleSubscriptionExpired(data: any, supabase: any) {
        const userId = data.custom_data?.user_id;
        if (!userId) {
            throw new Error('User ID not found in subscription data');
        }

        const { error } = await supabase
            .from('users')
            .update({
                subscription_tier: 'free',
                subscription_status: 'expired',
            })
            .eq('id', userId);

        if (error) {
            console.error('Error expiring subscription:', error);
            throw error;
        }

        console.log(`Subscription expired for user ${userId}, downgraded to free tier`);
    }

    private async handlePaymentSuccess(data: any, supabase: any) {
        console.log(`Payment successful for subscription ${data.id}`);
        // Additional logic if needed (e.g., send confirmation email)
    }

    private async handlePaymentFailed(data: any, supabase: any) {
        const userId = data.custom_data?.user_id;
        if (!userId) {
            throw new Error('User ID not found in subscription data');
        }

        console.log(`Payment failed for user ${userId}`);
        // Additional logic (e.g., send payment failure notification)
    }

    /**
     * Check if user has access to a feature based on their subscription
     */
    async checkFeatureAccess(
        userId: string,
        feature: 'aiRecommendation' | 'exportData',
        supabase: any
    ): Promise<boolean> {
        const { data: user, error } = await supabase
            .from('users')
            .select('subscription_tier, subscription_status')
            .eq('id', userId)
            .single();

        if (error || !user) {
            return false;
        }

        // If subscription is not active, treat as free tier
        if (user.subscription_status !== 'active' && user.subscription_status !== 'on_trial') {
            user.subscription_tier = 'free';
        }

        const tier = SUBSCRIPTION_TIERS[user.subscription_tier || 'free'];
        return tier[feature] || false;
    }

    /**
     * Check if user can track more products
     */
    async checkProductLimit(userId: string, supabase: any): Promise<{
        canTrack: boolean;
        currentCount: number;
        limit: number;
        tier: string;
    }> {
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('subscription_tier, subscription_status')
            .eq('id', userId)
            .single();

        if (userError || !user) {
            throw new Error('User not found');
        }

        // If subscription is not active, treat as free tier
        let tier = user.subscription_tier || 'free';
        if (user.subscription_status !== 'active' && user.subscription_status !== 'on_trial') {
            tier = 'free';
        }

        const tierConfig = SUBSCRIPTION_TIERS[tier];
        const limit = tierConfig.productLimit;

        // Get current product count for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { count, error: countError } = await supabase
            .from('tracked_products')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('tracked_at', today.toISOString());

        if (countError) {
            throw new Error('Error fetching product count');
        }

        const currentCount = count || 0;
        const canTrack = currentCount < limit;

        return {
            canTrack,
            currentCount,
            limit,
            tier,
        };
    }

    /**
     * Check notification limit
     */
    async checkNotificationLimit(userId: string, supabase: any): Promise<{
        canSend: boolean;
        currentCount: number;
        limit: number;
    }> {
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('subscription_tier, subscription_status')
            .eq('id', userId)
            .single();

        if (userError || !user) {
            throw new Error('User not found');
        }

        // If subscription is not active, treat as free tier
        let tier = user.subscription_tier || 'free';
        if (user.subscription_status !== 'active' && user.subscription_status !== 'on_trial') {
            tier = 'free';
        }

        const tierConfig = SUBSCRIPTION_TIERS[tier];
        const limit = tierConfig.notificationsPerDay;

        // Get notification count for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { count, error: countError } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('created_at', today.toISOString());

        if (countError) {
            throw new Error('Error fetching notification count');
        }

        const currentCount = count || 0;
        const canSend = currentCount < limit;

        return {
            canSend,
            currentCount,
            limit,
        };
    }
}

export default new LemonSqueezyService();
