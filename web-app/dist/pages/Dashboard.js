import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Package, DollarSign, TrendingDown, Bell, MoreVertical, Eye, CheckCircle, XCircle, AlertCircle, TrendingUp, Plus, Target, Users } from 'lucide-react';
function MetricCard({ title, value, subtitle, icon: Icon, trend, color, onClick }) {
    const colorClasses = {
        blue: {
            bg: 'from-blue-500 to-blue-600',
            light: 'from-blue-50 to-blue-100',
            text: 'text-blue-600',
            icon: 'text-blue-600'
        },
        green: {
            bg: 'from-green-500 to-green-600',
            light: 'from-green-50 to-green-100',
            text: 'text-green-600',
            icon: 'text-green-600'
        },
        orange: {
            bg: 'from-orange-500 to-orange-600',
            light: 'from-orange-50 to-orange-100',
            text: 'text-orange-600',
            icon: 'text-orange-600'
        },
        purple: {
            bg: 'from-purple-500 to-purple-600',
            light: 'from-purple-50 to-purple-100',
            text: 'text-purple-600',
            icon: 'text-purple-600'
        }
    };
    const colors = colorClasses[color];
    return (_jsxs("div", { className: `relative overflow-hidden border-0 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-gray-200/60 transition-all duration-300 hover:-translate-y-1 bg-white rounded-xl ${onClick ? 'cursor-pointer' : ''}`, onClick: onClick, children: [_jsx("div", { className: `absolute inset-0 bg-gradient-to-br opacity-5 ${colors.bg}` }), _jsx("div", { className: "relative p-6", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-sm font-medium text-gray-600", children: title }), _jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "text-3xl font-bold text-gray-900", children: value }), subtitle && (_jsx("p", { className: "text-sm text-gray-500", children: subtitle }))] }), trend && (_jsxs("div", { className: "flex items-center gap-1", children: [_jsxs("span", { className: `text-sm font-medium ${trend.isPositive ? "text-green-600" : "text-red-600"}`, children: [trend.isPositive ? '+' : '', trend.value] }), _jsx("span", { className: "text-sm text-gray-500", children: "from last month" })] }))] }), _jsx("div", { className: `w-12 h-12 rounded-lg bg-gradient-to-br flex items-center justify-center ${colors.light}`, children: _jsx(Icon, { className: `w-6 h-6 ${colors.icon}` }) })] }) })] }));
}
// Create Alert Modal Component
function CreateAlertModal({ product, isOpen, onClose }) {
    const [targetPrice, setTargetPrice] = useState('');
    const [loading, setLoading] = useState(false);
    const handleCreateAlert = async () => {
        if (!targetPrice || parseFloat(targetPrice) <= 0)
            return;
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/alerts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    productId: product.id,
                    targetPrice: parseFloat(targetPrice),
                    notifyOnRestock: false
                })
            });
            const data = await response.json();
            if (data.success) {
                toast.success('Alert created successfully!');
                onClose();
                setTargetPrice('');
            }
            else {
                console.error('Alert creation failed:', data);
                toast.error(data.message || 'Failed to create alert');
            }
        }
        catch (error) {
            console.error('Error creating alert:', error);
            toast.error('Error creating alert');
        }
        finally {
            setLoading(false);
        }
    };
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-lg p-6 w-full max-w-md mx-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Create Price Alert" }), _jsx("button", { onClick: onClose, className: "text-gray-400 hover:text-gray-600", children: _jsx(XCircle, { className: "w-6 h-6" }) })] }), _jsxs("div", { className: "mb-4", children: [_jsxs("p", { className: "text-sm text-gray-600 mb-2", children: ["Product: ", product.title] }), _jsxs("p", { className: "text-sm text-gray-600 mb-4", children: ["Current Price: $", product.price] }), _jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Target Price" }), _jsxs("div", { className: "relative", children: [_jsx(Target, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" }), _jsx("input", { type: "number", step: "0.01", min: "0", value: targetPrice, onChange: (e) => setTargetPrice(e.target.value), placeholder: "Enter target price", className: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500 focus:outline-none" })] })] }), _jsxs("div", { className: "flex justify-end space-x-3", children: [_jsx("button", { onClick: onClose, className: "px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors", children: "Cancel" }), _jsx("button", { onClick: handleCreateAlert, disabled: loading || !targetPrice || parseFloat(targetPrice) <= 0, className: "px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors", children: loading ? 'Creating...' : 'Create Alert' })] })] }) }));
}
// Product Table Component
function ProductTable({ searchTerm, navigate }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showAlertModal, setShowAlertModal] = useState(false);
    const { t } = useTranslation();
    const { loading: authLoading, token } = useAuth();
    console.log('Dashboard ProductTable - Component rendered:', { authLoading, hasToken: !!token, productsCount: products.length });
    useEffect(() => {
        // Wait for auth to be ready before fetching data
        if (!authLoading && token) {
            fetchProducts();
        }
    }, [authLoading, token]);
    const fetchProducts = async () => {
        if (!token)
            return;
        try {
            const response = await fetch('/api/products', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            console.log('Dashboard ProductTable - API Response:', data);
            if (data.success) {
                // Sort by date (newest first) and show ALL products
                const sortedProducts = data.data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                console.log('Dashboard ProductTable - Setting products:', sortedProducts.length);
                setProducts(sortedProducts);
            }
            else {
                console.error('Failed to fetch products:', data.message);
            }
        }
        catch (error) {
            console.error('Error fetching products:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const getPriceChange = (product) => {
        if (!product.priceHistory || product.priceHistory.length < 2)
            return null;
        const current = product.priceHistory[product.priceHistory.length - 1]?.price;
        const previous = product.priceHistory[product.priceHistory.length - 2]?.price;
        if (!current || !previous)
            return null;
        const change = current - previous;
        const percentChange = (change / previous) * 100;
        return {
            value: Math.abs(change).toFixed(2),
            percent: Math.abs(percentChange).toFixed(1),
            isPositive: change < 0
        };
    };
    // Mock price change data for demo (remove when real data is available)
    const getMockPriceChange = (product) => {
        const mockChanges = [
            { value: "5.99", percent: "8.5", isPositive: true },
            { value: "12.50", percent: "15.2", isPositive: false },
            { value: "3.25", percent: "4.1", isPositive: true },
            { value: "8.75", percent: "11.3", isPositive: false }
        ];
        return mockChanges[product.id?.charCodeAt(0) % 4 || 0];
    };
    const platformColors = {
        amazon: { bg: 'bg-orange-100', text: 'text-orange-800', name: 'Amazon' },
        aliexpress: { bg: 'bg-red-100', text: 'text-red-800', name: 'AliExpress' },
        ebay: { bg: 'bg-blue-100', text: 'text-blue-800', name: 'eBay' },
        shein: { bg: 'bg-pink-100', text: 'text-pink-800', name: 'Shein' },
        walmart: { bg: 'bg-blue-100', text: 'text-blue-800', name: 'Walmart' }
    };
    const stockConfig = {
        'in_stock': { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'In Stock' },
        'out_of_stock': { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Out of Stock' },
        'unknown': { icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-100', label: 'Unknown' }
    };
    // Filter products based on search term
    const filteredProducts = products.filter(product => product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.platform.toLowerCase().includes(searchTerm.toLowerCase()));
    // Properly truncate title to 50 characters
    const truncateTitle = (title) => {
        if (title.length <= 50)
            return title;
        return title.substring(0, 50) + '...';
    };
    const handleCreateAlert = (product) => {
        setSelectedProduct(product);
        setShowAlertModal(true);
    };
    if (loading || authLoading) {
        return (_jsx("div", { className: "bg-white rounded-xl shadow-lg p-6", children: _jsxs("div", { className: "animate-pulse", children: [_jsx("div", { className: "h-4 bg-gray-200 rounded w-1/4 mb-4" }), _jsx("div", { className: "space-y-3", children: [1, 2, 3].map((i) => (_jsx("div", { className: "h-12 bg-gray-200 rounded" }, i))) })] }) }));
    }
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "bg-white rounded-xl shadow-lg border-0 shadow-gray-200/50", children: _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900", children: "All Tracked Products" }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: "Monitor price changes across platforms (sorted by date)" })] }), _jsx("button", { onClick: () => navigate('/products'), className: "px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors", children: "View All Products" })] }), _jsx("div", { className: "divide-y divide-gray-200", children: filteredProducts.length === 0 ? (_jsxs("div", { className: "p-6 text-center text-gray-500", children: [_jsx(Package, { className: "w-12 h-12 mx-auto mb-4 text-gray-300" }), _jsx("p", { children: "No products tracked yet" }), _jsx("p", { className: "text-sm", children: "Start tracking products to see them here" })] })) : (filteredProducts.map((product) => {
                                const priceChange = getPriceChange(product);
                                const platform = platformColors[product.platform] || platformColors.amazon;
                                const stock = stockConfig[product.stockStatus] || stockConfig.unknown;
                                const StockIcon = stock.icon;
                                return (_jsx("div", { className: "p-4 hover:bg-gray-50 transition-colors", children: _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0", children: _jsx("img", { src: product.imageUrl || 'https://via.placeholder.com/64x64', alt: product.title, className: "w-full h-full object-cover", onError: (e) => {
                                                        e.target.src = 'https://via.placeholder.com/64x64';
                                                    } }) }), _jsxs("div", { className: "flex-1 min-w-0 space-y-2", children: [_jsx("h3", { className: "font-medium text-gray-900 truncate", children: truncateTitle(product.title) }), _jsxs("div", { className: "flex items-center gap-3 flex-wrap", children: [_jsx("span", { className: `inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${platform.bg} ${platform.text}`, children: platform.name }), _jsxs("div", { className: `flex items-center gap-1 px-2 py-1 rounded-full ${stock.bg}`, children: [_jsx(StockIcon, { className: `w-3 h-3 ${stock.color}` }), _jsx("span", { className: `text-xs font-medium ${stock.color}`, children: stock.label })] }), product.matchedProducts && product.matchedProducts.length > 0 && (_jsxs("div", { className: "flex items-center gap-1 mt-1", children: [_jsx(Users, { className: "w-3 h-3 text-blue-500" }), _jsxs("span", { className: "text-xs text-blue-600 font-medium", children: [product.matchedProducts.length, " match", product.matchedProducts.length !== 1 ? 'es' : ''] })] }))] })] }), _jsxs("div", { className: "text-right space-y-1 flex-shrink-0", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("span", { className: "text-lg font-bold text-gray-900", children: ["$", product.price] }), product.originalPrice && product.originalPrice > product.price && (_jsxs("span", { className: "text-sm text-gray-500 line-through", children: ["$", product.originalPrice] }))] }), _jsx("div", { className: "flex items-center gap-1 justify-end", children: (() => {
                                                            const priceChange = getPriceChange(product) || getMockPriceChange(product);
                                                            if (!priceChange)
                                                                return null;
                                                            return (_jsxs(_Fragment, { children: [priceChange.isPositive && _jsx(TrendingDown, { className: "w-3 h-3 text-green-600" }), !priceChange.isPositive && _jsx(TrendingUp, { className: "w-3 h-3 text-red-600" }), _jsxs("span", { className: `text-xs font-medium ${priceChange.isPositive ? 'text-green-600' : 'text-red-600'}`, children: [priceChange.isPositive ? '' : '+', "$", priceChange.value, " (", priceChange.percent, "%)"] })] }));
                                                        })() })] }), _jsxs("div", { className: "flex items-center space-x-2 flex-shrink-0", children: [_jsx("button", { onClick: () => handleCreateAlert(product), className: "p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600", title: "Create Alert", children: _jsx(Plus, { className: "w-4 h-4" }) }), _jsx("button", { className: "p-2 hover:bg-gray-100 rounded-lg transition-colors", children: _jsx(Eye, { className: "w-4 h-4 text-gray-600" }) }), _jsx("button", { className: "p-2 hover:bg-gray-100 rounded-lg transition-colors", children: _jsx(MoreVertical, { className: "w-4 h-4 text-gray-600" }) })] })] }) }, product.id));
                            })) })] }) }), _jsx(CreateAlertModal, { product: selectedProduct, isOpen: showAlertModal, onClose: () => {
                    setShowAlertModal(false);
                    setSelectedProduct(null);
                } })] }));
}
export default function Dashboard() {
    const { getAuthHeaders, user, loading: authLoading, token } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState({
        totalProducts: 0,
        totalValue: 0,
        priceDrops: 0,
        activeAlerts: 0
    });
    const [seenPriceDropIds, setSeenPriceDropIds] = useState([]);
    const [isBanned, setIsBanned] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showAlertModal, setShowAlertModal] = useState(false);
    const fetchDashboardData = async () => {
        if (!token) {
            console.log('Dashboard - No token available');
            return;
        }
        console.log('Dashboard - Fetching dashboard data...');
        try {
            const timestamp = Date.now();
            const randomParam = Math.random().toString(36).substring(7);
            const [productsRes, alertsRes] = await Promise.all([
                fetch(`/api/products?t=${timestamp}&r=${randomParam}&fresh=true`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0'
                    }
                }),
                fetch(`/api/alerts?t=${timestamp}&r=${randomParam}&fresh=true`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0'
                    }
                })
            ]);
            // Check if user is banned (403 status)
            if (productsRes.status === 403) {
                setProducts([]);
                setAlerts([]);
                setIsBanned(true);
                return;
            }
            const productsData = await productsRes.json();
            const alertsData = await alertsRes.json();
            if (productsData.success) {
                const productsArray = productsData.data;
                console.log('Dashboard - Products fetched:', productsArray.length);
                setProducts(productsArray);
                const totalValue = productsArray.reduce((sum, p) => sum + (p.price || 0), 0);
                // Only calculate price drops if we have seen price drop IDs loaded
                // This prevents temporary numbers from showing
                const priceDrops = productsArray.filter((p) => {
                    if (!p.priceHistory || p.priceHistory.length < 2) {
                        return false;
                    }
                    const sortedHistory = p.priceHistory.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
                    const last = sortedHistory[sortedHistory.length - 1];
                    const prev = sortedHistory[sortedHistory.length - 2];
                    const hasDrop = last && prev && last.price < prev.price;
                    const isSeen = seenPriceDropIds.includes(p.id);
                    return hasDrop && !isSeen; // Only count unseen price drops
                }).length;
                // Force immediate state update
                console.log('Dashboard - Setting products in main component:', productsArray.length);
                setMetrics(prevMetrics => ({
                    ...prevMetrics,
                    totalProducts: productsArray.length,
                    totalValue: totalValue,
                    priceDrops: priceDrops,
                    activeAlerts: alertsData.success ? alertsData.data.filter((alert) => alert.isActive).length : 0
                }));
            }
        }
        catch (error) {
            console.error('Error fetching dashboard data:', error);
        }
    };
    const triggerPriceCheck = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token)
                return;
            const response = await fetch('/api/alerts/trigger-check', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                toast.success('Price check completed! Check notifications for any alerts.');
                // Refresh dashboard data to show updated prices
                fetchDashboardData();
            }
            else {
                toast.error('Failed to trigger price check');
            }
        }
        catch (error) {
            console.error('Error triggering price check:', error);
            toast.error('Error triggering price check');
        }
    };
    const updatePriceHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token)
                return;
            // Update price history for all products
            const updatePromises = products.map(product => fetch(`/api/alerts/update-price-history/${product.id}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }));
            await Promise.all(updatePromises);
            toast.success('Price history updated for all products!');
            fetchDashboardData();
        }
        catch (error) {
            console.error('Error updating price history:', error);
            toast.error('Error updating price history');
        }
    };
    // Fetch seen price drops first, then dashboard data
    const fetchSeenPriceDrops = async () => {
        if (!token) {
            return;
        }
        try {
            setLoading(true);
            const response = await fetch('/api/users/seen-price-drops', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setSeenPriceDropIds(data.data);
                // Don't call fetchDashboardData here - let useEffect handle it
            }
        }
        catch (error) {
            console.error('Error fetching seen price drops:', error);
        }
        finally {
            setLoading(false);
        }
    };
    // Watch for changes in seenPriceDropIds and fetch dashboard data
    useEffect(() => {
        if (token && !authLoading) {
            fetchDashboardData();
        }
    }, [seenPriceDropIds, token, authLoading]);
    // Mark price drop as seen
    const markPriceDropAsSeen = async (productId) => {
        try {
            const response = await fetch('/api/users/mark-price-drop-seen', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ productId })
            });
            if (response.ok) {
                // Update local state
                setSeenPriceDropIds(prev => [...prev, productId]);
                // Recalculate metrics
                fetchDashboardData();
            }
        }
        catch (error) {
            console.error('Error marking price drop as seen:', error);
        }
    };
    // Handle price drops card click
    const handlePriceDropsClick = () => {
        // Get products with price drops
        const productsWithDrops = products.filter((p) => {
            if (!p.priceHistory || p.priceHistory.length < 2)
                return false;
            const sortedHistory = p.priceHistory.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
            const last = sortedHistory[sortedHistory.length - 1];
            const prev = sortedHistory[sortedHistory.length - 2];
            const hasDrop = last && prev && last.price < prev.price;
            const isSeen = seenPriceDropIds.includes(p.id);
            return hasDrop && !isSeen;
        });
        if (productsWithDrops.length > 0) {
            const dropIds = productsWithDrops.map((p) => p.id).join(',');
            navigate(`/history?highlight=${dropIds}`);
        }
        else {
            // If no price drops, just navigate to history page
            navigate('/history');
        }
    };
    useEffect(() => {
        if (token && !authLoading && seenPriceDropIds.length === 0) {
            fetchSeenPriceDrops();
        }
    }, [token, authLoading]);
    // Listen for price drop marked as seen events
    useEffect(() => {
        const handlePriceDropMarkedAsSeen = () => {
            fetchSeenPriceDrops();
        };
        window.addEventListener('priceDropMarkedAsSeen', handlePriceDropMarkedAsSeen);
        return () => {
            window.removeEventListener('priceDropMarkedAsSeen', handlePriceDropMarkedAsSeen);
        };
    }, []);
    // Force refresh function
    const forceRefresh = () => {
        fetchSeenPriceDrops();
    };
    // Auto-refresh when page becomes visible (when user returns from tracking)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!document.hidden && !authLoading && token) {
                fetchSeenPriceDrops();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [authLoading, token]);
    // Show loading screen
    if (authLoading || loading) {
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" }) }));
    }
    return (_jsxs("div", { className: "space-y-8", children: [isBanned && (_jsx("div", { className: "bg-red-50 border border-red-200 rounded-lg p-4", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "flex-shrink-0", children: _jsx(AlertCircle, { className: "w-5 h-5 text-red-600" }) }), _jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "text-sm font-medium text-red-800", children: "Account Suspended" }), _jsx("p", { className: "text-sm text-red-700 mt-1", children: "Your account has been suspended. Please contact support for assistance." })] }), _jsx("button", { onClick: () => window.open('mailto:support@pricetracker.com', '_blank'), className: "text-sm font-medium text-red-600 hover:text-red-800 underline", children: "Contact Support" })] }) })), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Dashboard" }), _jsx("p", { className: "text-gray-600 mt-1", children: "Track your products and monitor price changes" })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs("button", { onClick: triggerPriceCheck, className: "flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors", children: [_jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [_jsx("path", { d: "M9 12l2 2 4-4" }), _jsx("path", { d: "M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c1.5 0 2.9.37 4.13 1.02" })] }), "Check Prices"] }), _jsxs("button", { onClick: updatePriceHistory, className: "flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors", children: [_jsx("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: _jsx("path", { d: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" }) }), "Update History"] }), _jsxs("button", { onClick: () => {
                                    fetchSeenPriceDrops();
                                }, className: "flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors", children: [_jsxs("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", children: [_jsx("path", { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" }), _jsx("path", { d: "M21 3v5h-5" }), _jsx("path", { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" }), _jsx("path", { d: "M3 21v-5h5" })] }), "Refresh"] })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: [_jsx(MetricCard, { title: "Total Products", value: metrics.totalProducts, subtitle: "Across 5 platforms", icon: Package, trend: { value: "12%", isPositive: true }, color: "blue", onClick: () => navigate('/products') }), _jsx(MetricCard, { title: "Total Value", value: `$${metrics.totalValue.toLocaleString()}`, subtitle: "Tracked value", icon: DollarSign, trend: { value: "8%", isPositive: true }, color: "green", onClick: () => navigate('/products') }), _jsx(MetricCard, { title: "Price Drops", value: metrics.priceDrops, subtitle: "This week", icon: TrendingDown, trend: { value: "15%", isPositive: true }, color: "orange", onClick: handlePriceDropsClick }), _jsx(MetricCard, { title: "Active Alerts", value: metrics.activeAlerts, subtitle: "Monitoring", icon: Bell, color: "purple", onClick: () => navigate('/alerts') })] }), _jsx("div", { className: "bg-white rounded-xl shadow-lg border-0 shadow-gray-200/50", children: _jsxs("div", { className: "p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900", children: "Recent Tracked Products" }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: "Monitor price changes across platforms" })] }), _jsx("button", { onClick: () => navigate('/products'), className: "px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors", children: "View All Products" })] }), _jsx("div", { className: "divide-y divide-gray-200", children: products.length === 0 ? (_jsxs("div", { className: "p-6 text-center text-gray-500", children: [_jsx(Package, { className: "w-12 h-12 mx-auto mb-4 text-gray-300" }), _jsx("p", { children: "No products tracked yet" }), _jsx("p", { className: "text-sm", children: "Start tracking products to see them here" })] })) : (products.map((product) => (_jsx("div", { className: "p-4 hover:bg-gray-50 transition-colors", children: _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0", children: _jsx("img", { src: product.imageUrl || 'https://via.placeholder.com/64x64', alt: product.title, className: "w-full h-full object-cover", onError: (e) => {
                                                    e.target.src = 'https://via.placeholder.com/64x64';
                                                } }) }), _jsxs("div", { className: "flex-1 min-w-0 space-y-2", children: [_jsx("h3", { className: "font-medium text-gray-900 truncate", children: product.title.length > 50 ? product.title.substring(0, 50) + '...' : product.title }), _jsx("p", { className: "text-sm text-gray-500 capitalize", children: product.platform })] }), _jsx("div", { className: "text-right space-y-1 flex-shrink-0", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("span", { className: "text-lg font-bold text-gray-900", children: ["$", product.price] }), product.originalPrice && product.originalPrice > product.price && (_jsxs("span", { className: "text-sm text-gray-500 line-through", children: ["$", product.originalPrice] }))] }) }), _jsxs("div", { className: "flex items-center space-x-2 flex-shrink-0", children: [_jsx("button", { onClick: () => {
                                                        setSelectedProduct(product);
                                                        setShowAlertModal(true);
                                                    }, className: "p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600", title: "Create Alert", children: _jsx(Plus, { className: "w-4 h-4" }) }), _jsx("button", { className: "p-2 hover:bg-gray-100 rounded-lg transition-colors", children: _jsx(Eye, { className: "w-4 h-4 text-gray-600" }) }), _jsx("button", { className: "p-2 hover:bg-gray-100 rounded-lg transition-colors", children: _jsx(MoreVertical, { className: "w-4 h-4 text-gray-600" }) })] })] }) }, product.id)))) })] }) }), _jsx(CreateAlertModal, { product: selectedProduct, isOpen: showAlertModal, onClose: () => {
                    setShowAlertModal(false);
                    setSelectedProduct(null);
                } })] }));
}
//# sourceMappingURL=Dashboard.js.map