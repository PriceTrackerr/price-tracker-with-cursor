import { User, PayoutRequest } from '../config/storage';
export interface PaymentConfig {
    paypal: {
        clientId: string;
        clientSecret: string;
        mode: 'sandbox' | 'live';
    };
    stripe: {
        secretKey: string;
        publishableKey: string;
        webhookSecret: string;
    };
}
export interface SubscriptionPlan {
    id: string;
    name: string;
    price: number;
    currency: 'USD' | 'ETB';
    interval: 'monthly' | 'yearly';
    features: {
        maxTrackedProducts: number;
        alertFrequency: 'instant' | 'hourly' | 'daily';
        priceHistoryDays: number;
        exportData: boolean;
        prioritySupport: boolean;
    };
}
export declare const FREE_PERIOD_MONTHS = 6;
export declare const SUBSCRIPTION_PLANS: SubscriptionPlan[];
export declare class PaymentService {
    private config;
    constructor();
    createStripePayment(user: User, plan: SubscriptionPlan): Promise<any>;
    createPayPalPayment(user: User, plan: SubscriptionPlan): Promise<any>;
    processPayPalPayout(request: PayoutRequest): Promise<any>;
    verifyWebhook(payload: any, signature: string, gateway: 'paypal' | 'stripe'): Promise<boolean>;
    getAvailablePaymentMethods(userCountry?: string): string[];
    calculateCommission(amount: number, rate?: number): number;
    isFreePeriodActive(userCreatedAt: string): boolean;
    getCurrentSubscriptionStatus(user: User): {
        isActive: boolean;
        plan: string;
        isFreePeriod: boolean;
        daysRemaining: number;
        features: any;
        currentUsage: {
            trackedProducts: number;
            alertsThisMonth: number;
        };
    };
    getFreePeriodDaysRemaining(userCreatedAt: string): number;
    getSubscriptionDaysRemaining(endDate: string): number;
}
declare const _default: PaymentService;
export default _default;
//# sourceMappingURL=paymentService.d.ts.map