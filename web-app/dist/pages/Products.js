import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../components/AuthContext';
import ProductMatching from '../components/ProductMatching';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Trash2, TrendingDown, TrendingUp, AlertCircle, CheckCircle, Clock, Package, DollarSign, Star, Eye, EyeOff, X, Link, Users, Download, Search, Filter, SortAsc, SortDesc, ChevronDown, ChevronUp } from 'lucide-react';
import { getSupabaseClient } from '../lib/supabaseClient';
// Advanced Filter Component
function AdvancedFilters({ filters, filterOptions, onFilterChange, onClearFilters }) {
    const [showFilters, setShowFilters] = useState(false);
    return (_jsxs("div", { className: "bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Filter, { className: "w-5 h-5 text-gray-600" }), _jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Filters & Sorting" })] }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsxs("button", { onClick: () => setShowFilters(!showFilters), className: "flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900", children: [showFilters ? _jsx(ChevronUp, { className: "w-4 h-4" }) : _jsx(ChevronDown, { className: "w-4 h-4" }), _jsxs("span", { children: [showFilters ? 'Hide' : 'Show', " Filters"] })] }), _jsx("button", { onClick: onClearFilters, className: "text-sm text-red-600 hover:text-red-700", children: "Clear All" })] })] }), filterOptions && (_jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg", children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold text-gray-900", children: filterOptions.totalProducts }), _jsx("div", { className: "text-sm text-gray-600", children: "Total Products" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold text-green-600", children: filterOptions.priceDropStats.productsWithPriceDrops }), _jsx("div", { className: "text-sm text-gray-600", children: "Price Drops" })] }), _jsxs("div", { className: "text-center", children: [_jsxs("div", { className: "text-2xl font-bold text-blue-600", children: ["$", filterOptions.priceRange.min.toFixed(0), " - $", filterOptions.priceRange.max.toFixed(0)] }), _jsx("div", { className: "text-sm text-gray-600", children: "Price Range" })] }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-2xl font-bold text-purple-600", children: filterOptions.platforms.length }), _jsx("div", { className: "text-sm text-gray-600", children: "Platforms" })] })] })), showFilters && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Search Products" }), _jsxs("div", { className: "relative", children: [_jsx(Search, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" }), _jsx("input", { type: "text", placeholder: "Search by title, platform...", value: filters.search, onChange: (e) => onFilterChange('search', e.target.value), className: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Platform" }), _jsxs("select", { value: filters.platform, onChange: (e) => onFilterChange('platform', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500", children: [_jsx("option", { value: "", children: "All Platforms" }), filterOptions?.platforms.map(platform => (_jsx("option", { value: platform, children: platform.charAt(0).toUpperCase() + platform.slice(1) }, platform)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Min Price" }), _jsx("input", { type: "number", placeholder: "Min", value: filters.minPrice, onChange: (e) => onFilterChange('minPrice', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Max Price" }), _jsx("input", { type: "number", placeholder: "Max", value: filters.maxPrice, onChange: (e) => onFilterChange('maxPrice', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Stock Status" }), _jsxs("select", { value: filters.stockStatus, onChange: (e) => onFilterChange('stockStatus', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500", children: [_jsx("option", { value: "", children: "All Status" }), _jsx("option", { value: "in_stock", children: "In Stock" }), _jsx("option", { value: "out_of_stock", children: "Out of Stock" }), _jsx("option", { value: "unknown", children: "Unknown" })] })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "checkbox", id: "hasPriceDrop", checked: filters.hasPriceDrop, onChange: (e) => onFilterChange('hasPriceDrop', e.target.checked), className: "w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" }), _jsx("label", { htmlFor: "hasPriceDrop", className: "text-sm font-medium text-gray-700", children: "Only Price Drops" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Sort By" }), _jsxs("select", { value: filters.sortBy, onChange: (e) => onFilterChange('sortBy', e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500", children: [_jsx("option", { value: "createdAt", children: "Date Added" }), _jsx("option", { value: "price", children: "Price" }), _jsx("option", { value: "priceDrop", children: "Price Drop" }), _jsx("option", { value: "priceDropPercent", children: "Price Drop %" }), _jsx("option", { value: "title", children: "Title" }), _jsx("option", { value: "platform", children: "Platform" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Order" }), _jsxs("div", { className: "flex space-x-2", children: [_jsxs("button", { onClick: () => onFilterChange('sortOrder', 'asc'), className: `flex items-center space-x-1 px-3 py-2 rounded-lg border ${filters.sortOrder === 'asc'
                                                    ? 'bg-blue-500 text-white border-blue-500'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`, children: [_jsx(SortAsc, { className: "w-4 h-4" }), _jsx("span", { children: "Asc" })] }), _jsxs("button", { onClick: () => onFilterChange('sortOrder', 'desc'), className: `flex items-center space-x-1 px-3 py-2 rounded-lg border ${filters.sortOrder === 'desc'
                                                    ? 'bg-blue-500 text-white border-blue-500'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`, children: [_jsx(SortDesc, { className: "w-4 h-4" }), _jsx("span", { children: "Desc" })] })] })] })] })] }))] }));
}
// Product Price History Component
function ProductPriceHistory({ productId }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const { token } = useAuth();
    useEffect(() => {
        async function fetchHistory() {
            setLoading(true);
            try {
                const res = await fetch(`/api/products/${productId}/history`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) {
                    setHistory(data.data);
                }
            }
            catch (error) {
                console.error('Error fetching price history:', error);
            }
            finally {
                setLoading(false);
            }
        }
        fetchHistory();
    }, [productId, token]);
    if (loading)
        return _jsx("div", { className: "text-center py-8", children: "Loading price history..." });
    if (!history.length)
        return _jsx("div", { className: "text-center py-8 text-gray-500", children: "No price history available." });
    return (_jsx("div", { className: "space-y-4", children: _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: history.map((entry) => (_jsx("div", { className: "bg-gray-50 p-4 rounded-lg", children: _jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm text-gray-600", children: new Date(entry.timestamp).toLocaleDateString() }), _jsxs("span", { className: "text-lg font-semibold text-gray-900", children: [entry.currency, entry.price.toFixed(2)] })] }) }, entry.id))) }) }));
}
// Product Card Component matching Figma design
const MATCH_STOP_WORDS = new Set([
    'new',
    'brand-new',
    'sealed',
    'refurbished',
    'renewed',
    'usb-c',
    'usbc',
    'lightning',
    'with',
    'case',
    'official',
    'genuine',
    'free',
    'shipping',
    'limited',
    'edition',
    'colors',
    'colour',
    'color',
    'bundle',
    'pack',
    'promo',
    'deal',
    'offer',
    '2024',
    '2025',
    'storage',
    'sizes',
    'size',
    'set'
]);
function generateProductKey(title) {
    if (!title)
        return '';
    let normalized = title.toLowerCase();
    normalized = normalized.replace(/[^a-z0-9\s-]/g, ' ');
    normalized = normalized.replace(/\b(\d+)(gb|tb|g|m|mb)\b/g, ' ');
    normalized = normalized.replace(/\b(64|128|256|512)\s?(gb)\b/g, ' ');
    normalized = normalized.replace(/\b\d{4}\b/g, (year) => (year === '2024' || year === '2025' ? ' ' : year));
    const tokens = normalized
        .split(/\s+/)
        .filter(Boolean)
        .filter(token => !MATCH_STOP_WORDS.has(token));
    return tokens.join(' ').trim();
}
const ProductCard = ({ product, onDelete, onViewHistory, onViewMatches, highlighted, globalMatchCount = 0 }) => {
    const [showAllHistory, setShowAllHistory] = useState(false);
    const navigate = useNavigate();
    // Debug highlight prop
    useEffect(() => {
        if (highlighted) {
            // Removed debug log
        }
    }, [highlighted, product.id, product.title]);
    const getPriceChange = () => {
        // Use the new price drop data from backend if available
        if (product.hasPriceDrop && product.priceDrop && product.previousPrice) {
            return {
                change: -product.priceDrop, // Negative because it's a drop
                changePercent: -(product.priceDropPercent || 0),
                isPositive: false
            };
        }
        // Fallback to old calculation if new data not available
        if (!product.priceHistory || product.priceHistory.length < 2)
            return null;
        const sortedHistory = [...product.priceHistory].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        const latest = sortedHistory[sortedHistory.length - 1];
        const previous = sortedHistory[sortedHistory.length - 2];
        if (!latest || !previous)
            return null;
        const change = latest.price - previous.price;
        const changePercent = (change / previous.price) * 100;
        return {
            change,
            changePercent,
            isPositive: change > 0
        };
    };
    const priceChange = getPriceChange();
    const displayHistory = showAllHistory
        ? product.priceHistory?.slice(-10)
        : product.priceHistory?.slice(-3);
    const getPlatformIcon = (platform) => {
        switch (platform.toLowerCase()) {
            case 'amazon':
                return '🛒';
            case 'aliexpress':
                return '📦';
            case 'ebay':
                return '🏪';
            case 'walmart':
                return '🛍️';
            case 'shein':
                return '👗';
            default:
                return '🛒';
        }
    };
    const getStockStatusIcon = (status) => {
        switch (status) {
            case 'in_stock':
                return _jsx(CheckCircle, { className: "w-4 h-4 text-green-500" });
            case 'out_of_stock':
                return _jsx(AlertCircle, { className: "w-4 h-4 text-red-500" });
            default:
                return _jsx(Clock, { className: "w-4 h-4 text-gray-400" });
        }
    };
    const getStockStatusText = (status) => {
        switch (status) {
            case 'in_stock':
                return 'In Stock';
            case 'out_of_stock':
                return 'Out of Stock';
            default:
                return 'Unknown';
        }
    };
    return (_jsxs("div", { id: `product-${product.id}`, className: `product-card bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 ${highlighted ? 'highlighted-product' : ''}`, onClick: () => navigate(`/products/${product.id}`), children: [_jsxs("div", { className: "relative h-48 sm:h-56 md:h-64 bg-gray-100", children: [_jsx("img", { src: product.imageUrl || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop', alt: product.title || 'Product image', loading: "lazy", onError: (e) => {
                            const el = e.target;
                            el.src = 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop';
                        }, className: "w-full h-full object-cover" }), _jsx("div", { className: "absolute top-3 left-3", children: _jsxs("div", { className: "flex items-center gap-1 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full shadow-sm", children: [_jsx("span", { className: "text-sm", children: getPlatformIcon(product.platform) }), _jsx("span", { className: "text-xs font-medium text-gray-700 uppercase tracking-wide", children: product.platform })] }) }), _jsx("div", { className: "absolute top-3 right-3", children: _jsxs("div", { className: "flex items-center gap-1 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full shadow-sm", children: [getStockStatusIcon(product.stockStatus), _jsx("span", { className: "text-xs font-medium text-gray-700", children: getStockStatusText(product.stockStatus) })] }) }), product.discountInfo && (_jsx("div", { className: "absolute bottom-3 right-3", children: _jsxs("div", { className: "flex items-center gap-1 px-2 py-1 bg-green-500/90 backdrop-blur-sm rounded-full shadow-sm", children: [_jsx(Star, { className: "w-3 h-3 text-white" }), _jsx("span", { className: "text-xs font-medium text-white", children: product.discountInfo })] }) })), product.hasPriceDrop && product.priceDrop && (_jsx("div", { className: "absolute bottom-3 left-3", children: _jsxs("div", { className: "flex items-center gap-1 px-2 py-1 bg-red-500/90 backdrop-blur-sm rounded-full shadow-sm", children: [_jsx(TrendingDown, { className: "w-3 h-3 text-white" }), _jsxs("span", { className: "text-xs font-medium text-white", children: ["-$", product.priceDrop.toFixed(2), " (", product.priceDropPercent || 0, "%)"] })] }) }))] }), _jsxs("div", { className: "p-3 md:p-4", children: [_jsxs("div", { className: "flex flex-col gap-1 mb-2", children: [_jsx("h3", { className: "text-sm md:text-base font-semibold text-gray-900 line-clamp-2 leading-tight", children: product.title }), globalMatchCount > 0 && (_jsxs("button", { type: "button", onClick: (e) => {
                                    e.stopPropagation();
                                    onViewMatches(product);
                                }, className: "inline-flex items-center w-fit gap-1 px-2.5 py-1 rounded-full bg-blue-500 text-white text-xs font-semibold shadow-sm hover:bg-blue-400 transition-colors", children: [_jsx(Users, { className: "w-3.5 h-3.5" }), _jsx("span", { children: `${globalMatchCount} match${globalMatchCount !== 1 ? 'es' : ''}` })] }))] }), _jsx("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(DollarSign, { className: "w-4 h-4 text-gray-500" }), _jsxs("span", { className: "text-lg md:text-xl font-bold text-gray-900", children: [product.currency, product.price.toFixed(2)] }), priceChange && (_jsxs("div", { className: `flex items-center gap-1 text-xs font-medium ${priceChange.isPositive ? 'text-red-600' : 'text-green-600'}`, children: [priceChange.isPositive ? (_jsx(TrendingUp, { className: "w-3 h-3" })) : (_jsx(TrendingDown, { className: "w-3 h-3" })), priceChange.isPositive ? '+' : '', priceChange.change.toFixed(2), "(", priceChange.isPositive ? '+' : '', priceChange.changePercent.toFixed(1), "%)"] }))] }) }), product.priceHistory && product.priceHistory.length > 0 && (_jsxs("div", { className: "mb-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-xs font-medium text-gray-700", children: "Price History" }), product.priceHistory.length > 3 && (_jsx("button", { onClick: () => setShowAllHistory(!showAllHistory), className: "text-xs text-blue-600 hover:text-blue-700 font-medium", children: showAllHistory ? (_jsxs(_Fragment, { children: [_jsx(EyeOff, { className: "w-3 h-3 inline mr-1" }), "Show Less"] })) : (_jsxs(_Fragment, { children: [_jsx(Eye, { className: "w-3 h-3 inline mr-1" }), "Show More"] })) }))] }), _jsx("div", { className: "space-y-1", children: displayHistory?.map((entry, index) => (_jsxs("div", { className: "flex items-center justify-between text-xs", children: [_jsx("span", { className: "text-gray-500", children: new Date(entry.timestamp).toLocaleDateString() }), _jsxs("span", { className: "font-medium text-gray-900", children: [entry.currency, entry.price.toFixed(2)] })] }, entry.id))) })] })), _jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2", children: [_jsx("a", { href: product.url, target: "_blank", rel: "noopener noreferrer", className: "flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors text-center", children: "Buy Now" }), _jsxs("div", { className: "flex items-center justify-center gap-1", children: [_jsx("button", { onClick: (e) => {
                                            e.stopPropagation();
                                            navigate(`/products/${product.id}`);
                                        }, className: "p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors", title: "View Details", children: _jsx(Eye, { className: "w-4 h-4" }) }), _jsx("button", { onClick: (e) => {
                                            e.stopPropagation();
                                            onViewMatches(product);
                                        }, className: "p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors", title: "View Matches", children: _jsx(Link, { className: "w-4 h-4" }) }), _jsx("button", { onClick: (e) => {
                                            e.stopPropagation();
                                            onViewHistory(product);
                                        }, className: "p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors", title: "View Price History", children: _jsx(TrendingUp, { className: "w-4 h-4" }) }), _jsx("button", { onClick: (e) => {
                                            e.stopPropagation();
                                            onDelete(product.id);
                                        }, className: "p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors", title: "Delete Product", children: _jsx(Trash2, { className: "w-4 h-4" }) })] })] })] })] }));
};
export default function Products() {
    const { user, token } = useAuth();
    const navigate = useNavigate();
    // Show loading state while auth is initializing
    if (token === undefined) {
        return (_jsx("div", { className: "min-h-screen bg-gray-50 p-6", children: _jsx("div", { className: "max-w-7xl mx-auto space-y-6", children: _jsxs("div", { className: "text-center py-12", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" }), _jsx("p", { className: "mt-4 text-gray-600", children: "Loading your products..." })] }) }) }));
    }
    // Show login prompt if not authenticated
    if (!token) {
        return (_jsx("div", { className: "min-h-screen bg-gray-50 p-6", children: _jsx("div", { className: "max-w-7xl mx-auto space-y-6", children: _jsxs("div", { className: "text-center py-12", children: [_jsx(Package, { className: "mx-auto h-12 w-12 text-gray-400" }), _jsx("h3", { className: "mt-2 text-sm font-medium text-gray-900", children: "Please log in to view your products" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: "You need to be authenticated to access your tracked products." })] }) }) }));
    }
    const location = useLocation();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedProductForHistory, setSelectedProductForHistory] = useState(null);
    const [selectedProductForMatches, setSelectedProductForMatches] = useState(null);
    const [highlightedProductId, setHighlightedProductId] = useState(null);
    const [globalMatchCounts, setGlobalMatchCounts] = useState({});
    const handleMatchCountUpdate = useCallback((productId, count) => {
        setGlobalMatchCounts(prev => ({ ...prev, [productId]: count }));
    }, []);
    const handleViewMatches = (product) => {
        setSelectedProductForMatches(product);
    };
    // Advanced filtering state
    const [filterOptions, setFilterOptions] = useState(null);
    const [filters, setFilters] = useState({
        search: '',
        platform: '',
        minPrice: '',
        maxPrice: '',
        stockStatus: '',
        hasPriceDrop: false,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        viewMode: 'grid'
    });
    // Debug highlightedProductId state
    useEffect(() => {
        // Removed debug log
    }, [highlightedProductId]);
    // Debug products state
    useEffect(() => {
        // Removed debug log
    }, [products]);
    // Add CSS for hover and highlight effects
    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
      .product-card {
        transition: all 1.2s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      .product-card:hover {
        transform: scale(1.02) translateY(-4px);
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      }
      
      .highlighted-product {
        border: 4px solid #3b82f6 !important;
        box-shadow: 0 0 30px rgba(59, 130, 246, 0.8) !important;
        transform: scale(1.15) translateY(-20px) !important;
        z-index: 100 !important;
        position: relative;
        animation: highlightPopout 1.5s ease-in-out;
      }
      
      @keyframes highlightPopout {
        0% {
          transform: scale(1) translateY(0);
          box-shadow: 0 0 0 rgba(59, 130, 246, 0);
        }
        50% {
          transform: scale(1.2) translateY(-25px);
          box-shadow: 0 0 40px rgba(59, 130, 246, 0.9);
        }
        100% {
          transform: scale(1.15) translateY(-20px);
          box-shadow: 0 0 30px rgba(59, 130, 246, 0.8);
        }
      }
    `;
        document.head.appendChild(style);
        return () => {
            document.head.removeChild(style);
        };
    }, []);
    // Handle URL parameters for product highlighting
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('highlight');
        if (productId) {
            // Wait for products to load, then scroll and highlight
            const checkAndHighlight = () => {
                const productElement = document.getElementById(`product-${productId}`);
                if (productElement && products.length > 0) {
                    // Remove the parameter from URL after we found the element
                    const newUrl = new URL(window.location.href);
                    newUrl.searchParams.delete('highlight');
                    window.history.replaceState({}, '', newUrl.toString());
                    // Scroll to element
                    productElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                    // Wait for scroll to complete, then add highlight
                    setTimeout(() => {
                        // Set the highlighted product ID to trigger the animation
                        setHighlightedProductId(productId);
                        // Remove highlight after 1.5 seconds
                        setTimeout(() => {
                            setHighlightedProductId(null);
                        }, 1500);
                    }, 500); // Wait 500ms for scroll to complete
                }
                else {
                    // Retry after a short delay
                    setTimeout(checkAndHighlight, 100);
                }
            };
            // Start checking
            checkAndHighlight();
        }
        else {
            // Removed debug log
        }
    }, [products]); // Add products as dependency
    // Get search term from navigation state and handle popup parameter
    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const popup = urlParams.get('popup');
        if (popup === 'true') {
            setShowAddModal(true);
            // Remove the parameter from URL
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('popup');
            window.history.replaceState({}, '', newUrl.toString());
        }
        // Handle search term from navigation state
        if (location.state?.searchTerm) {
            // Removed debug log
            handleFilterChange('search', location.state.searchTerm);
            // Clear the state to prevent re-applying on refresh
            window.history.replaceState({}, '', location.pathname);
        }
    }, [location]);
    const fetchProducts = useCallback(async (currentFilters) => {
        if (!token)
            return;
        try {
            const filterToUse = currentFilters || filters;
            // Build query parameters from filters
            const params = new URLSearchParams();
            if (filterToUse.search)
                params.append('search', filterToUse.search);
            if (filterToUse.platform)
                params.append('platform', filterToUse.platform);
            if (filterToUse.minPrice)
                params.append('minPrice', filterToUse.minPrice);
            if (filterToUse.maxPrice)
                params.append('maxPrice', filterToUse.maxPrice);
            if (filterToUse.stockStatus)
                params.append('stockStatus', filterToUse.stockStatus);
            if (filterToUse.hasPriceDrop)
                params.append('hasPriceDrop', 'true');
            if (filterToUse.sortBy)
                params.append('sortBy', filterToUse.sortBy);
            if (filterToUse.sortOrder)
                params.append('sortOrder', filterToUse.sortOrder);
            const response = await fetch(`/api/products?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setProducts(data.data);
            }
        }
        catch (error) {
            console.error('Error fetching products:', error);
        }
        finally {
            setLoading(false);
        }
    }, [token]);
    // Fetch filter options
    const fetchFilterOptions = useCallback(async () => {
        if (!token)
            return;
        try {
            const response = await fetch('/api/products/filters', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setFilterOptions(data.data);
            }
        }
        catch (error) {
            console.error('Error fetching filter options:', error);
        }
    }, [token]);
    useEffect(() => {
        if (token) {
            const fetchAllProducts = async () => {
                try {
                    const response = await fetch('/api/products', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await response.json();
                    if (data.success) {
                        setProducts(data.data);
                    }
                }
                catch (error) {
                    console.error('Error fetching products:', error);
                }
                finally {
                    setLoading(false);
                }
            };
            fetchAllProducts();
            fetchFilterOptions();
        }
    }, [token]);
    // Fetch match counts for all products with single bulk request and caching
    const fetchMatchCounts = useCallback(async () => {
        if (!token || products.length === 0)
            return;
        try {
            // Fetch counts for products that don't have a positive cached count yet
            const productsNeedingCounts = products.filter(p => !(typeof p.totalMatches === 'number' && p.totalMatches > 0));
            if (productsNeedingCounts.length === 0)
                return;
            const body = { productIds: productsNeedingCounts.map(p => p.id) };
            const response = await fetch('/api/products/match-counts', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });
            // Gracefully handle rate limits or non-JSON responses
            if (response.status === 429) {
                console.warn('Rate limited getting match counts');
                return;
            }
            if (!response.ok) {
                console.warn(`Failed to fetch bulk match counts: ${response.status}`);
                return;
            }
            let data = null;
            try {
                data = await response.json();
            }
            catch (e) {
                console.warn('Bulk match counts returned non-JSON');
                return;
            }
            const counts = data?.data || {};
            setProducts(prevProducts => (prevProducts.map(product => {
                if (typeof product.totalMatches === 'number')
                    return product;
                const count = counts[product.id];
                return typeof count === 'number' ? { ...product, totalMatches: count } : product;
            })));
        }
        catch (error) {
            console.error('Error fetching match counts:', error);
        }
    }, [token, products]);
    // Fetch match counts after products are loaded (with debounce)
    useEffect(() => {
        let timeoutId;
        if (products.length > 0) {
            timeoutId = setTimeout(() => {
                fetchMatchCounts();
            }, 1000); // Wait 1 second after products load
        }
        return () => {
            if (timeoutId)
                clearTimeout(timeoutId);
        };
    }, [products.length, fetchMatchCounts]);
    const fetchGlobalMatchCounts = useCallback(async () => {
        if (!products.length) {
            setGlobalMatchCounts({});
            return;
        }
        let supabaseClient;
        try {
            supabaseClient = getSupabaseClient();
        }
        catch (err) {
            console.warn('Supabase client unavailable for global match counts:', err);
            return;
        }
        const keyEntries = products
            .map((product) => ({ id: product.id, key: generateProductKey(product.title) }))
            .filter((entry) => entry.key);
        if (!keyEntries.length)
            return;
        const keyToIds = keyEntries.reduce((acc, entry) => {
            if (!acc[entry.key])
                acc[entry.key] = [];
            acc[entry.key].push(entry.id);
            return acc;
        }, {});
        const uniqueKeys = Object.keys(keyToIds);
        if (!uniqueKeys.length)
            return;
        try {
            const { data, error } = await supabaseClient
                .from('global_product_matches')
                .select('product_key, match_count')
                .in('product_key', uniqueKeys);
            if (error) {
                console.error('Error fetching global match counts:', error);
                return;
            }
            const counts = {};
            data?.forEach((row) => {
                const linkedIds = keyToIds[row.product_key];
                if (linkedIds?.length) {
                    linkedIds.forEach((productId) => {
                        counts[productId] = row.match_count ?? 0;
                    });
                }
            });
            setGlobalMatchCounts((prev) => ({ ...prev, ...counts }));
        }
        catch (error) {
            console.error('Error loading global match counts:', error);
        }
    }, [products]);
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchGlobalMatchCounts();
        }, 200);
        return () => clearTimeout(timeoutId);
    }, [fetchGlobalMatchCounts]);
    // Fetch products when filters change (but not on initial load)
    useEffect(() => {
        if (token && !loading) {
            const filterToUse = filters;
            // Build query parameters from filters
            const params = new URLSearchParams();
            if (filterToUse.search)
                params.append('search', filterToUse.search);
            if (filterToUse.platform)
                params.append('platform', filterToUse.platform);
            if (filterToUse.minPrice)
                params.append('minPrice', filterToUse.minPrice);
            if (filterToUse.maxPrice)
                params.append('maxPrice', filterToUse.maxPrice);
            if (filterToUse.stockStatus)
                params.append('stockStatus', filterToUse.stockStatus);
            if (filterToUse.hasPriceDrop)
                params.append('hasPriceDrop', 'true');
            if (filterToUse.sortBy)
                params.append('sortBy', filterToUse.sortBy);
            if (filterToUse.sortOrder)
                params.append('sortOrder', filterToUse.sortOrder);
            const fetchFilteredProducts = async () => {
                try {
                    const response = await fetch(`/api/products?${params.toString()}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await response.json();
                    if (data.success) {
                        setProducts(data.data);
                    }
                }
                catch (error) {
                    console.error('Error fetching products:', error);
                }
            };
            fetchFilteredProducts();
        }
    }, [filters, token, loading]);
    // Filter handlers
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };
    const handleClearFilters = () => {
        setFilters({
            search: '',
            platform: '',
            minPrice: '',
            maxPrice: '',
            stockStatus: '',
            hasPriceDrop: false,
            sortBy: 'createdAt',
            sortOrder: 'desc',
            viewMode: 'grid'
        });
    };
    const addProduct = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const productData = {
            title: formData.get('title'),
            price: parseFloat(formData.get('price')),
            currency: formData.get('currency') || 'USD', // Default to USD if missing
            platform: formData.get('platform'),
            url: formData.get('url'),
            imageUrl: formData.get('imageUrl'),
        };
        try {
            const response = await fetch('/api/products/track', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(productData)
            });
            const data = await response.json();
            if (data.success) {
                // Treat both new and already-tracked as success
                const msg = (data.message || '').toLowerCase();
                if (msg.includes('already')) {
                    toast.success('Already tracked — opening details.');
                }
                else {
                    toast.success('Product tracked successfully');
                }
                setShowAddModal(false);
                fetchProducts();
                e.target.reset();
            }
            else {
                console.error('Failed to add product:', data.message);
                toast.error(data.message || 'Failed to track product');
            }
        }
        catch (error) {
            console.error('Error adding product:', error);
            toast.error('Failed to track product');
        }
    };
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    // Handle Enter key for delete confirmation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (showDeleteModal && e.key === 'Enter') {
                confirmDelete();
            }
        };
        if (showDeleteModal) {
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [showDeleteModal]);
    const deleteProduct = async (id) => {
        setProductToDelete(id);
        setShowDeleteModal(true);
    };
    const confirmDelete = async () => {
        if (!productToDelete)
            return;
        try {
            const response = await fetch(`/api/products/${productToDelete}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                console.log('Product deleted successfully!');
                setProducts(products.filter(p => p.id !== productToDelete));
            }
            else {
                console.error('Failed to delete product:', data.message);
            }
        }
        catch (error) {
            console.error('Error deleting product:', error);
        }
        finally {
            setShowDeleteModal(false);
            setProductToDelete(null);
        }
    };
    const handleSort = (value) => {
        handleFilterChange('sortBy', value);
    };
    const handleExport = async (format) => {
        if ((user?.subscription?.tier || 'free') !== 'pro') {
            toast.error('Exporting data is a Pro feature. Upgrade to unlock!', {
                icon: '🔒',
            });
            navigate('/subscription');
            return;
        }
        try {
            const response = await fetch(`/api/products/export/${format}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `products.${format}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        }
        catch (error) {
            console.error('Error exporting data:', error);
        }
    };
    // Filter products based on search term and date filter
    const filteredProducts = products.filter(product => {
        const matchesSearch = product.title.toLowerCase().includes(filters.search.toLowerCase()) ||
            product.platform.toLowerCase().includes(filters.search.toLowerCase());
        if (!matchesSearch)
            return false;
        // Apply date filter
        const productDate = new Date(product.createdAt);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        switch (filters.stockStatus) {
            case 'in_stock':
                return productDate >= today;
            case 'out_of_stock':
                return productDate >= weekAgo;
            case 'unknown':
                return productDate >= monthAgo;
            default:
                return true;
        }
    });
    // Debug logging
    useEffect(() => {
        // Removed debug log
    }, [filters.search, products, filteredProducts]);
    if (loading) {
        return (_jsx("div", { className: "min-h-screen bg-gray-50 p-6", children: _jsxs("div", { className: "max-w-7xl mx-auto space-y-6", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4", children: [_jsxs("div", { children: [_jsx("div", { className: "h-8 bg-gray-200 rounded w-32 mb-2" }), _jsx("div", { className: "h-4 bg-gray-200 rounded w-48" })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "h-10 bg-gray-200 rounded w-32" }), _jsx("div", { className: "h-10 bg-gray-200 rounded w-40" })] })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8", children: [1, 2, 3, 4, 5, 6].map((i) => (_jsx("div", { className: "bg-white rounded-lg border border-gray-200/50 p-4", children: _jsxs("div", { className: "animate-pulse", children: [_jsx("div", { className: "h-48 bg-gray-200 rounded-lg mb-4" }), _jsx("div", { className: "h-4 bg-gray-200 rounded w-3/4 mb-2" }), _jsx("div", { className: "h-3 bg-gray-200 rounded w-1/2 mb-2" }), _jsx("div", { className: "h-6 bg-gray-200 rounded w-1/3 mb-4" }), _jsxs("div", { className: "space-y-2", children: [_jsx("div", { className: "h-3 bg-gray-200 rounded w-full" }), _jsx("div", { className: "h-3 bg-gray-200 rounded w-2/3" })] })] }) }, i))) })] }) }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-gray-50 p-3 md:p-6", children: [_jsxs("div", { className: "max-w-7xl mx-auto space-y-4 md:space-y-6", children: [_jsxs("div", { className: "flex flex-col gap-4", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-xl md:text-2xl font-semibold text-gray-900", children: "Products" }), _jsxs("div", { className: "flex items-center gap-2 mt-1", children: [_jsxs("p", { className: "text-sm md:text-base text-gray-600", children: [filteredProducts.length, " tracked products"] }), (user?.subscription?.tier || 'free') === 'free' && (_jsxs("span", { className: `text-xs px-2 py-0.5 rounded-full font-medium ${products.length >= 5 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`, children: [products.length, "/5 Used"] }))] })] }), _jsxs("div", { className: "flex flex-col sm:flex-row items-stretch sm:items-center gap-3", children: [_jsxs("button", { onClick: () => handleExport('csv'), className: "inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500", children: [(user?.subscription?.tier || 'free') === 'free' ? (_jsx("span", { className: "mr-2 text-xs", children: "\uD83D\uDD12" })) : (_jsx(Download, { className: "-ml-1 mr-2 h-4 w-4" })), "Export CSV"] }), _jsxs("select", { value: filters.sortBy, onChange: (e) => handleSort(e.target.value), className: "w-full sm:w-48 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500 focus:outline-none appearance-none bg-white", children: [_jsx("option", { value: "createdAt", children: "Date Added" }), _jsx("option", { value: "price", children: "Price" }), _jsx("option", { value: "priceDrop", children: "Price Drop" }), _jsx("option", { value: "priceDropPercent", children: "Price Drop %" }), _jsx("option", { value: "title", children: "Title" }), _jsx("option", { value: "platform", children: "Platform" })] })] })] }), _jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none", children: _jsx(Search, { className: "h-5 w-5 text-gray-400" }) }), _jsx("input", { type: "text", placeholder: "Search products...", value: filters.search, onChange: (e) => handleFilterChange('search', e.target.value), className: "block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500 focus:outline-none bg-white text-sm" })] })] }), _jsx(AdvancedFilters, { filters: filters, filterOptions: filterOptions, onFilterChange: handleFilterChange, onClearFilters: handleClearFilters }), filters.search && (_jsx("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-4", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-sm font-medium text-blue-800", children: "Search Results:" }), _jsxs("span", { className: "text-sm text-blue-600", children: ["\"", filters.search, "\""] }), _jsxs("span", { className: "text-sm text-blue-600", children: ["(", filteredProducts.length, " products)"] })] }), _jsx("button", { onClick: () => handleFilterChange('search', ''), className: "text-blue-600 hover:text-blue-800", children: _jsx(X, { size: 16 }) })] }) })), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 lg:gap-8", children: filteredProducts.map((product) => (_jsx(ProductCard, { product: product, onDelete: deleteProduct, onViewHistory: setSelectedProductForHistory, onViewMatches: handleViewMatches, highlighted: product.id === highlightedProductId, globalMatchCount: globalMatchCounts[product.id] }, product.id))) }), filteredProducts.length === 0 && (_jsxs("div", { className: "text-center py-12", children: [_jsx(Package, { className: "mx-auto h-12 w-12 text-gray-400" }), _jsx("h3", { className: "mt-2 text-sm font-medium text-gray-900", children: "No products found" }), _jsx("p", { className: "mt-1 text-sm text-gray-500", children: filters.search ? 'Try adjusting your search terms.' : 'Get started by adding your first product.' }), !filters.search && (_jsx("div", { className: "mt-6", children: _jsxs("button", { onClick: () => {
                                        const currentTier = user?.subscription?.tier || 'free';
                                        const limit = currentTier === 'free' ? 5 : 999;
                                        if (products.length >= limit) {
                                            toast.error(`Free tier limit reached (${limit} products). Upgrade to Pro for unlimited tracking!`, {
                                                duration: 5000,
                                                icon: '🔒',
                                            });
                                            navigate('/subscription');
                                        }
                                        else {
                                            setShowAddModal(true);
                                        }
                                    }, className: `inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${(user?.subscription?.tier || 'free') === 'free' && products.length >= 5
                                        ? 'bg-gray-600 hover:bg-gray-700'
                                        : 'bg-blue-600 hover:bg-blue-700'}`, children: [_jsx(Plus, { className: "-ml-1 mr-2 h-5 w-5" }), "Add Product"] }) }))] }))] }), showAddModal && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-lg p-6 w-full max-w-md mx-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Add New Product" }), _jsx("button", { onClick: () => setShowAddModal(false), className: "text-gray-400 hover:text-gray-600", children: _jsx(X, { className: "w-5 h-5" }) })] }), _jsxs("form", { onSubmit: addProduct, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Product Title" }), _jsx("input", { type: "text", name: "title", required: true, className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Price" }), _jsx("input", { type: "number", name: "price", step: "0.01", required: true, className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Currency" }), _jsxs("select", { name: "currency", required: true, className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500", children: [_jsx("option", { value: "USD", children: "USD" }), _jsx("option", { value: "EUR", children: "EUR" }), _jsx("option", { value: "GBP", children: "GBP" }), _jsx("option", { value: "CAD", children: "CAD" }), _jsx("option", { value: "AUD", children: "AUD" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Platform" }), _jsxs("select", { name: "platform", required: true, className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500", children: [_jsx("option", { value: "amazon", children: "Amazon" }), _jsx("option", { value: "aliexpress", children: "AliExpress" }), _jsx("option", { value: "walmart", children: "Walmart" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Product URL" }), _jsx("input", { type: "url", name: "url", required: true, className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Image URL (optional)" }), _jsx("input", { type: "url", name: "imageUrl", className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" })] }), _jsxs("div", { className: "flex gap-3 pt-4", children: [_jsx("button", { type: "submit", className: "flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors", children: "Add Product" }), _jsx("button", { type: "button", onClick: () => setShowAddModal(false), className: "flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors", children: "Cancel" })] })] })] }) })), selectedProductForHistory && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("h3", { className: "text-lg font-semibold text-gray-900", children: ["Price History for \"", selectedProductForHistory.title, "\""] }), _jsx("button", { onClick: () => setSelectedProductForHistory(null), className: "text-gray-400 hover:text-gray-600", children: _jsx(X, { className: "w-5 h-5" }) })] }), _jsx(ProductPriceHistory, { productId: selectedProductForHistory.id })] }) })), selectedProductForMatches && (_jsx(ProductMatching, { productId: selectedProductForMatches.id, sourceProduct: selectedProductForMatches, onClose: () => setSelectedProductForMatches(null), onMatchCountUpdate: handleMatchCountUpdate })), showDeleteModal && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-lg p-6 max-w-md mx-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Delete Product" }), _jsx("button", { onClick: () => {
                                        setShowDeleteModal(false);
                                        setProductToDelete(null);
                                    }, className: "text-gray-400 hover:text-gray-600", children: _jsx(X, { className: "w-5 h-5" }) })] }), _jsx("p", { className: "text-gray-600 mb-6", children: "Are you sure you want to delete this product? This action cannot be undone." }), _jsxs("div", { className: "flex justify-end gap-3", children: [_jsx("button", { onClick: () => {
                                        setShowDeleteModal(false);
                                        setProductToDelete(null);
                                    }, className: "px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50", children: "Cancel" }), _jsx("button", { onClick: confirmDelete, className: "px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700", children: "Delete" })] })] }) })), _jsx("div", { className: "fixed bottom-4 right-4 md:bottom-6 md:right-6 z-40", children: _jsx("button", { onClick: () => {
                        const currentTier = user?.subscription?.tier || 'free';
                        const limit = currentTier === 'free' ? 5 : 999;
                        if (products.length >= limit) {
                            toast.error(`Free tier limit reached (${limit} products). Upgrade to Pro for unlimited tracking!`, {
                                duration: 5000,
                                icon: '🔒',
                            });
                            navigate('/subscription');
                        }
                        else {
                            setShowAddModal(true);
                        }
                    }, className: `${(user?.subscription?.tier || 'free') === 'free' && products.length >= 5
                        ? 'bg-gray-600 hover:bg-gray-700'
                        : 'bg-blue-600 hover:bg-blue-700'} text-white p-3 md:p-4 rounded-full shadow-lg transition-colors`, title: (user?.subscription?.tier || 'free') === 'free' && products.length >= 5
                        ? "Limit Reached (Upgrade to Pro)"
                        : "Add Product", children: _jsx(Plus, { className: "h-5 w-5 md:h-6 md:w-6" }) }) })] }));
}
export { ProductPriceHistory };
//# sourceMappingURL=Products.js.map