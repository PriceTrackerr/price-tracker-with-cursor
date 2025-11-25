"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const lemonSqueezyService_1 = __importDefault(require("../services/lemonSqueezyService"));
const supabase_js_1 = require("@supabase/supabase-js");
const router = express_1.default.Router();
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');
router.post('/create-checkout', async (req, res) => {
    try {
        const { planId, userId, email } = req.body;
        if (!planId || !userId || !email) {
            return res.status(400).json({
                error: 'Missing required fields: planId, userId, email',
            });
        }
        const checkout = await lemonSqueezyService_1.default.createCheckoutSession(userId, planId, email);
        res.json({
            success: true,
            checkoutUrl: checkout.checkoutUrl,
            checkoutId: checkout.checkoutId,
        });
    }
    catch (error) {
        console.error('Error creating checkout:', error);
        res.status(500).json({
            error: 'Failed to create checkout session',
            message: error.message,
        });
    }
});
router.get('/status', async (req, res) => {
    try {
        const userId = req.query.userId;
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        const { data: user, error } = await supabase
            .from('users')
            .select('subscription_tier, subscription_status, subscription_id, subscription_renews_at, subscription_ends_at')
            .eq('id', userId)
            .single();
        if (error || !user) {
            return res.status(404).json({ error: 'User not found' });
        }
        let subscriptionDetails = null;
        if (user.subscription_id && user.subscription_status === 'active') {
            try {
                subscriptionDetails = await lemonSqueezyService_1.default.getSubscription(user.subscription_id);
            }
            catch (error) {
                console.error('Error fetching subscription details:', error);
            }
        }
        res.json({
            success: true,
            subscription: {
                tier: user.subscription_tier || 'free',
                status: user.subscription_status,
                renewsAt: user.subscription_renews_at,
                endsAt: user.subscription_ends_at,
                details: subscriptionDetails,
            },
        });
    }
    catch (error) {
        console.error('Error fetching subscription status:', error);
        res.status(500).json({
            error: 'Failed to fetch subscription status',
            message: error.message,
        });
    }
});
router.post('/cancel', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        const { data: user, error } = await supabase
            .from('users')
            .select('subscription_id')
            .eq('id', userId)
            .single();
        if (error || !user || !user.subscription_id) {
            return res.status(404).json({ error: 'No active subscription found' });
        }
        const result = await lemonSqueezyService_1.default.cancelSubscription(user.subscription_id);
        res.json({
            success: true,
            message: 'Subscription cancelled successfully',
            subscription: result,
        });
    }
    catch (error) {
        console.error('Error cancelling subscription:', error);
        res.status(500).json({
            error: 'Failed to cancel subscription',
            message: error.message,
        });
    }
});
router.post('/webhook', async (req, res) => {
    try {
        const signature = req.headers['x-signature'];
        const payload = JSON.stringify(req.body);
        const isValid = lemonSqueezyService_1.default.verifyWebhookSignature(payload, signature);
        if (!isValid) {
            console.error('Invalid webhook signature');
            return res.status(401).json({ error: 'Invalid signature' });
        }
        await lemonSqueezyService_1.default.handleWebhookEvent(req.body, supabase);
        res.json({ success: true, message: 'Webhook processed successfully' });
    }
    catch (error) {
        console.error('Error processing webhook:', error);
        res.status(500).json({
            error: 'Failed to process webhook',
            message: error.message,
        });
    }
});
router.get('/limits', async (req, res) => {
    try {
        const userId = req.query.userId;
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        const productLimit = await lemonSqueezyService_1.default.checkProductLimit(userId, supabase);
        const notificationLimit = await lemonSqueezyService_1.default.checkNotificationLimit(userId, supabase);
        const hasAiAccess = await lemonSqueezyService_1.default.checkFeatureAccess(userId, 'aiRecommendation', supabase);
        const hasExportAccess = await lemonSqueezyService_1.default.checkFeatureAccess(userId, 'exportData', supabase);
        res.json({
            success: true,
            limits: {
                products: {
                    current: productLimit.currentCount,
                    limit: productLimit.limit,
                    canTrack: productLimit.canTrack,
                },
                notifications: {
                    current: notificationLimit.currentCount,
                    limit: notificationLimit.limit,
                    canSend: notificationLimit.canSend,
                },
                features: {
                    aiRecommendation: hasAiAccess,
                    exportData: hasExportAccess,
                },
                tier: productLimit.tier,
            },
        });
    }
    catch (error) {
        console.error('Error fetching limits:', error);
        res.status(500).json({
            error: 'Failed to fetch limits',
            message: error.message,
        });
    }
});
router.get('/plans', async (req, res) => {
    try {
        const plans = [
            {
                id: 'free',
                name: 'Free',
                price: 0,
                interval: 'forever',
                features: {
                    productLimit: 5,
                    aiRecommendation: false,
                    exportData: false,
                    notificationsPerDay: 1,
                },
                description: 'Perfect for trying out the service',
            },
            {
                id: process.env.LEMONSQUEEZY_PRO_MONTHLY_ID || 'pro',
                name: 'Pro',
                price: 9.99,
                interval: 'monthly',
                trialDays: 7,
                features: {
                    productLimit: 10,
                    aiRecommendation: true,
                    exportData: true,
                    notificationsPerDay: 10,
                },
                description: 'For serious price trackers',
            },
        ];
        res.json({
            success: true,
            plans,
        });
    }
    catch (error) {
        console.error('Error fetching plans:', error);
        res.status(500).json({
            error: 'Failed to fetch plans',
            message: error.message,
        });
    }
});
exports.default = router;
//# sourceMappingURL=subscriptions.js.map