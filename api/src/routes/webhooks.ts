import express, { Request, Response } from 'express';
import { getDb } from '../config/database';
import paymentService from '../services/paymentService';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const db = getDb();

// Helper function to process affiliate commissions
async function processAffiliateCommission(
  referredUserId: string, 
  amount: number, 
  type: 'signup' | 'subscription' | 'renewal',
  referralCode?: string
) {
  try {
    // Find affiliate by referral code
    let affiliateUser;
    if (referralCode) {
      const allUsers = await db.getUsers();
      affiliateUser = allUsers.find((u: any) => u.affiliate?.referralCode === referralCode);
    }

    if (!affiliateUser || !affiliateUser.affiliate?.isAffiliate) {
      return;
    }

    const commission = paymentService.calculateCommission(amount, affiliateUser.affiliate.commissionRate);

    // Create affiliate transaction
    const transaction = {
      id: uuidv4(),
      affiliateUserId: affiliateUser.id,
      referredUserId,
      type,
      amount,
      commission,
      status: 'approved' as const,
      createdAt: new Date().toISOString()
    };

    await db.addAffiliateTransaction(transaction);

    // Update affiliate earnings
    const currentPendingEarnings = affiliateUser.affiliate.pendingEarnings || 0;
    const currentTotalEarnings = affiliateUser.affiliate.totalEarnings || 0;

    await db.updateUser(affiliateUser.id, {
      affiliate: {
        ...affiliateUser.affiliate,
        pendingEarnings: currentPendingEarnings + commission,
        totalEarnings: currentTotalEarnings + commission
      }
    });

    console.log(`Commission processed: $${commission} for affiliate ${affiliateUser.id}`);
  } catch (error) {
    console.error('Error processing affiliate commission:', error);
  }
}

// Helper function to activate subscription
async function activateSubscription(user: any, payment: any) {
  const plan = payment.subscriptionPlan;
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription

  const subscription = {
    plan: plan as 'premium' | 'pro',
    status: 'active' as const,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    paymentMethod: payment.paymentMethod,
    subscriptionId: payment.paymentGatewayId,
    nextBillingDate: endDate.toISOString(),
    features: payment.subscriptionPlan === 'premium' ? {
      maxTrackedProducts: 50,
      alertFrequency: 'instant' as const,
      priceHistoryDays: 90,
      exportData: true,
      prioritySupport: true
    } : {
      maxTrackedProducts: 200,
      alertFrequency: 'instant' as const,
      priceHistoryDays: 365,
      exportData: true,
      prioritySupport: true
    }
  };

  await db.updateUser(user.id, { subscription });

  // Handle affiliate commission if user was referred
  const referralCode = new URLSearchParams(user.referralSource || '').get('ref');
  if (referralCode) {
    await processAffiliateCommission(user.id, payment.amount, 'subscription', referralCode);
  }
}

// Stripe webhook handler (Recommended for International Customers)
router.post('/stripe', async (req: Request, res: Response) => {
  try {
    console.log('Stripe webhook received:', req.body);

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const sig = req.headers['stripe-signature'] as string;
    
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
      console.log('Invalid Stripe webhook signature');
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { user_id, plan_id } = session.metadata;
      
      // Find the payment record
      const payments = await db.getUserPayments(user_id);
      const payment = payments.find(p => p.paymentGatewayId === session.id);
      
      if (payment) {
        // Update payment status
        await db.updatePayment(payment.id, {
          status: 'completed',
          completedAt: new Date().toISOString()
        });

        // Update user subscription
        const user = await db.getUserById(payment.userId);
        if (user && payment.type === 'subscription') {
          await activateSubscription(user, payment);
        }
      }
    }

    return res.json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
});

// PayPal webhook handler (For International Customers)
router.post('/paypal', async (req: Request, res: Response) => {
  try {
    console.log('PayPal webhook received:', req.body);

    const signature = req.headers['paypal-signature'] as string;
    const isValid = await paymentService.verifyWebhook(req.body, signature, 'paypal');
    
    if (!isValid) {
      console.log('Invalid PayPal webhook signature');
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    const { event_type, resource } = req.body;

    if (event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      const { id, amount, custom_id } = resource;
      
      // Find payment by PayPal order ID - need to get all payments
      const allUsers = await db.getUsers();
      let payment = null;
      for (const user of allUsers) {
        const userPayments = await db.getUserPayments(user.id);
        payment = userPayments.find(p => p.paymentGatewayId === id);
        if (payment) break;
      }
      
      if (payment) {
        // Update payment status
        await db.updatePayment(payment.id, {
          status: 'completed',
          completedAt: new Date().toISOString()
        });

        // Update user subscription
        const user = await db.getUserById(payment.userId);
        if (user && payment.type === 'subscription') {
          await activateSubscription(user, payment);
        }
      }
    }

    return res.json({ success: true, message: 'Webhook processed' });
  } catch (error) {
    console.error('PayPal webhook error:', error);
    return res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
});



// Generic webhook endpoint (for testing)
router.post('/', (req, res) => {
  console.log('Generic webhook received:', req.body);
  res.json({ success: true, message: 'Webhook received' });
});

export default router; 