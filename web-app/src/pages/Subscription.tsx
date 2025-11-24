import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { useAuth } from '../components/AuthContext';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  features: {
    maxTrackedProducts: number;
    alertFrequency: string;
    priceHistoryDays: number;
    exportData: boolean;
    prioritySupport: boolean;
  };
}

const DEFAULT_PLANS: SubscriptionPlan[] = [
  {
    id: 'basic_monthly',
    name: 'Basic Monthly',
    price: 3,
    currency: 'USD',
    interval: 'monthly',
    features: {
      maxTrackedProducts: 50,
      alertFrequency: 'daily',
      priceHistoryDays: 60,
      exportData: false,
      prioritySupport: false,
    },
  },
  {
    id: 'basic_yearly',
    name: 'Basic Yearly',
    price: 30,
    currency: 'USD',
    interval: 'yearly',
    features: {
      maxTrackedProducts: 50,
      alertFrequency: 'daily',
      priceHistoryDays: 60,
      exportData: false,
      prioritySupport: false,
    },
  },
  {
    id: 'premium_monthly',
    name: 'Premium Monthly',
    price: 8,
    currency: 'USD',
    interval: 'monthly',
    features: {
      maxTrackedProducts: 200,
      alertFrequency: 'instant',
      priceHistoryDays: 365,
      exportData: true,
      prioritySupport: true,
    },
  },
  {
    id: 'premium_yearly',
    name: 'Premium Yearly',
    price: 80,
    currency: 'USD',
    interval: 'yearly',
    features: {
      maxTrackedProducts: 200,
      alertFrequency: 'instant',
      priceHistoryDays: 365,
      exportData: true,
      prioritySupport: true,
    },
  },
];

interface SubscriptionStatus {
  isActive: boolean;
  plan: string;
  isFreePeriod: boolean;
  daysRemaining: number;
  features: any;
  currentUsage: {
    trackedProducts: number;
    alertsThisMonth: number;
  };
}

