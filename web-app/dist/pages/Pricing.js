import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Check, Zap, TrendingUp, Download, Bell, Sparkles } from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';
const Pricing = () => {
    const { user } = useAuth();
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingPlan, setProcessingPlan] = useState(null);
    const [currentTier, setCurrentTier] = useState('free');
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
        }
        catch (error) {
            console.error('Error fetching plans:', error);
            toast.error('Failed to load pricing plans');
        }
        finally {
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
        }
        catch (error) {
            console.error('Error fetching subscription status:', error);
        }
    };
    const handleUpgrade = async (planId) => {
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
        }
        catch (error) {
            console.error('Error creating checkout:', error);
            toast.error(error.response?.data?.error || 'Failed to start checkout');
        }
        finally {
            setProcessingPlan(null);
        }
    };
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center min-h-screen", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" }) }));
    }
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "max-w-7xl mx-auto", children: [_jsxs("div", { className: "text-center mb-12", children: [_jsx("h1", { className: "text-4xl font-bold text-gray-900 dark:text-white mb-4", children: "Choose Your Plan" }), _jsx("p", { className: "text-xl text-gray-600 dark:text-gray-300", children: "Start with a free plan, upgrade when you need more" }), currentTier !== 'free' && (_jsxs("div", { className: "mt-4 inline-flex items-center px-4 py-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full", children: [_jsx(Sparkles, { className: "w-5 h-5 mr-2" }), "Current Plan: ", currentTier.toUpperCase()] }))] }), _jsx("div", { className: "grid md:grid-cols-2 gap-8 max-w-5xl mx-auto", children: plans.map((plan) => {
                        const isFree = plan.id === 'free';
                        const isPro = plan.id !== 'free';
                        const isCurrentPlan = plan.name.toLowerCase() === currentTier;
                        return (_jsxs("div", { className: `relative rounded-2xl shadow-xl overflow-hidden transition-transform hover:scale-105 ${isPro
                                ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white'
                                : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700'}`, children: [isPro && (_jsx("div", { className: "absolute top-0 right-0 bg-yellow-400 text-gray-900 px-4 py-1 text-sm font-bold rounded-bl-lg", children: "POPULAR" })), _jsxs("div", { className: "p-8", children: [_jsxs("div", { className: "mb-6", children: [_jsx("h3", { className: `text-2xl font-bold mb-2 ${isFree ? 'text-gray-900 dark:text-white' : ''}`, children: plan.name }), _jsx("p", { className: `text-sm ${isFree ? 'text-gray-600 dark:text-gray-300' : 'text-blue-100'}`, children: plan.description })] }), _jsxs("div", { className: "mb-6", children: [_jsxs("div", { className: "flex items-baseline", children: [_jsxs("span", { className: `text-5xl font-bold ${isFree ? 'text-gray-900 dark:text-white' : ''}`, children: ["$", plan.price] }), _jsxs("span", { className: `ml-2 ${isFree ? 'text-gray-600 dark:text-gray-300' : 'text-blue-100'}`, children: ["/", plan.interval] })] }), plan.trialDays && (_jsxs("p", { className: "mt-2 text-sm text-blue-100", children: [plan.trialDays, "-day free trial"] }))] }), _jsxs("ul", { className: "space-y-4 mb-8", children: [_jsxs("li", { className: "flex items-start", children: [_jsx(Check, { className: `w-5 h-5 mr-3 flex-shrink-0 ${isFree ? 'text-green-600' : 'text-green-300'}` }), _jsxs("span", { className: isFree ? 'text-gray-700 dark:text-gray-200' : '', children: [_jsx("strong", { children: plan.features.productLimit }), " products tracked per day"] })] }), _jsxs("li", { className: "flex items-start", children: [_jsx(Check, { className: `w-5 h-5 mr-3 flex-shrink-0 ${isFree ? 'text-green-600' : 'text-green-300'}` }), _jsxs("span", { className: isFree ? 'text-gray-700 dark:text-gray-200' : '', children: [_jsx("strong", { children: plan.features.notificationsPerDay }), " price drop notification", plan.features.notificationsPerDay > 1 ? 's' : '', " per day"] })] }), _jsx("li", { className: "flex items-start", children: plan.features.aiRecommendation ? (_jsxs(_Fragment, { children: [_jsx(Check, { className: `w-5 h-5 mr-3 flex-shrink-0 ${isFree ? 'text-green-600' : 'text-green-300'}` }), _jsxs("span", { className: isFree ? 'text-gray-700 dark:text-gray-200' : '', children: [_jsx(Sparkles, { className: "w-4 h-4 inline mr-1" }), "AI Smart Recommendations"] })] })) : (_jsxs(_Fragment, { children: [_jsx("span", { className: "w-5 h-5 mr-3 flex-shrink-0 text-gray-400", children: "\u2715" }), _jsx("span", { className: "text-gray-400 dark:text-gray-500", children: "AI Smart Recommendations" })] })) }), _jsx("li", { className: "flex items-start", children: plan.features.exportData ? (_jsxs(_Fragment, { children: [_jsx(Check, { className: `w-5 h-5 mr-3 flex-shrink-0 ${isFree ? 'text-green-600' : 'text-green-300'}` }), _jsxs("span", { className: isFree ? 'text-gray-700 dark:text-gray-200' : '', children: [_jsx(Download, { className: "w-4 h-4 inline mr-1" }), "Export Data (CSV, PDF)"] })] })) : (_jsxs(_Fragment, { children: [_jsx("span", { className: "w-5 h-5 mr-3 flex-shrink-0 text-gray-400", children: "\u2715" }), _jsx("span", { className: "text-gray-400 dark:text-gray-500", children: "Export Data" })] })) }), _jsxs("li", { className: "flex items-start", children: [_jsx(Check, { className: `w-5 h-5 mr-3 flex-shrink-0 ${isFree ? 'text-green-600' : 'text-green-300'}` }), _jsxs("span", { className: isFree ? 'text-gray-700 dark:text-gray-200' : '', children: [_jsx(TrendingUp, { className: "w-4 h-4 inline mr-1" }), "Price History Tracking"] })] }), _jsxs("li", { className: "flex items-start", children: [_jsx(Check, { className: `w-5 h-5 mr-3 flex-shrink-0 ${isFree ? 'text-green-600' : 'text-green-300'}` }), _jsxs("span", { className: isFree ? 'text-gray-700 dark:text-gray-200' : '', children: [_jsx(Bell, { className: "w-4 h-4 inline mr-1" }), "Email Alerts"] })] })] }), isFree ? (_jsx("button", { disabled: true, className: "w-full py-3 px-6 rounded-lg font-semibold bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed", children: isCurrentPlan ? 'Current Plan' : 'Always Free' })) : (_jsx("button", { onClick: () => handleUpgrade(plan.id), disabled: processingPlan === plan.id || isCurrentPlan, className: `w-full py-3 px-6 rounded-lg font-semibold transition-all ${isCurrentPlan
                                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                                : 'bg-white text-blue-600 hover:bg-gray-100 hover:shadow-lg'}`, children: processingPlan === plan.id ? (_jsxs("span", { className: "flex items-center justify-center", children: [_jsx("div", { className: "animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2" }), "Processing..."] })) : isCurrentPlan ? ('Current Plan') : (_jsxs(_Fragment, { children: [_jsx(Zap, { className: "w-5 h-5 inline mr-2" }), "Upgrade to Pro"] })) }))] })] }, plan.id));
                    }) }), _jsxs("div", { className: "mt-16 text-center", children: [_jsx("p", { className: "text-gray-600 dark:text-gray-400", children: "All plans include 7 platform support (Amazon, eBay, AliExpress, Walmart, Target, BestBuy, Shein)" }), _jsxs("p", { className: "mt-2 text-sm text-gray-500 dark:text-gray-500", children: ["Need help choosing? ", _jsx("a", { href: "/contact", className: "text-blue-600 hover:underline", children: "Contact us" })] })] })] }) }));
};
export default Pricing;
//# sourceMappingURL=Pricing.js.map