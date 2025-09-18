import axios from 'axios';
import { Payment, User, PayoutRequest } from '../config/storage';
import { getDb } from '../config/database';

const db = getDb();

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

// Free period: 6 months for all users
export const FREE_PERIOD_MONTHS = 6;

// Future subscription plans (after free period ends)
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
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

export class PaymentService {
  private config: PaymentConfig;

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

  // Stripe Payment Integration (Recommended for International Customers)
  async createStripePayment(user: User, plan: SubscriptionPlan): Promise<any> {
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
            unit_amount: Math.round(plan.price * 100), // Convert to cents
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
    } catch (error: any) {
      console.error('Stripe payment error:', error.message);
      return {
        success: false,
        error: error.message || 'Stripe payment initialization failed'
      };
    }
  }

  // PayPal Payment Integration (For International Customers)
  async createPayPalPayment(user: User, plan: SubscriptionPlan): Promise<any> {
    try {
      // Get PayPal access token
      const authString = Buffer.from(`${this.config.paypal.clientId}:${this.config.paypal.clientSecret}`).toString('base64');
      const baseUrl = this.config.paypal.mode === 'live' 
        ? 'https://api.paypal.com' 
        : 'https://api.sandbox.paypal.com';

      const tokenResponse = await axios.post(
        `${baseUrl}/v1/oauth2/token`,
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${authString}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const accessToken = tokenResponse.data.access_token;

      // Create payment
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

      const orderResponse = await axios.post(
        `${baseUrl}/v2/checkout/orders`,
        paymentData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const approveUrl = orderResponse.data.links.find((link: any) => link.rel === 'approve')?.href;

      return {
        success: true,
        data: orderResponse.data,
        checkout_url: approveUrl
      };
    } catch (error: any) {
      console.error('PayPal payment error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'PayPal payment initialization failed'
      };
    }
  }



  // Affiliate Payout Methods
  async processPayPalPayout(request: PayoutRequest): Promise<any> {
    try {
      // Get PayPal access token
      const authString = Buffer.from(`${this.config.paypal.clientId}:${this.config.paypal.clientSecret}`).toString('base64');
      const baseUrl = this.config.paypal.mode === 'live' 
        ? 'https://api.paypal.com' 
        : 'https://api.sandbox.paypal.com';

      const tokenResponse = await axios.post(
        `${baseUrl}/v1/oauth2/token`,
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${authString}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      const accessToken = tokenResponse.data.access_token;

      // Create payout
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

      const payoutResponse = await axios.post(
        `${baseUrl}/v1/payments/payouts`,
        payoutData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: payoutResponse.data,
        batch_id: payoutResponse.data.batch_header.payout_batch_id
      };
    } catch (error: any) {
      console.error('PayPal payout error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'PayPal payout failed'
      };
    }
  }

  // Verify payment webhook signatures
  async verifyWebhook(payload: any, signature: string, gateway: 'paypal' | 'stripe'): Promise<boolean> {
    try {
      switch (gateway) {
        case 'paypal':
          // PayPal webhook verification (simplified)
          return true; // In production, implement proper signature verification
        case 'stripe':
          // Stripe webhook verification (simplified)
          return true; // In production, implement proper signature verification
        default:
          return false;
      }
    } catch (error) {
      console.error('Webhook verification error:', error);
      return false;
    }
  }

  // Get available payment methods for international customers
  getAvailablePaymentMethods(userCountry?: string): string[] {
    // Focus on international payment methods
    const methods = ['paypal', 'stripe']; // PayPal and Stripe are global
    
    // Add regional payment methods based on user location
    if (userCountry === 'US' || userCountry === 'CA') {
      methods.push('stripe'); // Stripe is popular in US/Canada
    }
    
    if (userCountry === 'EU' || userCountry === 'GB') {
      methods.push('stripe'); // Stripe works well in Europe
    }
    
    return methods;
  }

  // Calculate affiliate commission (10% default)
  calculateCommission(amount: number, rate: number = 0.1): number {
    return Math.round(amount * rate * 100) / 100;
  }

  // Check if free period is active (first 6 months)
  isFreePeriodActive(userCreatedAt: string): boolean {
    const userCreated = new Date(userCreatedAt);
    const now = new Date();
    const monthsDiff = (now.getFullYear() - userCreated.getFullYear()) * 12 + 
                      (now.getMonth() - userCreated.getMonth());
    
    return monthsDiff < FREE_PERIOD_MONTHS;
  }

  // Get current subscription status for user
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
  } {
    const isFreePeriod = this.isFreePeriodActive(user.createdAt);
    
    if (isFreePeriod) {
      // Free period features (same as Premium)
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
          trackedProducts: 0, // Will be fetched from database
          alertsThisMonth: 0  // Will be fetched from database
        }
      };
    }

    // Check paid subscription
    if (user.subscription?.status === 'active') {
      return {
        isActive: true,
        plan: user.subscription.plan,
        isFreePeriod: false,
        daysRemaining: this.getSubscriptionDaysRemaining(user.subscription.endDate),
        features: user.subscription.features,
        currentUsage: {
          trackedProducts: 0, // Will be fetched from database
          alertsThisMonth: 0  // Will be fetched from database
        }
      };
    }

    // Free plan (after trial period)
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
        trackedProducts: 0, // Will be fetched from database
        alertsThisMonth: 0  // Will be fetched from database
      }
    };
  }

  // Get days remaining in free period
  getFreePeriodDaysRemaining(userCreatedAt: string): number {
    const userCreated = new Date(userCreatedAt);
    const freeEndDate = new Date(userCreated);
    freeEndDate.setMonth(freeEndDate.getMonth() + FREE_PERIOD_MONTHS);
    
    const now = new Date();
    const diffTime = freeEndDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }

  // Get days remaining in subscription
  getSubscriptionDaysRemaining(endDate: string): number {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }
}

export default new PaymentService(); 