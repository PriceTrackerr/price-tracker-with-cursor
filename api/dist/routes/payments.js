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
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const storage_1 = __importDefault(require("../config/storage"));
const paymentService_1 = __importStar(require("../services/paymentService"));
const uuid_1 = require("uuid");
const router = express_1.default.Router();
async function getEffectivePlans() {
    const stored = await storage_1.default.getSubscriptionPlans();
    if (!stored || stored.length === 0)
        return paymentService_1.SUBSCRIPTION_PLANS;
    const byId = {};
    for (const p of paymentService_1.SUBSCRIPTION_PLANS)
        byId[p.id] = { ...p };
    for (const sp of stored)
        byId[sp.id] = { ...byId[sp.id], ...sp };
    const deletedIds = await storage_1.default.getDeletedSubscriptionPlanIds?.() ?? [];
    return Object.entries(byId)
        .filter(([id]) => !deletedIds.includes(id))
        .map(([, plan]) => plan);
}
router.get('/plans', async (req, res) => {
    try {
        const userCountry = req.headers['cf-ipcountry'] || req.query.country || 'US';
        const availablePaymentMethods = paymentService_1.default.getAvailablePaymentMethods(userCountry);
        const plans = await getEffectivePlans();
        res.json({
            success: true,
            data: {
                plans,
                paymentMethods: availablePaymentMethods,
                userCountry,
                freePeriodMonths: 6,
                message: "🎉 First 6 months are completely FREE! No payment required."
            }
        });
    }
    catch (error) {
        console.error('Error fetching plans:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
router.post('/plans', auth_1.authMiddleware, async (req, res) => {
    try {
        const admin = await storage_1.default.getUserById(String(req.user.uid));
        if (!admin || admin.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        const { name, price, currency = 'USD', interval, features } = req.body || {};
        if (!name || typeof price !== 'number' || !interval || !features) {
            return res.status(400).json({ success: false, message: 'Invalid plan payload' });
        }
        const plan = {
            id: `${name.toLowerCase().replace(/\s+/g, '_')}_${interval}_${Date.now()}`,
            name,
            price,
            currency,
            interval,
            features,
        };
        await storage_1.default.addSubscriptionPlan(plan);
        return res.json({ success: true, data: { plan } });
    }
    catch (e) {
        console.error('Error creating plan:', e);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
router.put('/plans/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const admin = await storage_1.default.getUserById(String(req.user.uid));
        if (!admin || admin.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        const planId = String(req.params.id);
        const updated = await storage_1.default.updateSubscriptionPlan(planId, req.body || {});
        if (!updated) {
            return res.status(404).json({ success: false, message: 'Plan not found' });
        }
        return res.json({ success: true });
    }
    catch (e) {
        console.error('Error updating plan:', e);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
router.delete('/plans/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const admin = await storage_1.default.getUserById(String(req.user.uid));
        if (!admin || admin.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        const planId = String(req.params.id);
        const deleted = await storage_1.default.deleteSubscriptionPlan(planId);
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Plan not found' });
        }
        return res.json({ success: true });
    }
    catch (e) {
        console.error('Error deleting plan:', e);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
router.get('/subscription', auth_1.authMiddleware, async (req, res) => {
    try {
        const user = await storage_1.default.getUserById(String(req.user.uid));
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const subscriptionStatus = paymentService_1.default.getCurrentSubscriptionStatus(user);
        const userProducts = await storage_1.default.getProducts(user.id);
        const userAlerts = await storage_1.default.getAllAlerts().then(alerts => alerts.filter(alert => alert.userId === user.id));
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const alertsThisMonth = userAlerts.filter((alert) => new Date(alert.createdAt) >= startOfMonth).length;
        subscriptionStatus.currentUsage = {
            trackedProducts: userProducts.length,
            alertsThisMonth: alertsThisMonth
        };
        return res.json({
            success: true,
            data: {
                subscription: subscriptionStatus,
                isFreePeriod: subscriptionStatus.isFreePeriod,
                daysRemaining: subscriptionStatus.daysRemaining,
                userEmail: user.email,
                userCreatedAt: user.createdAt
            }
        });
    }
    catch (error) {
        console.error('Error fetching subscription:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
router.post('/subscribe', auth_1.authMiddleware, async (req, res) => {
    try {
        const { planId, paymentMethod } = req.body;
        if (!planId || !paymentMethod) {
            return res.status(400).json({
                success: false,
                message: 'Plan ID and payment method are required'
            });
        }
        const effectivePlans = await getEffectivePlans();
        const plan = effectivePlans.find(p => p.id === planId);
        if (!plan) {
            return res.status(400).json({ success: false, message: 'Invalid plan' });
        }
        const user = await storage_1.default.getUserById(String(req.user.uid));
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        let paymentResult;
        switch (paymentMethod) {
            case 'paypal':
                paymentResult = await paymentService_1.default.createPayPalPayment(user, plan);
                break;
            case 'stripe':
                paymentResult = await paymentService_1.default.createStripePayment(user, plan);
                break;
            default:
                return res.status(400).json({ success: false, message: 'Unsupported payment method' });
        }
        if (!paymentResult.success) {
            return res.status(400).json({
                success: false,
                message: paymentResult.error
            });
        }
        const payment = {
            id: (0, uuid_1.v4)(),
            userId: user.id,
            type: 'subscription',
            amount: plan.price,
            currency: plan.currency,
            status: 'pending',
            paymentMethod: paymentMethod,
            paymentGatewayId: paymentResult.data.id || paymentResult.data.tx_ref,
            subscriptionPlan: plan.id.includes('premium') ? 'premium' : 'pro',
            createdAt: new Date().toISOString(),
            metadata: {
                planId: plan.id,
                planName: plan.name
            }
        };
        await storage_1.default.addPayment(payment);
        return res.json({
            success: true,
            data: {
                payment,
                checkout_url: paymentResult.checkout_url,
                payment_code: paymentResult.payment_code
            }
        });
    }
    catch (error) {
        console.error('Error creating subscription:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
router.get('/history', auth_1.authMiddleware, async (req, res) => {
    try {
        const payments = await storage_1.default.getUserPayments(String(req.user.uid));
        res.json({
            success: true,
            data: { payments }
        });
    }
    catch (error) {
        console.error('Error fetching payment history:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
router.post('/cancel', auth_1.authMiddleware, async (req, res) => {
    try {
        const user = await storage_1.default.getUserById(String(req.user.uid));
        if (!user || !user.subscription) {
            return res.status(404).json({ success: false, message: 'No active subscription found' });
        }
        const updatedSubscription = {
            ...user.subscription,
            status: 'cancelled'
        };
        await storage_1.default.updateUser(user.id, { subscription: updatedSubscription });
        return res.json({
            success: true,
            message: 'Subscription cancelled successfully'
        });
    }
    catch (error) {
        console.error('Error cancelling subscription:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
router.get('/affiliate/dashboard', auth_1.authMiddleware, async (req, res) => {
    try {
        const user = await storage_1.default.getUserById(req.user.uid);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        let affiliate = user.affiliate;
        if (!affiliate) {
            affiliate = {
                isAffiliate: false,
                referralCode: `PT${user.id.slice(-6).toUpperCase()}`,
                commissionRate: 0.1,
                totalEarnings: 0,
                pendingEarnings: 0
            };
            await storage_1.default.updateUser(user.id, { affiliate });
        }
        const transactions = await storage_1.default.getAffiliateTransactions(user.id);
        const referrals = await storage_1.default.getAffiliateReferrals(user.id);
        return res.json({
            success: true,
            data: {
                affiliate,
                transactions,
                referrals,
                referralLink: `${process.env.FRONTEND_URL}?ref=${affiliate.referralCode}`
            }
        });
    }
    catch (error) {
        console.error('Error fetching affiliate dashboard:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
router.post('/affiliate/enable', auth_1.authMiddleware, async (req, res) => {
    try {
        const { payoutMethod, payoutDetails } = req.body;
        if (!payoutMethod) {
            return res.status(400).json({
                success: false,
                message: 'Payout method is required'
            });
        }
        const user = await storage_1.default.getUserById(req.user.uid);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const affiliate = {
            isAffiliate: true,
            referralCode: user.affiliate?.referralCode || `PT${user.id.slice(-6).toUpperCase()}`,
            commissionRate: 0.1,
            totalEarnings: user.affiliate?.totalEarnings || 0,
            pendingEarnings: user.affiliate?.pendingEarnings || 0,
            payoutMethod,
            payoutDetails
        };
        await storage_1.default.updateUser(user.id, { affiliate });
        return res.json({
            success: true,
            data: { affiliate },
            message: 'Affiliate program enabled successfully'
        });
    }
    catch (error) {
        console.error('Error enabling affiliate:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
router.post('/affiliate/payout', auth_1.authMiddleware, async (req, res) => {
    try {
        const { amount } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid amount is required'
            });
        }
        const user = await storage_1.default.getUserById(req.user.uid);
        if (!user || !user.affiliate || !user.affiliate.isAffiliate) {
            return res.status(404).json({ success: false, message: 'Affiliate account not found' });
        }
        if (amount > (user.affiliate.pendingEarnings || 0)) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient balance'
            });
        }
        if (amount < 50) {
            return res.status(400).json({
                success: false,
                message: 'Minimum payout amount is $50'
            });
        }
        const payoutRequest = {
            id: (0, uuid_1.v4)(),
            affiliateUserId: user.id,
            amount,
            currency: 'USD',
            method: user.affiliate.payoutMethod,
            status: 'pending',
            requestedAt: new Date().toISOString(),
            details: user.affiliate.payoutDetails
        };
        await storage_1.default.addPayoutRequest(payoutRequest);
        return res.json({
            success: true,
            data: { payoutRequest },
            message: 'Payout request submitted successfully'
        });
    }
    catch (error) {
        console.error('Error requesting payout:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});
exports.default = router;
//# sourceMappingURL=payments.js.map