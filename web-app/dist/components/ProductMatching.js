import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { ExternalLink, TrendingUp, TrendingDown, CheckCircle, AlertCircle, Clock, Star, X, Zap, Target, Award } from 'lucide-react';
export default function ProductMatching({ productId, sourceProduct, onClose, onMatchCountUpdate }) {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [targetProduct, setTargetProduct] = useState(sourceProduct || null);
    const [bestMatch, setBestMatch] = useState(null);
    const [algorithm, setAlgorithm] = useState('');
    const { token } = useAuth();
    // Handle click outside to close modal
    useEffect(() => {
        const handleClickOutside = (event) => {
            const target = event.target;
            if (target.classList.contains('modal-overlay')) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);
    useEffect(() => {
        if (sourceProduct) {
            setTargetProduct(sourceProduct);
        }
    }, [sourceProduct]);
    const fetchMatches = useCallback(async () => {
        setLoading(true);
        setError(null);
        console.log(`🔍 Fetching matches for product ID: ${productId}`);
        try {
            const headers = { 'Content-Type': 'application/json' };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            const response = await fetch(`/api/product-matching/global-product-matches?tracked_id=${productId}`, {
                headers
            });
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    console.log('✅ Match API Response:', data);
                    const payload = data.data || {};
                    const matchCount = typeof payload.matchCount === 'number' ? payload.matchCount : (Array.isArray(payload.matches) ? payload.matches.length : 0);
                    const matchReason = payload.cached ? 'Cached global match' : 'Serper global match';
                    const algorithmLabel = payload.cached ? 'global-cache' : 'global-serper';
                    if (!sourceProduct && payload.sourceTitle) {
                        setTargetProduct(prev => prev || {
                            id: productId,
                            title: payload.sourceTitle,
                            price: 0,
                            platform: '',
                            url: '',
                            imageUrl: '',
                            currency: 'USD'
                        });
                    }
                    const normalizedMatches = (payload.matches || []).map((match, index) => {
                        const price = Number(match.price || 0);
                        const targetPrice = sourceProduct?.price || 0;
                        const priceDifference = Math.abs(targetPrice - price);
                        const priceDifferencePercent = targetPrice ? ((targetPrice - price) / targetPrice) * 100 : 0;
                        return {
                            product: {
                                id: match.id || `${payload.productKey || productId}-${index}`,
                                title: match.title || 'Matched product',
                                price,
                                currency: match.currency || 'USD',
                                platform: match.platform || 'other',
                                url: match.url || '',
                                imageUrl: match.imageUrl || '',
                                stockStatus: 'unknown'
                            },
                            similarity: 0.7,
                            confidence: 'medium',
                            matchReason,
                            priceDifference,
                            priceDifferencePercent,
                            savings: targetPrice && price < targetPrice ? `$${(targetPrice - price).toFixed(2)} cheaper` : undefined
                        };
                    });
                    setMatches(normalizedMatches);
                    setAlgorithm(algorithmLabel);
                    setBestMatch(normalizedMatches.length ? {
                        product: normalizedMatches[0].product,
                        confidence: normalizedMatches[0].similarity,
                        priceDifference: normalizedMatches[0].priceDifference
                    } : null);
                    if (typeof matchCount === 'number') {
                        onMatchCountUpdate?.(productId, matchCount);
                    }
                }
                else {
                    console.error('Failed to fetch matches:', data.error);
                    setError(data.error || 'Failed to find matches. Please try again.');
                    setMatches([]);
                }
            }
            else {
                const errorText = response.statusText || 'Failed to connect to server';
                console.error('Failed to fetch matches:', errorText);
                setError(`Failed to find matches: ${errorText}`);
                setMatches([]);
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
            console.error('Error fetching matches:', error);
            setError(`Failed to find matches: ${errorMessage}`);
            setMatches([]);
        }
        finally {
            setLoading(false);
        }
    }, [token, productId, sourceProduct, onMatchCountUpdate]);
    useEffect(() => {
        fetchMatches();
    }, [fetchMatches]);
    const getConfidenceIcon = useCallback((confidence) => {
        switch (confidence) {
            case 'high':
                return _jsx(Award, { className: "w-4 h-4 text-green-500" });
            case 'medium':
                return _jsx(Target, { className: "w-4 h-4 text-yellow-500" });
            case 'low':
                return _jsx(Clock, { className: "w-4 h-4 text-gray-400" });
            default:
                return _jsx(Clock, { className: "w-4 h-4 text-gray-400" });
        }
    }, []);
    const getConfidenceColor = useCallback((confidence) => {
        switch (confidence) {
            case 'high':
                return 'text-green-600 bg-green-50 border-green-200';
            case 'medium':
                return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'low':
                return 'text-gray-600 bg-gray-50 border-gray-200';
            default:
                return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    }, []);
    const getConfidenceText = useCallback((confidence, similarity) => {
        const percentage = Math.round(similarity * 100);
        switch (confidence) {
            case 'high':
                return `${percentage}% Match`;
            case 'medium':
                return `${percentage}% Similar`;
            case 'low':
                return `${percentage}% Related`;
            default:
                return `${percentage}% Match`;
        }
    }, []);
    const getPlatformIcon = useCallback((platform) => {
        switch (platform.toLowerCase()) {
            case 'amazon':
                return '🛒';
            case 'aliexpress':
                return '📦';
            case 'ebay':
                return '🏪';
            case 'walmart':
                return '🛍️';
            case 'target':
                return '🎯';
            case 'bestbuy':
                return '💻';
            case 'shein':
                return '👗';
            default:
                return '🛒';
        }
    }, []);
    const getStockStatusIcon = (status) => {
        switch (status) {
            case 'in_stock':
                return _jsx(CheckCircle, { className: "w-3 h-3 text-green-500" });
            case 'out_of_stock':
                return _jsx(AlertCircle, { className: "w-3 h-3 text-red-500" });
            default:
                return _jsx(Clock, { className: "w-3 h-3 text-gray-400" });
        }
    };
    const getSavingsIcon = useCallback((priceDifference, targetPrice) => {
        const savings = priceDifference / targetPrice * 100;
        if (savings > 50)
            return _jsx(Zap, { className: "w-4 h-4 text-green-500" });
        if (savings > 20)
            return _jsx(TrendingDown, { className: "w-4 h-4 text-green-400" });
        return _jsx(TrendingUp, { className: "w-4 h-4 text-red-400" });
    }, []);
    // Memoize sorted matches to prevent unnecessary re-renders
    const sortedMatches = useMemo(() => {
        return [...matches].sort((a, b) => {
            // Sort by confidence first, then by similarity
            const confidenceOrder = { high: 3, medium: 2, low: 1 };
            const aConf = confidenceOrder[a.confidence] || 0;
            const bConf = confidenceOrder[b.confidence] || 0;
            if (aConf !== bConf)
                return bConf - aConf;
            return b.similarity - a.similarity;
        });
    }, [matches]);
    if (loading || error) {
        return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-overlay", children: _jsxs("div", { className: "bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-y-auto", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: error ? 'Error Finding Matches' : 'Finding Product Matches' }), _jsx("button", { onClick: onClose, className: "text-gray-400 hover:text-gray-600", children: _jsx(X, { className: "w-5 h-5" }) })] }), _jsx("div", { className: "text-center py-8", children: error ? (_jsxs(_Fragment, { children: [_jsx(AlertCircle, { className: "mx-auto h-12 w-12 text-red-500" }), _jsx("h3", { className: "mt-2 text-sm font-medium text-gray-900", children: "Failed to find matches" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: error }), _jsx("button", { onClick: () => {
                                        setError(null);
                                        fetchMatches();
                                    }, className: "mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors", children: "Try Again" })] })) : (_jsxs(_Fragment, { children: [_jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" }), _jsx("p", { className: "mt-2 text-gray-600", children: "Finding similar products across platforms..." }), _jsx("p", { className: "mt-1 text-xs text-gray-500", children: "This may take a few seconds" })] })) })] }) }));
    }
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-overlay", children: _jsxs("div", { className: "bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[85vh] overflow-y-auto", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Product Matches" }), algorithm === 'global-serper' && (_jsxs("span", { className: "bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1", children: [_jsx(Zap, { className: "w-3 h-3" }), "Live Serper"] })), algorithm === 'global-cache' && (_jsxs("span", { className: "bg-green-100 text-green-700 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1", children: [_jsx(CheckCircle, { className: "w-3 h-3" }), "Cached Result"] }))] }), _jsx("button", { onClick: onClose, className: "text-gray-400 hover:text-gray-600", children: _jsx(X, { className: "w-5 h-5" }) })] }), targetProduct && (_jsxs("div", { className: "mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200", children: [_jsxs("h4", { className: "font-medium text-blue-900 mb-2 flex items-center gap-2", children: [_jsx(Target, { className: "w-4 h-4" }), "Source Product"] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "text-lg", children: getPlatformIcon(targetProduct.platform) }), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-sm font-medium text-blue-800", children: targetProduct.title }), _jsx("p", { className: "text-xs text-blue-600 capitalize", children: targetProduct.platform })] }), _jsxs("div", { className: "text-right", children: [typeof targetProduct.price === 'number' && (_jsxs("p", { className: "text-lg font-bold text-blue-900", children: ["$", targetProduct.price.toFixed(2)] })), targetProduct.currency && (_jsx("p", { className: "text-xs text-blue-600", children: targetProduct.currency }))] })] })] })), bestMatch && (_jsxs("div", { className: "mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200", children: [_jsxs("h4", { className: "font-medium text-green-900 mb-2 flex items-center gap-2", children: [_jsx(Award, { className: "w-4 h-4" }), "Best Match Found"] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "text-lg", children: getPlatformIcon(bestMatch.product?.platform) }), _jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-green-800 capitalize", children: bestMatch.product?.platform }), _jsxs("p", { className: "text-xs text-green-600", children: [(bestMatch.confidence * 100).toFixed(1), "% confidence match"] })] })] }), _jsxs("div", { className: "text-right", children: [_jsxs("p", { className: "text-lg font-bold text-green-900", children: ["$", bestMatch.product?.price.toFixed(2)] }), _jsxs("p", { className: "text-xs text-green-600", children: ["Save $", bestMatch.priceDifference.toFixed(2)] })] })] })] })), matches.length === 0 ? (_jsxs("div", { className: "text-center py-8", children: [_jsx(Star, { className: "mx-auto h-12 w-12 text-gray-400" }), _jsx("h3", { className: "mt-2 text-sm font-medium text-gray-900", children: "No strong matches found yet" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "Try widening the search across supported platforms." }), _jsxs("div", { className: "mt-4 text-xs text-gray-400 space-y-1", children: [_jsx("p", { children: "\uD83D\uDCA1 To improve matching:" }), _jsx("p", { children: "\u2022 Track more products from different platforms" }), _jsx("p", { children: "\u2022 Ensure product titles include brand and model" }), _jsx("p", { children: "\u2022 Try products with common names (iPhone, AirPods, etc.)" })] }), _jsx("button", { onClick: () => {
                                setError(null);
                                fetchMatches();
                            }, className: "mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors", children: "Refresh Matches" })] })) : (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("h4", { className: "font-medium text-gray-900", children: ["Found ", matches.length, " similar products across platforms"] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: "flex items-center gap-2 text-xs text-gray-500", children: [_jsx(Award, { className: "w-3 h-3 text-green-500" }), _jsx("span", { children: "High confidence" }), _jsx(Target, { className: "w-3 h-3 text-yellow-500" }), _jsx("span", { children: "Medium confidence" }), _jsx(Clock, { className: "w-3 h-3 text-gray-400" }), _jsx("span", { children: "Low confidence" })] }), _jsxs("button", { onClick: () => {
                                                setError(null);
                                                fetchMatches();
                                            }, className: "px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1", children: [_jsx(Zap, { className: "w-3 h-3" }), "Refresh"] })] })] }), _jsx("div", { className: "grid gap-4", children: sortedMatches.map((match, index) => (_jsx("div", { className: "border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:border-blue-300", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx("span", { className: "text-lg", children: getPlatformIcon(match.product.platform) }), _jsx("span", { className: "text-xs font-medium text-gray-500 uppercase tracking-wide", children: match.product.platform }), _jsxs("div", { className: `flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${getConfidenceColor(match.confidence)}`, children: [getConfidenceIcon(match.confidence), _jsx("span", { children: getConfidenceText(match.confidence, match.similarity) })] }), match.confidence === 'high' && match.priceDifference > (targetProduct?.price || 0) * 0.2 && (_jsx("span", { className: "bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full", children: "Great Deal" }))] }), _jsx("h3", { className: "text-sm font-semibold text-gray-900 mb-1 line-clamp-2", children: match.product.title }), _jsx("p", { className: "text-xs text-gray-600 mb-2", children: match.matchReason }), _jsxs("div", { className: "flex items-center gap-4 text-xs", children: [_jsxs("div", { className: "flex items-center gap-1", children: [getStockStatusIcon(match.product.stockStatus), _jsx("span", { className: "text-gray-500", children: match.product.stockStatus === 'in_stock' ? 'In Stock' :
                                                                        match.product.stockStatus === 'out_of_stock' ? 'Out of Stock' : 'Stock Unknown' })] }), targetProduct && (_jsxs("div", { className: "flex items-center gap-1", children: [getSavingsIcon(match.priceDifference, targetProduct.price || 1), _jsx("span", { className: `font-medium ${match.product.price < targetProduct.price ? 'text-green-600' : 'text-red-600'}`, children: match.savings || `${match.priceDifferencePercent.toFixed(1)}% difference` })] }))] }), match.product.discountInfo && (_jsx("div", { className: "mt-2 p-2 bg-green-50 border border-green-200 rounded-md", children: _jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Star, { className: "w-3 h-3 text-green-600" }), _jsx("span", { className: "text-xs font-medium text-green-700", children: match.product.discountInfo })] }) }))] }), _jsxs("div", { className: "flex flex-col items-end gap-2 ml-4", children: [_jsxs("div", { className: "text-right", children: [_jsxs("p", { className: "text-lg font-bold text-gray-900", children: ["$", match.product.price.toFixed(2)] }), targetProduct && match.product.price < targetProduct.price && (_jsxs("p", { className: "text-xs text-green-600 font-medium", children: ["Save $", (targetProduct.price - match.product.price).toFixed(2)] }))] }), _jsxs("a", { href: match.product.url, target: "_blank", rel: "noopener noreferrer", className: "flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors font-medium", children: [_jsx(ExternalLink, { className: "w-3 h-3" }), "View Deal"] })] })] }) }, match.product.id))) }), _jsx("div", { className: "mt-4 p-3 bg-gray-50 rounded-lg text-center", children: _jsxs("p", { className: "text-xs text-gray-500", children: ["Powered by enhanced product matching algorithm \u2022 ", sortedMatches.length, " results across ", new Set(sortedMatches.map(m => m.product.platform)).size, " platforms"] }) })] }))] }) }));
}
//# sourceMappingURL=ProductMatching.js.map