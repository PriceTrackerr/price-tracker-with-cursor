import React, { useState, useEffect } from 'react';
import { Check, Zap, TrendingUp, Download, Bell, Sparkles } from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';

interface Plan {
    id: string;
    name: string;
    price: number;
    interval: string;
    trialDays?: number;
    features: {
        productLimit: number;
        aiRecommendation: boolean;
        exportData: boolean;
        notificationsPerDay: number;
    };
    description: string;
}

const Pricing: React.FC = () => {
    const { user } = useAuth();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingPlan, setProcessingPlan] = useState<string | null>(null);
    const [currentTier, setCurrentTier] = useState<string>('free');

    useEffect(() => {
        fetchPlans();
        if (user) {
            fetchSubscriptionStatus();
        }
    }, [user]);

    const fetchPlans = async () => {
        try {
            const response = await axios.get(`${API_BASE}/subscriptions/plans`);
            if (response.data.success) {
                setPlans(response.data.plans);
            }
        } catch (error) {
            console.error('Error fetching plans:', error);
            toast.error('Failed to load pricing plans');
        } finally {
            setLoading(false);
        }
    };

    const fetchSubscriptionStatus = async () => {
        try {
            const response = await axios.get(`${API_BASE}/subscriptions/status`, {
                params: { userId: user?.id },
            });
            if (response.data.success) {
                setCurrentTier(response.data.subscription.tier);
            }
        } catch (error) {
            console.error('Error fetching subscription status:', error);
        }
    };

    const handleUpgrade = async (planId: string) => {
        if (!user) {
            toast.error('Please log in to upgrade');
            return;
        }

        setProcessingPlan(planId);
        try {
            const response = await axios.post(`${API_BASE}/subscriptions/create-checkout`, {
                planId,
                userId: user.id,
                email: user.email,
            });

            if (response.data.success) {
                // Redirect to LemonSqueezy checkout
                window.location.href = response.data.checkoutUrl;
            }
        } catch (error: any) {
            console.error('Error creating checkout:', error);
            toast.error(error.response?.data?.error || 'Failed to start checkout');
        } finally {
            setProcessingPlan(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        Choose Your Plan
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-300">
                        Start with a free plan, upgrade when you need more
                    </p>
                    {currentTier !== 'free' && (
                        <div className="mt-4 inline-flex items-center px-4 py-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
                            <Sparkles className="w-5 h-5 mr-2" />
                            Current Plan: {currentTier.toUpperCase()}
                        </div>
                    )}
                </div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {plans.map((plan) => {
                        const isFree = plan.id === 'free';
                        const isPro = plan.id !== 'free';
                        const isCurrentPlan = plan.name.toLowerCase() === currentTier;

                        return (
                            <div
                                key={plan.id}
                                className={`relative rounded-2xl shadow-xl overflow-hidden transition-transform hover:scale-105 ${isPro
                                    ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white'
                                    : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700'
                                    }`}
                            >
                                {isPro && (
                                    <div className="absolute top-0 right-0 bg-yellow-400 text-gray-900 px-4 py-1 text-sm font-bold rounded-bl-lg">
                                        POPULAR
                                    </div>
                                )}

                                <div className="p-8">
                                    {/* Plan Header */}
                                    <div className="mb-6">
                                        <h3 className={`text-2xl font-bold mb-2 ${isFree ? 'text-gray-900 dark:text-white' : ''}`}>
                                            {plan.name}
                                        </h3>
                                        <p className={`text-sm ${isFree ? 'text-gray-600 dark:text-gray-300' : 'text-blue-100'}`}>
                                            {plan.description}
                                        </p>
                                    </div>

                                    {/* Price */}
                                    <div className="mb-6">
                                        <div className="flex items-baseline">
                                            <span className={`text-5xl font-bold ${isFree ? 'text-gray-900 dark:text-white' : ''}`}>
                                                ${plan.price}
                                            </span>
                                            <span className={`ml-2 ${isFree ? 'text-gray-600 dark:text-gray-300' : 'text-blue-100'}`}>
                                                /{plan.interval}
                                            </span>
                                        </div>
                                        {plan.trialDays && (
                                            <p className="mt-2 text-sm text-blue-100">
                                                {plan.trialDays}-day free trial
                                            </p>
                                        )}
                                    </div>

                                    {/* Features */}
                                    <ul className="space-y-4 mb-8">
                                        <li className="flex items-start">
                                            <Check className={`w-5 h-5 mr-3 flex-shrink-0 ${isFree ? 'text-green-600' : 'text-green-300'}`} />
                                            <span className={isFree ? 'text-gray-700 dark:text-gray-200' : ''}>
                                                <strong>{plan.features.productLimit}</strong> products tracked per day
                                            </span>
                                        </li>
                                        <li className="flex items-start">
                                            <Check className={`w-5 h-5 mr-3 flex-shrink-0 ${isFree ? 'text-green-600' : 'text-green-300'}`} />
                                            <span className={isFree ? 'text-gray-700 dark:text-gray-200' : ''}>
                                                <strong>{plan.features.notificationsPerDay}</strong> price drop notification{plan.features.notificationsPerDay > 1 ? 's' : ''} per day
                                            </span>
                                        </li>
                                        <li className="flex items-start">
                                            {plan.features.aiRecommendation ? (
                                                <>
                                                    <Check className={`w-5 h-5 mr-3 flex-shrink-0 ${isFree ? 'text-green-600' : 'text-green-300'}`} />
                                                    <span className={isFree ? 'text-gray-700 dark:text-gray-200' : ''}>
                                                        <Sparkles className="w-4 h-4 inline mr-1" />
                                                        AI Smart Recommendations
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="w-5 h-5 mr-3 flex-shrink-0 text-gray-400">✕</span>
                                                    <span className="text-gray-400 dark:text-gray-500">AI Smart Recommendations</span>
                                                </>
                                            )}
                                        </li>
                                        <li className="flex items-start">
                                            {plan.features.exportData ? (
                                                <>
                                                    <Check className={`w-5 h-5 mr-3 flex-shrink-0 ${isFree ? 'text-green-600' : 'text-green-300'}`} />
                                                    <span className={isFree ? 'text-gray-700 dark:text-gray-200' : ''}>
                                                        <Download className="w-4 h-4 inline mr-1" />
                                                        Export Data (CSV, PDF)
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="w-5 h-5 mr-3 flex-shrink-0 text-gray-400">✕</span>
                                                    <span className="text-gray-400 dark:text-gray-500">Export Data</span>
                                                </>
                                            )}
                                        </li>
                                        <li className="flex items-start">
                                            <Check className={`w-5 h-5 mr-3 flex-shrink-0 ${isFree ? 'text-green-600' : 'text-green-300'}`} />
                                            <span className={isFree ? 'text-gray-700 dark:text-gray-200' : ''}>
                                                <TrendingUp className="w-4 h-4 inline mr-1" />
                                                Price History Tracking
                                            </span>
                                        </li>
                                        <li className="flex items-start">
                                            <Check className={`w-5 h-5 mr-3 flex-shrink-0 ${isFree ? 'text-green-600' : 'text-green-300'}`} />
                                            <span className={isFree ? 'text-gray-700 dark:text-gray-200' : ''}>
                                                <Bell className="w-4 h-4 inline mr-1" />
                                                Email Alerts
                                            </span>
                                        </li>
                                    </ul>

                                    {/* CTA Button */}
                                    {isFree ? (
                                        <button
                                            disabled
                                            className="w-full py-3 px-6 rounded-lg font-semibold bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                        >
                                            {isCurrentPlan ? 'Current Plan' : 'Always Free'}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleUpgrade(plan.id)}
                                            disabled={processingPlan === plan.id || isCurrentPlan}
                                            className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${isCurrentPlan
                                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                                : 'bg-white text-blue-600 hover:bg-gray-100 hover:shadow-lg'
                                                }`}
                                        >
                                            {processingPlan === plan.id ? (
                                                <span className="flex items-center justify-center">
                                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
                                                    Processing...
                                                </span>
                                            ) : isCurrentPlan ? (
                                                'Current Plan'
                                            ) : (
                                                <>
                                                    <Zap className="w-5 h-5 inline mr-2" />
                                                    Upgrade to Pro
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* FAQ or Additional Info */}
                <div className="mt-16 text-center">
                    <p className="text-gray-600 dark:text-gray-400">
                        All plans include 7 platform support (Amazon, eBay, AliExpress, Walmart, Target, BestBuy, Shein)
                    </p>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
                        Need help choosing? <a href="/contact" className="text-blue-600 hover:underline">Contact us</a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Pricing;