const Subscription: React.FC = () => {
  const { user } = useAuth();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>(DEFAULT_PLANS);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      const [subscriptionRes, plansRes] = await Promise.all([
        fetch('/api/payments/subscription', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }),
        fetch('/api/payments/plans')
      ]);

      const subscriptionData = await subscriptionRes.json();
      const plansData = await plansRes.json();

      if (subscriptionData.success) {
        setSubscriptionStatus(subscriptionData.data.subscription);
      }

      if (plansData.success && Array.isArray(plansData.data?.plans) && plansData.data.plans.length) {
        setPlans(plansData.data.plans);
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatFrequency = (freq?: string) => {
    if (!freq) return 'Daily';
    return freq.charAt(0).toUpperCase() + freq.slice(1);
  };

  const buildFeatureList = (plan?: SubscriptionPlan) => {
    const target = plan || DEFAULT_PLANS[0];
    const base = target.features || DEFAULT_PLANS[0].features;
    return [
      `${base.maxTrackedProducts} tracked products`,
      `${formatFrequency(base.alertFrequency)} alerts`,
      `${base.priceHistoryDays}-day price history`,
      base.exportData ? 'Data export included' : 'Email summaries',
      base.prioritySupport ? 'Priority support' : 'Standard support',
    ];
  };

  const effectivePlans = plans.length ? plans : DEFAULT_PLANS;
  const plansForCycle = effectivePlans.filter((plan) => plan.interval === billingCycle);
  const plansToDisplay = plansForCycle.length ? plansForCycle : effectivePlans;
  const showingFallbackInterval = !plansForCycle.length && effectivePlans.length > 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading subscription details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Subscription Plans
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Track prices, get alerts, and save money on your favorite products
          </p>
        </div>

        {/* Free Period Banner */}
        {subscriptionStatus?.isFreePeriod && (
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-6 mb-8 text-center">
            <div className="text-4xl mb-2">🎉</div>
            <h2 className="text-2xl font-bold mb-2">You're in the FREE Period!</h2>
            <p className="text-lg mb-4">
              Enjoy all Premium features for the first 7 days - completely free!
            </p>
            <div className="bg-white bg-opacity-20 rounded-lg p-4 inline-block">
              <p className="text-sm">
                <strong>7 days</strong> remaining in your free period
              </p>
            </div>
          </div>
        )}

        {/* Current Status */}
        {subscriptionStatus && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-xl font-semibold mb-4">Current Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600">Plan:</p>
                <p className="font-semibold capitalize">{subscriptionStatus.plan.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-gray-600">Status:</p>
                <p className="font-semibold">
                  {subscriptionStatus.isActive ? 'Active' : 'Inactive'}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Your Tracked Products:</p>
                <p className="font-semibold text-blue-600">
                  {subscriptionStatus.currentUsage.trackedProducts} / {subscriptionStatus.features.maxTrackedProducts}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Alerts This Month:</p>
                <p className="font-semibold text-green-600">
                  {subscriptionStatus.currentUsage.alertsThisMonth}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Alert Frequency:</p>
                <p className="font-semibold capitalize">{subscriptionStatus.features.alertFrequency}</p>
              </div>
              <div>
                <p className="text-gray-600">Price History:</p>
                <p className="font-semibold">{subscriptionStatus.features.priceHistoryDays} days</p>
              </div>
            </div>
          </div>
        )}

        {/* Future Plans (After Free Period) */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-center mb-8">
            Future Plans (After Free Period)
          </h2>

          {/* Pricing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <span className="text-sm text-gray-600">Monthly</span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                billingCycle === 'yearly' ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className="text-sm text-gray-600">Yearly</span>
            {billingCycle === 'yearly' && (
              <span className="text-sm text-green-600 font-semibold">Save with annual billing</span>
            )}
          </div>

          {showingFallbackInterval && (
            <p className="text-center text-sm text-gray-500 mb-4">
              No {billingCycle} plans yet — showing {plansToDisplay[0]?.interval} plans instead.
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Free Plan */}
            <div className="bg-white rounded-lg shadow-md p-6 border-2 border-gray-200">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Free Plan</h3>
                <div className="text-3xl font-bold text-gray-900">
                  $0<span className="text-sm text-gray-500">/month</span>
                </div>
                <p className="text-gray-600 mt-1">After the 7-day premium trial</p>
              </div>

              <div className="space-y-3 mb-6 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>10 tracked products</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>1-2 price alerts per month</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>30-day price history</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Basic support</span>
                </div>
              </div>

              <Link
                to="/auth"
                className="w-full bg-gray-100 text-gray-900 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors font-semibold block text-center"
              >
                Get Started Free
              </Link>
            </div>

            {plansToDisplay.map((plan, index) => (
              <div
                key={plan.id}
                className={`bg-white rounded-lg shadow-md p-6 border-2 ${
                  index === 0 ? 'border-blue-500' : 'border-gray-200'
                } relative`}
              >
                {index === 0 && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className={`text-3xl font-bold ${index === 0 ? 'text-blue-600' : 'text-gray-900'}`}>
                    ${plan.price}
                    <span className="text-sm text-gray-500">/{plan.interval}</span>
                  </div>
                </div>
                <div className="space-y-3 mb-6 text-sm">
                  {buildFeatureList(plan).map((feature) => (
                    <div key={feature} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  className={`w-full py-2 px-4 rounded-lg font-semibold transition-colors ${
                    index === 0 ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {subscriptionStatus?.isFreePeriod ? 'Coming Soon' : `Choose ${plan.name}`}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Free Period Info */}
        {subscriptionStatus?.isFreePeriod && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Why Start with a Free Period?
            </h3>
            <p className="text-blue-800 mb-4">
              We want you to experience the full value of our service before making any payment decisions. 
              Use all Premium features for 7 days, then choose the plan that works best for you.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white rounded p-3">
                <div className="text-2xl mb-1">🚀</div>
                <p className="font-semibold">Build Trust</p>
                <p className="text-gray-600">Prove our value first</p>
              </div>
              <div className="bg-white rounded p-3">
                <div className="text-2xl mb-1">💡</div>
                <p className="font-semibold">Learn & Grow</p>
                <p className="text-gray-600">Discover all features</p>
              </div>
              <div className="bg-white rounded p-3">
                <div className="text-2xl mb-1">💰</div>
                <p className="font-semibold">Save Money</p>
                <p className="text-gray-600">7 days of free service</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Subscription; 