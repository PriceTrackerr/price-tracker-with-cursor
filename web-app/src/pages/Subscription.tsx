import React, { useState, useEffect } from 'react';
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
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
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

      if (plansData.success) {
        setPlans(plansData.data.plans);
      }
    } catch (error) {
      console.error('Error fetching subscription data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helpers to pick dynamic prices from backend data with fallback
  const findPlanPrice = (keyword: 'basic' | 'premium', interval: 'monthly' | 'yearly', fallback: number) => {
    const p = plans.find(pl => pl.interval === interval && (pl.name || '').toLowerCase().includes(keyword));
    return p?.price ?? fallback;
  };

  const basicMonthly = findPlanPrice('basic', 'monthly', 3);
  const basicYearly = findPlanPrice('basic', 'yearly', 30);
  const premiumMonthly = findPlanPrice('premium', 'monthly', 8);
  const premiumYearly = findPlanPrice('premium', 'yearly', 80);

  const getFeatureIcon = (enabled: boolean) => {
    return enabled ? '✅' : '❌';
  };

  const formatDays = (days: number) => {
    if (days === 0) return 'Expired';
    if (days === 1) return '1 day';
    return `${days} days`;
  };

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
          <div className="flex items-center justify-center gap-4 mb-8">
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
              <span className="text-sm text-green-600 font-semibold">Save 17%</span>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Basic Plan */}
            <div className="bg-white rounded-lg shadow-md p-6 border-2 border-blue-500 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                  Most Popular
                </span>
              </div>
              
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Basic</h3>
                <div className="text-3xl font-bold text-blue-600">
                  ${billingCycle === 'yearly' ? String(basicYearly) : String(basicMonthly)}
                  <span className="text-sm text-gray-500">/{billingCycle === 'yearly' ? 'year' : 'month'}</span>
                </div>
                {billingCycle === 'yearly' && (
                  <p className="text-sm text-green-600 font-semibold mt-1">Save 17%</p>
                )}
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center">
                  <span className="mr-2">✅</span>
                  <span>50 tracked products</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2">✅</span>
                  <span>Daily alerts</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2">✅</span>
                  <span>60-day price history</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2">❌</span>
                  <span>Data export</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2">❌</span>
                  <span>Priority support</span>
                </div>
              </div>

              <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
                {subscriptionStatus?.isFreePeriod ? 'Coming Soon' : 'Choose Basic'}
              </button>
            </div>

            {/* Premium Plan */}
            <div className="bg-white rounded-lg shadow-md p-6 border-2 border-gray-200">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Premium</h3>
                <div className="text-3xl font-bold text-gray-900">
                  ${billingCycle === 'yearly' ? String(premiumYearly) : String(premiumMonthly)}
                  <span className="text-sm text-gray-500">/{billingCycle === 'yearly' ? 'year' : 'month'}</span>
                </div>
                {billingCycle === 'yearly' && (
                  <p className="text-sm text-green-600 font-semibold mt-1">Save 17%</p>
                )}
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center">
                  <span className="mr-2">✅</span>
                  <span>200 tracked products</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2">✅</span>
                  <span>Instant alerts</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2">✅</span>
                  <span>365-day price history</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2">✅</span>
                  <span>Data export</span>
                </div>
                <div className="flex items-center">
                  <span className="mr-2">✅</span>
                  <span>Priority support</span>
                </div>
              </div>

              <button className="w-full bg-gray-900 text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors font-semibold">
                {subscriptionStatus?.isFreePeriod ? 'Coming Soon' : 'Choose Premium'}
              </button>
            </div>
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