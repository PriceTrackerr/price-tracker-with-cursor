"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = exports.SUBSCRIPTION_PLANS = exports.FREE_PERIOD_MONTHS = void 0;
const axios_1 = __importDefault(require("axios"));
exports.FREE_PERIOD_MONTHS = 6;
exports.SUBSCRIPTION_PLANS = [
    {
        id: 'basic_monthly',
        name: 'Basic Monthly',
        price: 3.00,
        currency: 'USD',
        interval: 'monthly',
        features: {
            maxTrackedProducts: 50,
            alertFrequency: 'daily',
            priceHistoryDays: 60,
            exportData: false,
            prioritySupport: false,
        }
    },
    {
        id: 'basic_yearly',
        name: 'Basic Yearly',
        price: 30.00,
        currency: 'USD',
        interval: 'yearly',
        features: {
            maxTrackedProducts: 50,
            alertFrequency: 'daily',
            priceHistoryDays: 60,
            exportData: false,
            prioritySupport: false,
        }
    },
    {
        id: 'premium_monthly',
        name: 'Premium Monthly',
        price: 8.00,
        currency: 'USD',
        interval: 'monthly',
        features: {
            maxTrackedProducts: 200,
            alertFrequency: 'instant',
            priceHistoryDays: 365,
            exportData: true,
            prioritySupport: true,
        }
    },
    {
        id: 'premium_yearly',
        name: 'Premium Yearly',
        price: 80.00,
        currency: 'USD',
        interval: 'yearly',
        features: {
            maxTrackedProducts: 200,
            alertFrequency: 'instant',
            priceHistoryDays: 365,
            exportData: true,
            prioritySupport: true,
        }
    }
];
class PaymentService {
    constructor() {
        this.config = {
            paypal: {
                clientId: process.env.PAYPAL_CLIENT_ID || '',
                clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
                mode: process.env.PAYPAL_MODE === 'live' ? 'live' : 'sandbox'
            },
            stripe: {
                secretKey: process.env.STRIPE_SECRET_KEY || '',
                publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
                webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || ''
            }
        };
    }
    async createStripePayment(user, plan) {
        try {
            const stripe = require('stripe')(this.config.stripe.secretKey);
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [{
                        price_data: {
                            currency: plan.currency.toLowerCase(),
                            product_data: {
                                name: plan.name,
                                description: `Price Tracker ${plan.name} Subscription`,
                            },
                            unit_amount: Math.round(plan.price * 100),
                        },
                        quantity: 1,
                    }],
                mode: 'subscription',
                success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
                customer_email: user.email,
                metadata: {
                    user_id: user.id,
                    plan_id: plan.id
                }
            });
            return {
                success: true,
                data: session,
                checkout_url: session.url
            };
        }
        catch (error) {
            console.error('Stripe payment error:', error.message);
            return {
                success: false,
                error: error.message || 'Stripe payment initialization failed'
            };
        }
    }
    async createPayPalPayment(user, plan) {
        try {
            const authString = Buffer.from(`${this.config.paypal.clientId}:${this.config.paypal.clientSecret}`).toString('base64');
            const baseUrl = this.config.paypal.mode === 'live'
                ? 'https://api.paypal.com'
                : 'https://api.sandbox.paypal.com';
            const tokenResponse = await axios_1.default.post(`${baseUrl}/v1/oauth2/token`, 'grant_type=client_credentials', {
                headers: {
                    'Authorization': `Basic ${authString}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
            const accessToken = tokenResponse.data.access_token;
            const paymentData = {
                intent: 'CAPTURE',
                purchase_units: [{
                        amount: {
                            currency_code: plan.currency,
                            value: plan.price.toString()
                        },
                        description: `${plan.name} - Price Tracker Subscription`
                    }],
                application_context: {
                    return_url: `${process.env.FRONTEND_URL}/payment/paypal/success`,
                    cancel_url: `${process.env.FRONTEND_URL}/payment/paypal/cancel`
                }
            };
            const orderResponse = await axios_1.default.post(`${baseUrl}/v2/checkout/orders`, paymentData, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            const approveUrl = orderResponse.data.links.find((link) => link.rel === 'approve')?.href;
            return {
                success: true,
                data: orderResponse.data,
                checkout_url: approveUrl
            };
        }
        catch (error) {
            console.error('PayPal payment error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || 'PayPal payment initialization failed'
            };
        }
    }
    async processPayPalPayout(request) {
        try {
            const authString = Buffer.from(`${this.config.paypal.clientId}:${this.config.paypal.clientSecret}`).toString('base64');
            const baseUrl = this.config.paypal.mode === 'live'
                ? 'https://api.paypal.com'
                : 'https://api.sandbox.paypal.com';
            const tokenResponse = await axios_1.default.post(`${baseUrl}/v1/oauth2/token`, 'grant_type=client_credentials', {
                headers: {
                    'Authorization': `Basic ${authString}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
            const accessToken = tokenResponse.data.access_token;
            const payoutData = {
                sender_batch_header: {
                    sender_batch_id: `payout_${request.id}`,
                    email_subject: 'Price Tracker Affiliate Payment',
                    email_message: 'You have received a payment for your affiliate earnings!'
                },
                items: [{
                        recipient_type: 'EMAIL',
                        amount: {
                            value: request.amount.toString(),
                            currency: request.currency
                        },
                        receiver: request.details?.paypalEmail,
                        note: 'Affiliate commission payment',
                        sender_item_id: request.id
                    }]
            };
            const payoutResponse = await axios_1.default.post(`${baseUrl}/v1/payments/payouts`, payoutData, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            return {
                success: true,
                data: payoutResponse.data,
                batch_id: payoutResponse.data.batch_header.payout_batch_id
            };
        }
        catch (error) {
            console.error('PayPal payout error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || 'PayPal payout failed'
            };
        }
    }
    async verifyWebhook(payload, signature, gateway) {
        try {
            switch (gateway) {
                case 'paypal':
                    return true;
                case 'stripe':
                    return true;
                default:
                    return false;
            }
        }
        catch (error) {
            console.error('Webhook verification error:', error);
            return false;
        }
    }
    getAvailablePaymentMethods(userCountry) {
        const methods = ['paypal', 'stripe'];
        if (userCountry === 'US' || userCountry === 'CA') {
            methods.push('stripe');
        }
        if (userCountry === 'EU' || userCountry === 'GB') {
            methods.push('stripe');
        }
        return methods;
    }
    calculateCommission(amount, rate = 0.1) {
        return Math.round(amount * rate * 100) / 100;
    }
    isFreePeriodActive(userCreatedAt) {
        const userCreated = new Date(userCreatedAt);
        const now = new Date();
        const monthsDiff = (now.getFullYear() - userCreated.getFullYear()) * 12 +
            (now.getMonth() - userCreated.getMonth());
        return monthsDiff < exports.FREE_PERIOD_MONTHS;
    }
    getCurrentSubscriptionStatus(user) {
        const isFreePeriod = this.isFreePeriodActive(user.createdAt);
        if (isFreePeriod) {
            return {
                isActive: true,
                plan: 'free_trial',
                isFreePeriod: true,
                daysRemaining: this.getFreePeriodDaysRemaining(user.createdAt),
                features: {
                    maxTrackedProducts: 200,
                    alertFrequency: 'instant',
                    priceHistoryDays: 365,
                    exportData: true,
                    prioritySupport: true,
                },
                currentUsage: {
                    trackedProducts: 0,
                    alertsThisMonth: 0
                }
            };
        }
        if (user.subscription?.status === 'active') {
            return {
                isActive: true,
                plan: user.subscription.plan,
                isFreePeriod: false,
                daysRemaining: this.getSubscriptionDaysRemaining(user.subscription.endDate),
                features: user.subscription.features,
                currentUsage: {
                    trackedProducts: 0,
                    alertsThisMonth: 0
                }
            };
        }
        return {
            isActive: true,
            plan: 'free',
            isFreePeriod: false,
            daysRemaining: 0,
            features: {
                maxTrackedProducts: 10,
                alertFrequency: 'limited',
                priceHistoryDays: 30,
                exportData: false,
                prioritySupport: false,
            },
            currentUsage: {
                trackedProducts: 0,
                alertsThisMonth: 0
            }
        };
    }
    getFreePeriodDaysRemaining(userCreatedAt) {
        const userCreated = new Date(userCreatedAt);
        const freeEndDate = new Date(userCreated);
        freeEndDate.setMonth(freeEndDate.getMonth() + exports.FREE_PERIOD_MONTHS);
        const now = new Date();
        const diffTime = freeEndDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(0, diffDays);
    }
    getSubscriptionDaysRemaining(endDate) {
        const end = new Date(endDate);
        const now = new Date();
        const diffTime = end.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(0, diffDays);
    }
}
exports.PaymentService = PaymentService;
exports.default = new PaymentService();
//# sourceMappingURL=paymentService.js.map