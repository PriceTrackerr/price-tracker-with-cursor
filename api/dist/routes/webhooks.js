"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const storage_1 = __importDefault(require("../config/storage"));
const paymentService_1 = __importDefault(require("../services/paymentService"));
const uuid_1 = require("uuid");
const router = express_1.default.Router();
async function processAffiliateCommission(referredUserId, amount, type, referralCode) {
    try {
        let affiliateUser;
        if (referralCode) {
            const allUsers = await storage_1.default.getUsers();
            affiliateUser = allUsers.find((u) => u.affiliate?.referralCode === referralCode);
        }
        if (!affiliateUser || !affiliateUser.affiliate?.isAffiliate) {
            return;
        }
        const commission = paymentService_1.default.calculateCommission(amount, affiliateUser.affiliate.commissionRate);
        const transaction = {
            id: (0, uuid_1.v4)(),
            affiliateUserId: affiliateUser.id,
            referredUserId,
            type,
            amount,
            commission,
            status: 'approved',
            createdAt: new Date().toISOString()
        };
        await storage_1.default.addAffiliateTransaction(transaction);
        const currentPendingEarnings = affiliateUser.affiliate.pendingEarnings || 0;
        const currentTotalEarnings = affiliateUser.affiliate.totalEarnings || 0;
        await storage_1.default.updateUser(affiliateUser.id, {
            affiliate: {
                ...affiliateUser.affiliate,
                pendingEarnings: currentPendingEarnings + commission,
                totalEarnings: currentTotalEarnings + commission
            }
        });
        console.log(`Commission processed: $${commission} for affiliate ${affiliateUser.id}`);
    }
    catch (error) {
        console.error('Error processing affiliate commission:', error);
    }
}
async function activateSubscription(user, payment) {
    const plan = payment.subscriptionPlan;
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);
    const subscription = {
        plan: plan,
        status: 'active',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        paymentMethod: payment.paymentMethod,
        subscriptionId: payment.paymentGatewayId,
        nextBillingDate: endDate.toISOString(),
        features: payment.subscriptionPlan === 'premium' ? {
            maxTrackedProducts: 50,
            alertFrequency: 'instant',
            priceHistoryDays: 90,
            exportData: true,
            prioritySupport: true
        } : {
            maxTrackedProducts: 200,
            alertFrequency: 'instant',
            priceHistoryDays: 365,
            exportData: true,
            prioritySupport: true
        }
    };
    await storage_1.default.updateUser(user.id, { subscription });
    const referralCode = new URLSearchParams(user.referralSource || '').get('ref');
    if (referralCode) {
        await processAffiliateCommission(user.id, payment.amount, 'subscription', referralCode);
    }
}
router.post('/stripe', async (req, res) => {
    try {
        console.log('Stripe webhook received:', req.body);
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        const sig = req.headers['stripe-signature'];
        let event;
        try {
            event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
        }
        catch (err) {
            console.log('Invalid Stripe webhook signature');
            return res.status(400).json({ success: false, message: 'Invalid signature' });
        }
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const { user_id, plan_id } = session.metadata;
            const payments = await storage_1.default.getUserPayments(user_id);
            const payment = payments.find(p => p.paymentGatewayId === session.id);
            if (payment) {
                await storage_1.default.updatePayment(payment.id, {
                    status: 'completed',
                    completedAt: new Date().toISOString()
                });
                const user = await storage_1.default.getUserById(payment.userId);
                if (user && payment.type === 'subscription') {
                    await activateSubscription(user, payment);
                }
            }
        }
        return res.json({ success: true, message: 'Webhook processed' });
    }
    catch (error) {
        console.error('Stripe webhook error:', error);
        return res.status(500).json({ success: false, message: 'Webhook processing failed' });
    }
});
router.post('/paypal', async (req, res) => {
    try {
        console.log('PayPal webhook received:', req.body);
        const signature = req.headers['paypal-signature'];
        const isValid = await paymentService_1.default.verifyWebhook(req.body, signature, 'paypal');
        if (!isValid) {
            console.log('Invalid PayPal webhook signature');
            return res.status(400).json({ success: false, message: 'Invalid signature' });
        }
        const { event_type, resource } = req.body;
        if (event_type === 'PAYMENT.CAPTURE.COMPLETED') {
            const { id, amount, custom_id } = resource;
            const allUsers = await storage_1.default.getUsers();
            let payment = null;
            for (const user of allUsers) {
                const userPayments = await storage_1.default.getUserPayments(user.id);
                payment = userPayments.find(p => p.paymentGatewayId === id);
                if (payment)
                    break;
            }
            if (payment) {
                await storage_1.default.updatePayment(payment.id, {
                    status: 'completed',
                    completedAt: new Date().toISOString()
                });
                const user = await storage_1.default.getUserById(payment.userId);
                if (user && payment.type === 'subscription') {
                    await activateSubscription(user, payment);
                }
            }
        }
        return res.json({ success: true, message: 'Webhook processed' });
    }
    catch (error) {
        console.error('PayPal webhook error:', error);
        return res.status(500).json({ success: false, message: 'Webhook processing failed' });
    }
});
router.post('/', (req, res) => {
    console.log('Generic webhook received:', req.body);
    res.json({ success: true, message: 'Webhook received' });
});
exports.default = router;
//# sourceMappingURL=webhooks.js.map