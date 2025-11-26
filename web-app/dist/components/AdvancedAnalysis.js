import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
// Helper function to safely format numbers
const safeToFixed = (value, decimals = 2) => {
    try {
        const num = Number(value);
        if (typeof num !== 'number' || isNaN(num) || !isFinite(num)) {
            return '0.00';
        }
        return num.toFixed(decimals);
    }
    catch {
        return '0.00';
    }
};
export default function AdvancedAnalysis({ product }) {
    const { getAuthHeaders, token, user } = useAuth();
    const [activeTab, setActiveTab] = useState('condition');
    const [loading, setLoading] = useState(true);
    const [aiRecommendation, setAiRecommendation] = useState(null);
    // Safety check - ensure product has required fields
    if (!product || !product.id) {
        return (_jsx("div", { className: "bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-4", children: _jsx("p", { className: "text-gray-600 text-sm", children: "Product data unavailable" }) }));
    }
    const safePrice = typeof product.price === 'number' && !isNaN(product.price) ? product.price : 0;
    const [features, setFeatures] = useState({
        conditionScore: product.conditionScore || 82,
        couponSavings: Math.round(safePrice * 0.15),
        finalPrice: product.finalPrice || Math.round(safePrice * 0.85),
        credibilityScore: product.credibilityScore || 87,
        communityRating: product.communityRating || 4.2,
        globalSavings: 0,
        couponStack: [],
        globalMarkets: [],
        bestDeal: 'US',
        recommendation: 'buy_local',
        priceHistory: [],
        redditSentiment: 'neutral'
    });
    useEffect(() => {
        async function loadAnalysisData() {
            if (!product.id || !token) {
                setLoading(false);
                return;
            }
            setLoading(true);
            try {
                // Load price history
                const historyResponse = await fetch(`/api/products/${product.id}/history`, {
                    headers: getAuthHeaders(),
                });
                let priceHistory = [];
                if (historyResponse.ok) {
                    const historyData = await historyResponse.json();
                    if (historyData.success && Array.isArray(historyData.data)) {
                        priceHistory = historyData.data
                            .slice(-30)
                            .map((h) => ({
                            price: h.price || 0,
                            timestamp: h.timestamp || h.created_at || ''
                        }));
                    }
                }
                // Load advanced analysis
                const response = await fetch(`/api/advanced/product-card-analysis/${product.id}`, {
                    headers: getAuthHeaders(),
                });
                let couponStack = [];
                let globalMarkets = [];
                let redditSentiment = 'neutral';
                let conditionScore = features.conditionScore;
                let credibilityScore = features.credibilityScore;
                let communityRating = features.communityRating;
                if (response.ok) {
                    const data = await response.json();
                    const analysis = data.data || data;
                    if (analysis.conditionAnalysis) {
                        conditionScore = analysis.conditionAnalysis.score || conditionScore;
                    }
                    if (analysis.couponAnalysis) {
                        couponStack = Array.isArray(analysis.couponAnalysis.coupons)
                            ? analysis.couponAnalysis.coupons.map((c) => ({
                                code: c.code || '',
                                discount: c.description || `${c.discountType === 'percentage' ? c.discountValue + '%' : `$${c.discountValue}`} off`,
                                successRate: c.successRate || 0
                            }))
                            : [];
                        const estimatedSavings = Number(analysis.couponAnalysis.estimatedSavings || 0);
                        const currentPrice = typeof product.price === 'number' && !isNaN(product.price) ? product.price : 0;
                        setFeatures(prev => ({
                            ...prev,
                            couponSavings: estimatedSavings,
                            finalPrice: Math.max(0, currentPrice - estimatedSavings),
                            couponStack
                        }));
                    }
                    if (analysis.globalAnalysis) {
                        const ga = analysis.globalAnalysis;
                        const flag = (cc) => {
                            const m = { US: '🇺🇸', EU: '🇪🇺', UK: '🇬🇧', JP: '🇯🇵', CA: '🇨🇦', AU: '🇦🇺', DE: '🇩🇪', FR: '🇫🇷', IT: '🇮🇹', ES: '🇪🇸' };
                            return m[cc] || '🌍';
                        };
                        const basePrice = typeof product.price === 'number' && !isNaN(product.price) ? product.price : 0;
                        globalMarkets = ga.markets
                            ? Object.entries(ga.markets).map(([country, v]) => {
                                const marketLandedCost = typeof v?.landedCost === 'number' && !isNaN(v.landedCost) ? v.landedCost : basePrice;
                                const bestDealCost = typeof (ga.bestDeal?.bestMarket?.landedCost ?? ga.bestDeal?.landedCost) === 'number' && !isNaN(ga.bestDeal?.bestMarket?.landedCost ?? ga.bestDeal?.landedCost)
                                    ? (ga.bestDeal?.bestMarket?.landedCost ?? ga.bestDeal?.landedCost)
                                    : basePrice;
                                return {
                                    country,
                                    flag: flag(country),
                                    price: typeof v?.price === 'number' && !isNaN(v.price) ? v.price : basePrice,
                                    landedCost: marketLandedCost,
                                    savings: bestDealCost - marketLandedCost
                                };
                            })
                            : [];
                        setFeatures(prev => ({
                            ...prev,
                            globalMarkets: Array.isArray(globalMarkets) ? globalMarkets : [],
                            bestDeal: ga.bestDeal?.bestMarket?.countryCode || ga.bestDeal?.countryCode || 'US',
                            recommendation: ga.recommendation || 'buy_local'
                        }));
                    }
                    if (analysis.communityAnalysis) {
                        const ca = analysis.communityAnalysis;
                        // Determine Reddit sentiment from community rating
                        redditSentiment =
                            (ca.communityRating || 0) >= 4 ? 'positive' :
                                (ca.communityRating || 0) >= 3 ? 'neutral' : 'negative';
                        credibilityScore = Math.round(ca.trustScore ?? credibilityScore);
                        communityRating = Number(ca.communityRating ?? communityRating);
                        setFeatures(prev => ({
                            ...prev,
                            credibilityScore,
                            communityRating,
                            redditSentiment
                        }));
                    }
                }
                // Update all features at once - ensure arrays are always arrays
                const updatedFeatures = {
                    ...features,
                    priceHistory: Array.isArray(priceHistory) ? priceHistory : [],
                    couponStack: Array.isArray(couponStack) ? couponStack : [],
                    globalMarkets: Array.isArray(globalMarkets) ? globalMarkets : [],
                    redditSentiment,
                    conditionScore: typeof conditionScore === 'number' && !isNaN(conditionScore) ? conditionScore : features.conditionScore,
                    credibilityScore: typeof credibilityScore === 'number' && !isNaN(credibilityScore) ? credibilityScore : features.credibilityScore,
                    communityRating: typeof communityRating === 'number' && !isNaN(communityRating) ? communityRating : features.communityRating
                };
                setFeatures(updatedFeatures);
                // Load AI recommendation with all collected data
                await loadAIRecommendation(priceHistory, updatedFeatures);
            }
            catch (error) {
                console.error('Error loading advanced analysis:', error);
            }
            finally {
                setLoading(false);
            }
        }
        async function loadAIRecommendation(priceHistory, currentFeatures) {
            if (!product.id || !token)
                return;
            // Only load AI recommendation for Pro users
            if (user?.subscription?.tier !== 'pro')
                return;
            setAiRecommendation({ verdict: '', confidence: 0, reason: '', loading: true });
            try {
                const currentPrice = typeof product.price === 'number' && !isNaN(product.price) ? product.price : 0;
                const lowestPrice = priceHistory.length > 0
                    ? Math.min(...priceHistory.map(h => (typeof h?.price === 'number' && !isNaN(h.price) ? h.price : 0)).filter(p => p > 0), currentPrice)
                    : currentPrice;
                const globalCheapest = currentFeatures.globalMarkets && currentFeatures.globalMarkets.length > 0
                    ? (() => {
                        try {
                            const costs = currentFeatures.globalMarkets
                                .map(m => {
                                if (m && typeof m.landedCost === 'number' && !isNaN(m.landedCost) && isFinite(m.landedCost)) {
                                    return m.landedCost;
                                }
                                return currentPrice;
                            })
                                .filter(p => typeof p === 'number' && !isNaN(p) && isFinite(p) && p > 0);
                            return costs.length > 0 ? Math.min(...costs, currentPrice) : currentPrice;
                        }
                        catch {
                            return currentPrice;
                        }
                    })()
                    : currentPrice;
                const hasCoupon = currentFeatures.couponStack && currentFeatures.couponStack.length > 0;
                const recommendationResponse = await fetch('/api/ai/recommendation', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...getAuthHeaders(),
                    },
                    body: JSON.stringify({
                        productId: product.id,
                        title: product.title || 'Product',
                        currentPrice: product.price || 0,
                        priceHistory: priceHistory || [],
                        lowestPrice: lowestPrice || 0,
                        globalCheapest: globalCheapest || 0,
                        hasCoupon: hasCoupon || false,
                        redditSentiment: currentFeatures.redditSentiment || 'neutral'
                    }),
                });
                if (recommendationResponse.ok) {
                    const recData = await recommendationResponse.json();
                    if (recData.success && recData.data) {
                        setAiRecommendation({
                            verdict: recData.data.verdict || 'WAIT',
                            confidence: recData.data.confidence || 75,
                            reason: recData.data.reason || 'Analysis completed.',
                            loading: false
                        });
                    }
                    else {
                        setAiRecommendation({
                            verdict: 'WAIT',
                            confidence: 70,
                            reason: 'AI thinking… try again',
                            loading: false
                        });
                    }
                }
                else {
                    setAiRecommendation({
                        verdict: 'WAIT',
                        confidence: 70,
                        reason: 'AI thinking… try again',
                        loading: false
                    });
                }
            }
            catch (error) {
                console.error('Error loading AI recommendation:', error);
                setAiRecommendation({
                    verdict: 'WAIT',
                    confidence: 70,
                    reason: 'AI thinking… try again',
                    loading: false
                });
            }
        }
        loadAnalysisData();
    }, [product.id, product.title, product.price, token, getAuthHeaders]);
    const tabs = [
        { id: 'condition', label: '🧠 Condition', color: 'blue' },
        { id: 'coupons', label: '🎟️ Coupons', color: 'green' },
        { id: 'global', label: '🌍 Global', color: 'purple' },
        { id: 'community', label: '👥 Community', color: 'orange' }
    ];
    const getScoreColor = (score) => {
        if (score >= 80)
            return 'text-green-600';
        if (score >= 60)
            return 'text-yellow-600';
        return 'text-red-600';
    };
    const getRiskLevel = (score) => {
        if (score >= 80)
            return { level: 'Low', color: 'bg-green-100 text-green-800' };
        if (score >= 60)
            return { level: 'Medium', color: 'bg-yellow-100 text-yellow-800' };
        return { level: 'High', color: 'bg-red-100 text-red-800' };
    };
    if (loading) {
        return (_jsx("div", { className: "bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-4", children: _jsx("div", { className: "flex items-center justify-center min-h-[300px]", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2" }), _jsx("p", { className: "text-gray-600 text-sm", children: "Loading analysis..." })] }) }) }));
    }
    return (_jsxs("div", { className: "bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-4", children: [_jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsx("span", { className: "text-lg", children: "\u26A1" }), _jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Advanced Analysis" })] }), _jsx("div", { className: "flex space-x-1 mb-4 bg-gray-100 p-1 rounded-lg", children: tabs.map((tab) => (_jsx("button", { onClick: () => setActiveTab(tab.id), className: `flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'}`, children: tab.label }, tab.id))) }), _jsxs("div", { className: "min-h-[200px]", children: [activeTab === 'condition' && (_jsxs("div", { className: "space-y-4", children: [(user?.subscription?.tier === 'pro') ? (aiRecommendation && (_jsx("div", { className: `relative overflow-hidden rounded-xl p-6 shadow-lg ${aiRecommendation.verdict === 'STRONG BUY' || aiRecommendation.verdict === 'BUY'
                                    ? 'bg-gradient-to-br from-green-900 via-green-800 to-emerald-900'
                                    : aiRecommendation.verdict === 'WAIT'
                                        ? 'bg-gradient-to-br from-yellow-900 via-yellow-800 to-amber-900'
                                        : 'bg-gradient-to-br from-red-900 via-red-800 to-rose-900'}`, children: aiRecommendation.loading ? (_jsx("div", { className: "flex items-center justify-center py-8", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-white mb-3" }), _jsx("p", { className: "text-white/90 text-sm font-medium", children: "AI thinking\u2026" })] }) })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx("span", { className: "text-2xl", children: "\uD83E\uDD16" }), _jsx("span", { className: "font-bold text-white text-lg", children: "DeepSeek AI Recommendation" })] }), _jsx("div", { className: "mb-3", children: _jsxs("span", { className: `text-2xl font-bold ${aiRecommendation.verdict === 'STRONG BUY' || aiRecommendation.verdict === 'BUY'
                                                    ? 'text-green-300'
                                                    : aiRecommendation.verdict === 'WAIT'
                                                        ? 'text-yellow-300'
                                                        : 'text-red-300'}`, children: [aiRecommendation.confidence, "% Confidence: ", aiRecommendation.verdict] }) }), _jsx("p", { className: "text-white/90 text-sm mb-4 leading-relaxed", children: aiRecommendation.reason || 'AI thinking… try again' }), _jsxs("a", { href: product.url, target: "_blank", rel: "noopener noreferrer", className: "inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-5 py-2.5 rounded-lg hover:bg-white/30 transition-all font-medium text-sm border border-white/30", children: [_jsx("span", { children: "\uD83D\uDED2" }), "Buy Now with AI Analysis"] })] })) }))) : (_jsxs("div", { className: "relative overflow-hidden rounded-xl p-6 shadow-lg bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx("span", { className: "text-2xl", children: "\uD83D\uDD12" }), _jsx("span", { className: "font-bold text-white text-lg", children: "DeepSeek AI Analysis" })] }), _jsx("p", { className: "text-white/90 text-sm mb-4 leading-relaxed", children: "Unlock AI-powered price predictions, buy/wait recommendations, and sentiment analysis with Pro." }), _jsxs("a", { href: "/subscription", className: "inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-amber-600 text-white px-5 py-2.5 rounded-lg hover:from-yellow-400 hover:to-amber-500 transition-all font-medium text-sm shadow-lg", children: [_jsx("span", { children: "\u2B50" }), "Upgrade to Pro"] })] })), _jsxs("div", { className: "text-center py-8 bg-gray-50 rounded-lg border border-gray-100", children: [_jsx("div", { className: "text-4xl mb-3", children: "\uD83E\uDDE0" }), _jsx("h4", { className: "text-lg font-semibold text-gray-900 mb-2", children: "Condition Analysis Coming Soon" }), _jsx("p", { className: "text-gray-600 max-w-md mx-auto", children: "We're building an AI-powered system to analyze product condition from images and descriptions." })] })] })), activeTab === 'coupons' && (_jsxs("div", { className: "text-center py-12 bg-gray-50 rounded-lg border border-gray-100", children: [_jsx("div", { className: "text-4xl mb-3", children: "\uD83C\uDF9F\uFE0F" }), _jsx("h4", { className: "text-lg font-semibold text-gray-900 mb-2", children: "Coupon Finder Coming Soon" }), _jsx("p", { className: "text-gray-600 max-w-md mx-auto", children: "We're integrating with major coupon providers to automatically find the best deals for you." })] })), activeTab === 'global' && (_jsxs("div", { className: "text-center py-12 bg-gray-50 rounded-lg border border-gray-100", children: [_jsx("div", { className: "text-4xl mb-3", children: "\uD83C\uDF0D" }), _jsx("h4", { className: "text-lg font-semibold text-gray-900 mb-2", children: "Global Comparison Coming Soon" }), _jsx("p", { className: "text-gray-600 max-w-md mx-auto", children: "Compare prices across international markets to find the absolute lowest price worldwide." })] })), activeTab === 'community' && (_jsxs("div", { className: "text-center py-12 bg-gray-50 rounded-lg border border-gray-100", children: [_jsx("div", { className: "text-4xl mb-3", children: "\uD83D\uDC65" }), _jsx("h4", { className: "text-lg font-semibold text-gray-900 mb-2", children: "Community Features Coming Soon" }), _jsx("p", { className: "text-gray-600 max-w-md mx-auto", children: "Join the discussion, share deals, and get verified advice from our expert community." })] }))] })] }));
}
//# sourceMappingURL=AdvancedAnalysis.js.map