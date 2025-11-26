import express, { Request, Response } from 'express';
import lemonSqueezyService from '../services/lemonSqueezyService';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

// Initialize Supabase client
const supabase = createClient(
    process.env.SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * POST /api/subscriptions/create-checkout
 * Create a checkout session for a subscription plan
 */
router.post('/create-checkout', async (req: Request, res: Response) => {
    try {
        const { planId, userId, email } = req.body;

        if (!planId || !userId || !email) {
            return res.status(400).json({
                error: 'Missing required fields: planId, userId, email',
            });
        }

        const checkout = await lemonSqueezyService.createCheckoutSession(
            userId,
            planId,
            email
        );

        res.json({
            success: true,
            checkoutUrl: checkout.checkoutUrl,
            checkoutId: checkout.checkoutId,
        });
    } catch (error: any) {
        console.error('Error creating checkout:', error);
        res.status(500).json({
            error: 'Failed to create checkout session',
            message: error.message,
        });
    }
});

/**
 * GET /api/subscriptions/status
 * Get current subscription status for a user
 */
router.get('/status', async (req: Request, res: Response) => {
    try {
        const userId = req.query.userId as string;

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

        // Get subscription details from LemonSqueezy if active
        let subscriptionDetails = null;
        if (user.subscription_id && user.subscription_status === 'active') {
            try {
                subscriptionDetails = await lemonSqueezyService.getSubscription(user.subscription_id);
            } catch (error) {
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
    } catch (error: any) {
        console.error('Error fetching subscription status:', error);
        res.status(500).json({
            error: 'Failed to fetch subscription status',
            message: error.message,
        });
    }
});

/**
 * POST /api/subscriptions/cancel
 * Cancel a user's subscription
 */
router.post('/cancel', async (req: Request, res: Response) => {
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

        const result = await lemonSqueezyService.cancelSubscription(user.subscription_id);

        res.json({
            success: true,
            message: 'Subscription cancelled successfully',
            subscription: result,
        });
    } catch (error: any) {
        console.error('Error cancelling subscription:', error);
        res.status(500).json({
            error: 'Failed to cancel subscription',
            message: error.message,
        });
    }
});

/**
 * POST /api/subscriptions/webhook
 * Handle LemonSqueezy webhook events
 */
router.post('/webhook', async (req: Request, res: Response) => {
    try {
        const signature = req.headers['x-signature'] as string;
        const payload = JSON.stringify(req.body);

        // Verify webhook signature
        const isValid = lemonSqueezyService.verifyWebhookSignature(payload, signature);

        if (!isValid) {
            console.error('Invalid webhook signature');
            return res.status(401).json({ error: 'Invalid signature' });
        }

        // Process webhook event
        await lemonSqueezyService.handleWebhookEvent(req.body, supabase);

        res.json({ success: true, message: 'Webhook processed successfully' });
    } catch (error: any) {
        console.error('Error processing webhook:', error);
        res.status(500).json({
            error: 'Failed to process webhook',
            message: error.message,
        });
    }
});

/**
 * GET /api/subscriptions/limits
 * Get current usage and limits for a user
 */
router.get('/limits', async (req: Request, res: Response) => {
    try {
        const userId = req.query.userId as string;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        // Get product limit
        const productLimit = await lemonSqueezyService.checkProductLimit(userId, supabase);

        // Get notification limit
        const notificationLimit = await lemonSqueezyService.checkNotificationLimit(userId, supabase);

        // Check AI recommendation access
        const hasAiAccess = await lemonSqueezyService.checkFeatureAccess(
            userId,
            'aiRecommendation',
            supabase
        );

        // Check export data access
        const hasExportAccess = await lemonSqueezyService.checkFeatureAccess(
            userId,
            'exportData',
            supabase
        );

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
    } catch (error: any) {
        console.error('Error fetching limits:', error);
        res.status(500).json({
            error: 'Failed to fetch limits',
            message: error.message,
        });
    }
});

/**
 * GET /api/subscriptions/plans
 * Get available subscription plans
 */
router.get('/plans', async (req: Request, res: Response) => {
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
                id: process.env.LEMONSQUEEZY_PRO_MONTHLY_ID || '1112137',
                name: 'Price Tracker Pro',
                price: 4.99,
                interval: 'monthly',
                trialDays: 7,
                features: {
                    productLimit: 999,
                    aiRecommendation: true,
                    exportData: true,
                    notificationsPerDay: 100,
                },
                description: 'Unlimited tracking for serious price trackers',
            },
            {
                id: process.env.LEMONSQUEEZY_PRO_YEARLY_ID || '1112146',
                name: 'Price Tracker Pro',
                price: 39.99,
                interval: 'yearly',
                trialDays: 7,
                features: {
                    productLimit: 999,
                    aiRecommendation: true,
                    exportData: true,
                    notificationsPerDay: 100,
                },
                description: 'Unlimited tracking - Save $20/year!',
            },
        ];

        res.json({
            success: true,
            plans,
        });
    } catch (error: any) {
        console.error('Error fetching plans:', error);
        res.status(500).json({
            error: 'Failed to fetch plans',
            message: error.message,
        });
    }
});

export default router;
