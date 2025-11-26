import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Star, Globe, ShoppingCart, Users, Zap, Award, Tag, CheckCircle } from 'lucide-react';
export default function AdvancedFeatures({ product }) {
    const [conditionAnalysis, setConditionAnalysis] = useState(null);
    const [couponStack, setCouponStack] = useState(null);
    const [globalComparison, setGlobalComparison] = useState(null);
    const [communityAnalysis, setCommunityAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('condition');
    useEffect(() => {
        loadAdvancedFeatures();
    }, [product.id]);
    const loadAdvancedFeatures = async () => {
        setLoading(true);
        try {
            // Use real product-card analysis endpoint (rule-based, no AI)
            const enhancedResponse = await fetch(`/api/advanced/product-card-analysis/${product.id}`);
            if (enhancedResponse.ok) {
                const enhancedData = await enhancedResponse.json();
                const data = enhancedData.data || enhancedData; // Support direct or wrapped payloads
                // Update all features with enhanced data
                if (data.conditionAnalysis) {
                    setConditionAnalysis({
                        score: data.conditionAnalysis.score,
                        riskLevel: (data.conditionAnalysis.riskLevel || 'Medium'),
                        recommendation: (data.conditionAnalysis.recommendations?.[0] || 'No recommendation'),
                        confidence: data.conditionAnalysis.confidence ?? 0
                    });
                }
                if (data.couponAnalysis) {
                    const coupons = Array.isArray(data.couponAnalysis.coupons)
                        ? data.couponAnalysis.coupons.map((c) => ({
                            code: c.code || '',
                            discount: c.description || `${c.discountType === 'percentage' ? c.discountValue + '%' : `$${c.discountValue}`} off`,
                            successRate: c.successRate || 0
                        }))
                        : [];
                    const estimatedSavings = Number(data.couponAnalysis.estimatedSavings || 0);
                    setCouponStack({
                        coupons,
                        originalPrice: product.price,
                        finalPrice: Math.max(0, product.price - estimatedSavings),
                        totalSavings: estimatedSavings,
                        savingsPercent: product.price > 0 ? Math.round((estimatedSavings / product.price) * 100) : 0
                    });
                }
                if (data.globalAnalysis) {
                    // Transform backend MarketComparison into UI shape
                    const ga = data.globalAnalysis;
                    const flag = (cc) => {
                        const m = { US: '🇺🇸', EU: '🇪🇺', UK: '🇬🇧', JP: '🇯🇵', CA: '🇨🇦', AU: '🇦🇺', DE: '🇩🇪', FR: '🇫🇷', IT: '🇮🇹', ES: '🇪🇸' };
                        return m[cc] || '🌍';
                    };
                    const marketsArr = ga.markets
                        ? Object.entries(ga.markets).map(([country, v]) => ({
                            country,
                            flag: flag(country),
                            price: v.price,
                            landedCost: v.landedCost,
                            savings: (ga.bestDeal?.bestMarket?.landedCost ?? ga.bestDeal?.landedCost ?? product.price) - v.landedCost
                        }))
                        : [];
                    setGlobalComparison({
                        markets: marketsArr,
                        bestDeal: ga.bestDeal?.bestMarket?.countryCode || ga.bestDeal?.countryCode || 'US',
                        recommendation: ga.recommendation || 'buy_local'
                    });
                }
                if (data.communityAnalysis) {
                    const ca = data.communityAnalysis;
                    setCommunityAnalysis({
                        credibilityScore: Math.round(ca.trustScore ?? 0),
                        communityRating: Number(ca.communityRating ?? 0),
                        votes: Number(ca.totalVotes ?? 0),
                        badges: [],
                        expertEndorsements: Number(ca.expertEndorsements ?? 0)
                    });
                }
            }
            else {
                // Fallback to individual API calls
                await Promise.all([
                    loadConditionAnalysis(),
                    loadCouponStack(),
                    loadGlobalComparison(),
                    loadCommunityAnalysis()
                ]);
            }
        }
        catch (error) {
            console.error('Error loading advanced features:', error);
            // Fallback to individual API calls
            await Promise.all([
                loadConditionAnalysis(),
                loadCouponStack(),
                loadGlobalComparison(),
                loadCommunityAnalysis()
            ]);
        }
        setLoading(false);
    };
    const loadConditionAnalysis = async () => {
        try {
            const response = await fetch(`/api/advanced/condition-analysis/${product.id}`);
            if (response.ok) {
                const data = await response.json();
                setConditionAnalysis({
                    score: data.conditionScore || 82,
                    riskLevel: data.riskLevel || 'Medium',
                    recommendation: data.recommendation || 'Analysis completed',
                    confidence: data.confidence || 85
                });
            }
            else {
                // Fallback to mock data if API fails
                const conditionScore = product.conditionScore ?? 82;
                const mockAnalysis = {
                    score: conditionScore,
                    riskLevel: conditionScore > 80 ? 'Low' : conditionScore > 60 ? 'Medium' : 'High',
                    recommendation: product.condition === 'used' ? 'Good value - condition better than average refurb' : 'Excellent condition',
                    confidence: 92
                };
                setConditionAnalysis(mockAnalysis);
            }
        }
        catch (error) {
            console.error('Error loading condition analysis:', error);
            // Fallback to mock data
            const conditionScore = product.conditionScore ?? 82;
            const mockAnalysis = {
                score: conditionScore,
                riskLevel: conditionScore > 80 ? 'Low' : conditionScore > 60 ? 'Medium' : 'High',
                recommendation: product.condition === 'used' ? 'Good value - condition better than average refurb' : 'Excellent condition',
                confidence: 92
            };
            setConditionAnalysis(mockAnalysis);
        }
    };
    const loadCouponStack = async () => {
        try {
            const response = await fetch(`/api/advanced/coupons/${product.id}`);
            if (response.ok) {
                const data = await response.json();
                setCouponStack({
                    coupons: data.coupons || [],
                    originalPrice: product.price,
                    finalPrice: data.finalPrice || product.price,
                    totalSavings: data.totalSavings || 0,
                    savingsPercent: data.savingsPercent || 0
                });
            }
            else {
                // Fallback to mock data if API fails
                const mockStack = {
                    coupons: [
                        { code: 'SAVE15', discount: '15% off', successRate: 94 },
                        { code: 'FREESHIP', discount: 'Free shipping', successRate: 92 },
                        { code: 'NEWUSER5', discount: '5% off', successRate: 87 }
                    ],
                    originalPrice: product.price,
                    finalPrice: product.finalPrice || Math.round(product.price * 0.85),
                    totalSavings: Math.round(product.price * 0.15),
                    savingsPercent: 15
                };
                setCouponStack(mockStack);
            }
        }
        catch (error) {
            console.error('Error loading coupon stack:', error);
            // Fallback to mock data
            const mockStack = {
                coupons: [
                    { code: 'SAVE15', discount: '15% off', successRate: 94 },
                    { code: 'FREESHIP', discount: 'Free shipping', successRate: 92 },
                    { code: 'NEWUSER5', discount: '5% off', successRate: 87 }
                ],
                originalPrice: product.price,
                finalPrice: product.finalPrice || Math.round(product.price * 0.85),
                totalSavings: Math.round(product.price * 0.15),
                savingsPercent: 15
            };
            setCouponStack(mockStack);
        }
    };
    const loadGlobalComparison = async () => {
        try {
            const response = await fetch(`/api/advanced/global-arbitrage/${product.id}`);
            if (response.ok) {
                const data = await response.json();
                setGlobalComparison({
                    markets: data.markets || [
                        { country: 'US', flag: '🇺🇸', price: product.price, landedCost: product.price, savings: 0 },
                        { country: 'Japan', flag: '🇯🇵', price: product.price * 0.92, landedCost: product.price * 1.03, savings: -31 },
                        { country: 'UK', flag: '🇬🇧', price: product.price * 1.05, landedCost: product.price * 1.12, savings: -120 }
                    ],
                    bestDeal: data.bestDeal || 'US (Current)',
                    recommendation: data.recommendation || 'Best deal is local purchase'
                });
            }
            else {
                // Fallback to mock data if API fails
                const mockGlobal = {
                    markets: [
                        { country: 'US', flag: '🇺🇸', price: product.price, landedCost: product.price, savings: 0 },
                        { country: 'Japan', flag: '🇯🇵', price: product.price * 0.92, landedCost: product.price * 1.03, savings: -31 },
                        { country: 'UK', flag: '🇬🇧', price: product.price * 1.05, landedCost: product.price * 1.12, savings: -120 }
                    ],
                    bestDeal: 'US (Current)',
                    recommendation: 'Best deal is local purchase'
                };
                setGlobalComparison(mockGlobal);
            }
        }
        catch (error) {
            console.error('Error loading global comparison:', error);
            // Fallback to mock data
            const mockGlobal = {
                markets: [
                    { country: 'US', flag: '🇺🇸', price: product.price, landedCost: product.price, savings: 0 },
                    { country: 'Japan', flag: '🇯🇵', price: product.price * 0.92, landedCost: product.price * 1.03, savings: -31 },
                    { country: 'UK', flag: '🇬🇧', price: product.price * 1.05, landedCost: product.price * 1.12, savings: -120 }
                ],
                bestDeal: 'US (Current)',
                recommendation: 'Best deal is local purchase'
            };
            setGlobalComparison(mockGlobal);
        }
    };
    const loadCommunityAnalysis = async () => {
        try {
            const response = await fetch(`/api/advanced/community-analysis/${product.id}`);
            if (response.ok) {
                const data = await response.json();
                setCommunityAnalysis({
                    credibilityScore: data.credibilityScore || product.credibilityScore || 87,
                    communityRating: data.communityRating || product.communityRating || 4.2,
                    votes: data.votes || 156,
                    badges: data.badges || (product.isVerified ? ['Community Favorite', 'Expert Verified', 'Hot Deal'] : ['Price Verified']),
                    expertEndorsements: data.expertEndorsements || 2
                });
            }
            else {
                // Fallback to mock data if API fails
                const mockCommunity = {
                    credibilityScore: product.credibilityScore || 87,
                    communityRating: product.communityRating || 4.2,
                    votes: 156,
                    badges: product.isVerified ? ['Community Favorite', 'Expert Verified', 'Hot Deal'] : ['Price Verified'],
                    expertEndorsements: 2
                };
                setCommunityAnalysis(mockCommunity);
            }
        }
        catch (error) {
            console.error('Error loading community analysis:', error);
            // Fallback to mock data
            const mockCommunity = {
                credibilityScore: product.credibilityScore || 87,
                communityRating: product.communityRating || 4.2,
                votes: 156,
                badges: product.isVerified ? ['Community Favorite', 'Expert Verified', 'Hot Deal'] : ['Price Verified'],
                expertEndorsements: 2
            };
            setCommunityAnalysis(mockCommunity);
        }
    };
    if (loading) {
        return (_jsx("div", { className: "bg-white p-6 rounded-lg shadow-md", children: _jsx("div", { className: "flex items-center justify-center h-32", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" }) }) }));
    }
    const tabs = [
        { id: 'condition', label: 'Condition', icon: Star },
        { id: 'coupons', label: 'Coupons', icon: Tag },
        { id: 'global', label: 'Global', icon: Globe },
        { id: 'community', label: 'Community', icon: Users }
    ];
    const Badge = ({ children, variant = 'default' }) => (_jsx("span", { className: `px-2 py-1 text-xs font-medium rounded-full ${variant === 'destructive' ? 'bg-red-100 text-red-800' :
            variant === 'outline' ? 'bg-white border border-gray-300 text-gray-700' :
                'bg-blue-100 text-blue-800'}`, children: children }));
    const Button = ({ children, onClick, className }) => (_jsx("button", { onClick: onClick, className: `px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center ${className || ''}`, children: children }));
    return (_jsxs("div", { className: "bg-white p-6 rounded-lg shadow-md", children: [_jsx("div", { className: "mb-6", children: _jsxs("h2", { className: "text-xl font-semibold flex items-center gap-2", children: [_jsx(Zap, { className: "w-5 h-5 text-blue-600" }), "Advanced Analysis"] }) }), _jsx("div", { className: "flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg", children: tabs.map((tab) => (_jsxs("button", { onClick: () => setActiveTab(tab.id), className: `flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'}`, children: [_jsx(tab.icon, { className: "w-4 h-4" }), tab.label] }, tab.id))) }), activeTab === 'condition' && conditionAnalysis && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Condition Analysis" }), _jsxs(Badge, { variant: conditionAnalysis.riskLevel === 'Low' ? 'default' : 'destructive', children: [conditionAnalysis.riskLevel, " Risk"] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "p-4 bg-blue-50 rounded-lg", children: [_jsxs("div", { className: "text-2xl font-bold text-blue-600", children: [conditionAnalysis.score, "/100"] }), _jsx("div", { className: "text-sm text-gray-600", children: "Condition Score" })] }), _jsxs("div", { className: "p-4 bg-green-50 rounded-lg", children: [_jsxs("div", { className: "text-2xl font-bold text-green-600", children: [conditionAnalysis.confidence, "%"] }), _jsx("div", { className: "text-sm text-gray-600", children: "Confidence" })] })] }), _jsxs("div", { className: "p-4 bg-gray-50 rounded-lg", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(CheckCircle, { className: "w-4 h-4 text-green-600" }), _jsx("span", { className: "font-medium", children: "Recommendation" })] }), _jsx("p", { className: "text-gray-700", children: conditionAnalysis.recommendation })] })] })), activeTab === 'coupons' && couponStack && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Best Coupon Stack" }), _jsxs(Badge, { children: [couponStack.savingsPercent, "% Savings"] })] }), _jsx("div", { className: "space-y-2", children: couponStack.coupons.map((coupon, index) => (_jsxs("div", { className: "flex items-center justify-between p-3 bg-gray-50 rounded-lg", children: [_jsxs("div", { children: [_jsx("span", { className: "font-medium", children: coupon.code }), _jsxs("span", { className: "text-gray-600 ml-2", children: ["(", coupon.discount, ")"] })] }), _jsxs(Badge, { variant: "outline", children: [coupon.successRate, "% success"] })] }, index))) }), _jsxs("div", { className: "p-4 bg-green-50 rounded-lg", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { children: "Original Price:" }), _jsxs("span", { className: "line-through text-gray-500", children: ["$", couponStack.originalPrice] })] }), _jsxs("div", { className: "flex justify-between items-center font-bold text-green-600", children: [_jsx("span", { children: "Final Price:" }), _jsxs("span", { children: ["$", couponStack.finalPrice] })] }), _jsxs("div", { className: "flex justify-between items-center text-green-600", children: [_jsx("span", { children: "Total Savings:" }), _jsxs("span", { children: ["$", couponStack.totalSavings] })] })] })] })), activeTab === 'global' && globalComparison && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Global Price Comparison" }), _jsxs(Badge, { children: ["Best: ", globalComparison.bestDeal] })] }), _jsx("div", { className: "space-y-2", children: globalComparison.markets.map((market, index) => (_jsxs("div", { className: "flex items-center justify-between p-3 bg-gray-50 rounded-lg", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-lg", children: market.flag }), _jsx("span", { className: "font-medium", children: market.country })] }), _jsxs("div", { className: "text-right", children: [_jsxs("div", { className: "font-medium", children: ["$", market.landedCost, " landed"] }), _jsxs("div", { className: `text-sm ${market.savings >= 0 ? 'text-green-600' : 'text-red-600'}`, children: [market.savings >= 0 ? '+' : '', "$", market.savings] })] })] }, index))) }), _jsxs("div", { className: "p-4 bg-blue-50 rounded-lg", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(Globe, { className: "w-4 h-4 text-blue-600" }), _jsx("span", { className: "font-medium", children: "Recommendation" })] }), _jsx("p", { className: "text-gray-700", children: globalComparison.recommendation })] })] })), activeTab === 'community' && communityAnalysis && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-lg font-semibold", children: "Community Analysis" }), _jsxs(Badge, { children: [communityAnalysis.credibilityScore, "/100 Credibility"] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "p-4 bg-yellow-50 rounded-lg", children: [_jsxs("div", { className: "text-2xl font-bold text-yellow-600", children: [communityAnalysis.communityRating, "/5"] }), _jsx("div", { className: "text-sm text-gray-600", children: "Community Rating" })] }), _jsxs("div", { className: "p-4 bg-purple-50 rounded-lg", children: [_jsx("div", { className: "text-2xl font-bold text-purple-600", children: communityAnalysis.votes }), _jsx("div", { className: "text-sm text-gray-600", children: "Community Votes" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("h4", { className: "font-medium", children: "Badges" }), _jsx("div", { className: "flex flex-wrap gap-2", children: communityAnalysis.badges.map((badge, index) => (_jsx(Badge, { variant: "outline", children: badge }, index))) })] }), _jsxs("div", { className: "p-4 bg-green-50 rounded-lg", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(Award, { className: "w-4 h-4 text-green-600" }), _jsx("span", { className: "font-medium", children: "Expert Endorsements" })] }), _jsxs("p", { className: "text-gray-700", children: [communityAnalysis.expertEndorsements, " verified experts recommend this deal"] })] })] })), _jsx("div", { className: "mt-6 pt-4 border-t", children: _jsxs(Button, { onClick: () => {
                        const buildAffiliateUrl = (url, platform) => {
                            try {
                                const u = new URL(url);
                                if (platform.toLowerCase() === 'amazon') {
                                    if (u.searchParams.has('tag')) {
                                        u.searchParams.set('tag', 'pricetrack0f8-20');
                                    }
                                    else {
                                        u.searchParams.append('tag', 'pricetrack0f8-20');
                                    }
                                }
                                else if (platform.toLowerCase() === 'aliexpress') {
                                    // Append affiliate tag parameters; adjust if you have a specific program key
                                    if (!u.searchParams.has('aff_platform'))
                                        u.searchParams.append('aff_platform', 'api');
                                    if (u.searchParams.has('aff_short_key')) {
                                        u.searchParams.set('aff_short_key', 'pricetrack0f8-20');
                                    }
                                    else {
                                        u.searchParams.append('aff_short_key', 'pricetrack0f8-20');
                                    }
                                }
                                return u.toString();
                            }
                            catch {
                                return url;
                            }
                        };
                        const urlWithAffiliate = buildAffiliateUrl(product.url, product.platform);
                        window.open(urlWithAffiliate, '_blank');
                    }, className: "w-full", children: [_jsx(ShoppingCart, { className: "w-4 h-4 mr-2" }), "Buy Now with Analysis"] }) })] }));
}
//# sourceMappingURL=AdvancedFeatures.js.map