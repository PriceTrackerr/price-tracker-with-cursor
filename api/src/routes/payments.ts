import express, { Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getDb } from '../config/database';
import paymentService, { SUBSCRIPTION_PLANS } from '../services/paymentService';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const db = getDb();

// Helper to get persisted plans or fallback
async function getEffectivePlans() {
  const stored = await db.getSubscriptionPlans();
  // If nothing stored yet, return defaults
  if (!stored || stored.length === 0) return SUBSCRIPTION_PLANS;
  // Merge: override defaults by id with stored entries; include any custom stored plans
  const byId: Record<string, any> = {};
  // Start from defaults to preserve order
  for (const p of SUBSCRIPTION_PLANS) byId[p.id] = { ...p };
  // Apply stored overrides or add customs
  for (const sp of stored) byId[sp.id] = { ...byId[sp.id], ...sp };
  // Remove any defaults marked as deleted
  const deletedIds = await db.getDeletedSubscriptionPlanIds?.() ?? [];
  return Object.entries(byId)
    .filter(([id]) => !deletedIds.includes(id))
    .map(([, plan]) => plan);
}

// Get all available subscription plans
router.get('/plans', async (req: Request, res: Response) => {
  try {
    const userCountry = req.headers['cf-ipcountry'] || req.query.country || 'US';
    const availablePaymentMethods = paymentService.getAvailablePaymentMethods(userCountry as string);
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
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Admin: create a new plan
router.post('/plans', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    // Use isAdmin from auth middleware
    if (!req.user!.isAdmin) {
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

    await db.addSubscriptionPlan(plan);
    return res.json({ success: true, data: { plan } });
  } catch (e) {
    console.error('Error creating plan:', e);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Admin: update a plan
router.put('/plans/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user!.isAdmin) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    const planId = String(req.params.id);
    const updated = await db.updateSubscriptionPlan(planId, req.body || {});
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }
    return res.json({ success: true });
  } catch (e) {
    console.error('Error updating plan:', e);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Admin: delete a plan
router.delete('/plans/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user!.isAdmin) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    const planId = String(req.params.id);
    const deleted = await db.deleteSubscriptionPlan(planId);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }
    return res.json({ success: true });
  } catch (e) {
    console.error('Error deleting plan:', e);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get current user subscription
router.get('/subscription', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await db.getUserById(String(req.user!.uid));
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const subscriptionStatus = paymentService.getCurrentSubscriptionStatus(user);

    // Fetch real user data
    const userProducts = await db.getProducts(user.id);
    const userAlerts = await db.getAllAlerts().then((alerts: any[]) =>
      alerts.filter((alert: any) => alert.userId === user.id)
    );

    // Count alerts this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const alertsThisMonth = userAlerts.filter((alert: any) =>
      new Date(alert.createdAt) >= startOfMonth
    ).length;

    // Update subscription status with real data
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
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Initialize payment for subscription
router.post('/subscribe', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { planId, paymentMethod } = req.body;

    if (!planId || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Plan ID and payment method are required'
      });
    }

    // Use effective plans so admin updates are respected
    const effectivePlans = await getEffectivePlans();
    const plan = effectivePlans.find(p => p.id === planId);
    if (!plan) {
      return res.status(400).json({ success: false, message: 'Invalid plan' });
    }

    const user = await db.getUserById(String(req.user!.uid));
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let paymentResult;
    switch (paymentMethod) {
      case 'paypal':
        paymentResult = await paymentService.createPayPalPayment(user, plan);
        break;
      case 'stripe':
        paymentResult = await paymentService.createStripePayment(user, plan);
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

    // Create payment record
    const payment = {
      id: uuidv4(),
      userId: user.id,
      type: 'subscription' as const,
      amount: plan.price,
      currency: plan.currency,
      status: 'pending' as const,
      paymentMethod: paymentMethod,
      paymentGatewayId: paymentResult.data.id || paymentResult.data.tx_ref,
      subscriptionPlan: plan.id.includes('premium') ? 'premium' as const : 'pro' as const,
      createdAt: new Date().toISOString(),
      metadata: {
        planId: plan.id,
        planName: plan.name
      }
    };

    await db.addPayment(payment);

    return res.json({
      success: true,
      data: {
        payment,
        checkout_url: paymentResult.checkout_url,
        payment_code: paymentResult.payment_code // For WeBirr
      }
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get payment history
router.get('/history', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const payments = await db.getUserPayments(String(req.user!.uid));
    res.json({
      success: true,
      data: { payments }
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Cancel subscription
router.post('/cancel', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await db.getUserById(String(req.user!.uid));
    if (!user || !user.subscription) {
      return res.status(404).json({ success: false, message: 'No active subscription found' });
    }

    // Update subscription status
    const updatedSubscription = {
      ...user.subscription,
      status: 'cancelled' as const
    };

    await db.updateUser(user.id, { subscription: updatedSubscription });

    return res.json({
      success: true,
      message: 'Subscription cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Affiliate routes
router.get('/affiliate/dashboard', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await db.getUserById(req.user!.uid);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get or create affiliate data
    let affiliate = user.affiliate;
    if (!affiliate) {
      affiliate = {
        isAffiliate: false,
        referralCode: `PT${user.id.slice(-6).toUpperCase()}`,
        commissionRate: 0.1, // 10%
        totalEarnings: 0,
        pendingEarnings: 0
      };
      await db.updateUser(user.id, { affiliate });
    }

    // Get affiliate transactions
    const transactions = await db.getAffiliateTransactions(user.id);
    const referrals = await db.getAffiliateReferrals(user.id);

    return res.json({
      success: true,
      data: {
        affiliate,
        transactions,
        referrals,
        referralLink: `${process.env.FRONTEND_URL}?ref=${affiliate.referralCode}`
      }
    });
  } catch (error) {
    console.error('Error fetching affiliate dashboard:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Enable affiliate program
router.post('/affiliate/enable', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { payoutMethod, payoutDetails } = req.body;

    if (!payoutMethod) {
      return res.status(400).json({
        success: false,
        message: 'Payout method is required'
      });
    }

    const user = await db.getUserById(req.user!.uid);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const affiliate = {
      isAffiliate: true,
      referralCode: user.affiliate?.referralCode || `PT${user.id.slice(-6).toUpperCase()}`,
      commissionRate: 0.1, // 10%
      totalEarnings: user.affiliate?.totalEarnings || 0,
      pendingEarnings: user.affiliate?.pendingEarnings || 0,
      payoutMethod,
      payoutDetails
    };

    await db.updateUser(user.id, { affiliate });

    return res.json({
      success: true,
      data: { affiliate },
      message: 'Affiliate program enabled successfully'
    });
  } catch (error) {
    console.error('Error enabling affiliate:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Request payout
router.post('/affiliate/payout', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }

    const user = await db.getUserById(req.user!.uid);
    if (!user || !user.affiliate || !user.affiliate.isAffiliate) {
      return res.status(404).json({ success: false, message: 'Affiliate account not found' });
    }

    if (amount > (user.affiliate.pendingEarnings || 0)) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance'
      });
    }

    if (amount < 50) { // Minimum payout
      return res.status(400).json({
        success: false,
        message: 'Minimum payout amount is $50'
      });
    }

    // Create payout request
    const payoutRequest = {
      id: uuidv4(),
      affiliateUserId: user.id,
      amount,
      currency: 'USD' as const,
      method: user.affiliate.payoutMethod!,
      status: 'pending' as const,
      requestedAt: new Date().toISOString(),
      details: user.affiliate.payoutDetails
    };

    await db.addPayoutRequest(payoutRequest);

    return res.json({
      success: true,
      data: { payoutRequest },
      message: 'Payout request submitted successfully'
    });
  } catch (error) {
    console.error('Error requesting payout:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router; 