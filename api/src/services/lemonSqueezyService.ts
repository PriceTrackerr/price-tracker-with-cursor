import { lemonSqueezySetup } from '@lemonsqueezy/lemonsqueezy.js';
import crypto from 'crypto';

// Initialize LemonSqueezy with API key
const LEMONSQUEEZY_API_KEY = process.env.LEMONSQUEEZY_API_KEY || '';
const LEMONSQUEEZY_WEBHOOK_SECRET = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || '';
const LEMONSQUEEZY_STORE_ID = process.env.LEMONSQUEEZY_STORE_ID || '';

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
        variantId: string,
        email: string,
        customData?: Record<string, any>
    ): Promise<{ checkoutUrl: string; checkoutId: string }> {
        try {
            const { createCheckout } = await import('@lemonsqueezy/lemonsqueezy.js');

            console.log('Creating LemonSqueezy checkout:', {
                storeId: LEMONSQUEEZY_STORE_ID,
                variantId,
                email,
                userId
            });

            // Convert variant ID to number
            const variantIdNum = parseInt(variantId, 10);

            const checkoutData = {
                checkoutData: {
                    email,
                    custom: {
                        user_id: userId,
                        ...customData,
                    },
                },
            };

            console.log('Checkout data:', JSON.stringify(checkoutData, null, 2));

            const checkout: any = await createCheckout(LEMONSQUEEZY_STORE_ID, variantIdNum, checkoutData);

            console.log('LemonSqueezy response:', JSON.stringify(checkout, null, 2));

            if (!checkout || !checkout.data) {
                console.error('No checkout data returned from LemonSqueezy');
                throw new Error('Failed to create checkout session - no data returned');
            }

            const checkoutUrl = checkout.data.attributes?.url;
            const checkoutId = checkout.data.id;

            if (!checkoutUrl) {
                console.error('No checkout URL in response');
                throw new Error('Failed to create checkout session - no URL returned');
            }

            console.log('Checkout created successfully:', { checkoutUrl, checkoutId });

            return {
                checkoutUrl,
                checkoutId,
            };
        } catch (error: any) {
            console.error('Error creating checkout session:', error);
            console.error('Error details:', error.message);
            if (error.cause) {
                console.error('Error cause:', JSON.stringify(error.cause, null, 2));
            }
            throw error;
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

        console.log(`Subscription expired for user ${userId}`);
    }

    private async handlePaymentSuccess(data: any, supabase: any) {
        console.log(`Payment successful for subscription ${data.id}`);
    }

    private async handlePaymentFailed(data: any, supabase: any) {
        const userId = data.custom_data?.user_id;
        console.log(`Payment failed for user ${userId}`);
    }

    /**
     * Check if user has access to a feature
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
            console.error('Error fetching user:', error);
            return false;
        }

        const tier = user.subscription_tier || 'free';
        const tierConfig = SUBSCRIPTION_TIERS[tier];

        return tierConfig[feature] || false;
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
            console.error('Error fetching user:', userError);
            return { canTrack: false, currentCount: 0, limit: 5, tier: 'free' };
        }

        const tier = user.subscription_tier || 'free';
        const tierConfig = SUBSCRIPTION_TIERS[tier];
        const limit = tierConfig.productLimit;

        // Get today's count
        const today = new Date().toISOString().split('T')[0];

        const { count, error: countError } = await supabase
            .from('tracked_products')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('created_at', today);

        if (countError) {
            console.error('Error counting products:', countError);
            return { canTrack: false, currentCount: 0, limit, tier };
        }

        const currentCount = count || 0;

        return {
            canTrack: currentCount < limit,
            currentCount,
            limit,
            tier,
        };
    }

    /**
     * Check if user can send more notifications
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
            console.error('Error fetching user:', userError);
            return { canSend: false, currentCount: 0, limit: 1 };
        }

        const tier = user.subscription_tier || 'free';
        const tierConfig = SUBSCRIPTION_TIERS[tier];
        const limit = tierConfig.notificationsPerDay;

        // Get today's count
        const today = new Date().toISOString().split('T')[0];

        const { count, error: countError } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .gte('created_at', today);

        if (countError) {
            console.error('Error counting notifications:', countError);
            return { canSend: false, currentCount: 0, limit };
        }

        const currentCount = count || 0;

        return {
            canSend: currentCount < limit,
            currentCount,
            limit,
        };
    }
}

export default new LemonSqueezyService();
/ /   U p d a t e d  
 