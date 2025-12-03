"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUBSCRIPTION_TIERS = void 0;
const lemonsqueezy_js_1 = require("@lemonsqueezy/lemonsqueezy.js");
const crypto_1 = __importDefault(require("crypto"));
const LEMONSQUEEZY_API_KEY = process.env.LEMONSQUEEZY_API_KEY || '';
const LEMONSQUEEZY_WEBHOOK_SECRET = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || '';
const LEMONSQUEEZY_STORE_ID = parseInt(process.env.LEMONSQUEEZY_STORE_ID || '0', 10);
(0, lemonsqueezy_js_1.lemonSqueezySetup)({
    apiKey: LEMONSQUEEZY_API_KEY,
    onError: (error) => {
        console.error('LemonSqueezy Error:', error);
    },
});
exports.SUBSCRIPTION_TIERS = {
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
    async createCheckoutSession(userId, planId, email, customData) {
        try {
            const { createCheckout } = await Promise.resolve().then(() => __importStar(require('@lemonsqueezy/lemonsqueezy.js')));
            const variantId = parseInt(planId, 10);
            if (isNaN(variantId)) {
                throw new Error(`Invalid variant ID: ${planId}`);
            }
            console.log('Creating checkout with:', {
                storeId: LEMONSQUEEZY_STORE_ID,
                variantId,
                email
            });
            const checkout = await createCheckout(LEMONSQUEEZY_STORE_ID, variantId, {
                checkoutData: {
                    email,
                    custom: {
                        user_id: userId,
                        ...customData,
                    },
                },
            });
            console.log('LemonSqueezy checkout response:', JSON.stringify(checkout, null, 2));
            if (!checkout || !checkout.data || !checkout.data.data) {
                console.error('Checkout failed - no data in response');
                throw new Error('Failed to create checkout session');
            }
            const checkoutUrl = checkout.data.data.attributes?.url || '';
            const checkoutId = checkout.data.data.id || '';
            console.log('Extracted checkout URL:', checkoutUrl);
            console.log('Extracted checkout ID:', checkoutId);
            return {
                checkoutUrl,
                checkoutId,
            };
        }
        catch (error) {
            console.error('Error creating checkout session:', error);
            throw new Error('Failed to create checkout session');
        }
    }
    async getSubscription(subscriptionId) {
        try {
            const { getSubscription } = await Promise.resolve().then(() => __importStar(require('@lemonsqueezy/lemonsqueezy.js')));
            const subscription = await getSubscription(subscriptionId);
            return subscription.data;
        }
        catch (error) {
            console.error('Error fetching subscription:', error);
            throw new Error('Failed to fetch subscription');
        }
    }
    async cancelSubscription(subscriptionId) {
        try {
            const { cancelSubscription } = await Promise.resolve().then(() => __importStar(require('@lemonsqueezy/lemonsqueezy.js')));
            const result = await cancelSubscription(subscriptionId);
            return result.data;
        }
        catch (error) {
            console.error('Error canceling subscription:', error);
            throw new Error('Failed to cancel subscription');
        }
    }
    async updateSubscription(subscriptionId, variantId) {
        try {
            const { updateSubscription } = await Promise.resolve().then(() => __importStar(require('@lemonsqueezy/lemonsqueezy.js')));
            const result = await updateSubscription(subscriptionId, {
                variantId,
            });
            return result.data;
        }
        catch (error) {
            console.error('Error updating subscription:', error);
            throw new Error('Failed to update subscription');
        }
    }
    verifyWebhookSignature(payload, signature) {
        try {
            const hmac = crypto_1.default.createHmac('sha256', LEMONSQUEEZY_WEBHOOK_SECRET);
            const digest = hmac.update(payload).digest('hex');
            return crypto_1.default.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
        }
        catch (error) {
            console.error('Error verifying webhook signature:', error);
            return false;
        }
    }
    async handleWebhookEvent(event, supabase) {
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
        }
        catch (error) {
            console.error(`Error handling webhook event ${eventName}:`, error);
            throw error;
        }
    }
    async handleSubscriptionCreated(data, supabase) {
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
    async handleSubscriptionUpdated(data, supabase) {
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
    async handleSubscriptionCancelled(data, supabase) {
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
    async handleSubscriptionResumed(data, supabase) {
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
    async handleSubscriptionExpired(data, supabase) {
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
    async handlePaymentSuccess(data, supabase) {
        console.log(`Payment successful for subscription ${data.id}`);
    }
    async handlePaymentFailed(data, supabase) {
        const userId = data.custom_data?.user_id;
        if (!userId) {
            throw new Error('User ID not found in subscription data');
        }
        console.log(`Payment failed for user ${userId}`);
    }
    async checkFeatureAccess(userId, feature, supabase) {
        const { data: user, error } = await supabase
            .from('users')
            .select('subscription_tier, subscription_status')
            .eq('id', userId)
            .single();
        if (error || !user) {
            return false;
        }
        if (user.subscription_status !== 'active' && user.subscription_status !== 'on_trial') {
            user.subscription_tier = 'free';
        }
        const tier = exports.SUBSCRIPTION_TIERS[user.subscription_tier || 'free'];
        return tier[feature] || false;
    }
    async checkProductLimit(userId, supabase) {
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('subscription_tier, subscription_status')
            .eq('id', userId)
            .single();
        if (userError || !user) {
            throw new Error('User not found');
        }
        let tier = user.subscription_tier || 'free';
        if (user.subscription_status !== 'active' && user.subscription_status !== 'on_trial') {
            tier = 'free';
        }
        const tierConfig = exports.SUBSCRIPTION_TIERS[tier];
        const limit = tierConfig.productLimit;
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
    async checkNotificationLimit(userId, supabase) {
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('subscription_tier, subscription_status')
            .eq('id', userId)
            .single();
        if (userError || !user) {
            throw new Error('User not found');
        }
        let tier = user.subscription_tier || 'free';
        if (user.subscription_status !== 'active' && user.subscription_status !== 'on_trial') {
            tier = 'free';
        }
        const tierConfig = exports.SUBSCRIPTION_TIERS[tier];
        const limit = tierConfig.notificationsPerDay;
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
exports.default = new LemonSqueezyService();
//# sourceMappingURL=lemonSqueezyService.js.map