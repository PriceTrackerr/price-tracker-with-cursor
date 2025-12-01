import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Package, DollarSign, TrendingDown, Bell, MoreVertical, Eye, LogOut, XCircle, TrendingUp, Plus, Target, RefreshCw, ArrowRight, Menu, X } from 'lucide-react';
// --- Components ---
// 1. Navigation
function DashboardNav() {
    const { logout, user } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    return (_jsxs("nav", { className: "sticky top-0 z-50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-gray-700/50 shadow-sm", children: [_jsx("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: _jsxs("div", { className: "flex items-center justify-between h-16", children: [_jsxs(Link, { to: "/", className: "flex items-center gap-2", children: [_jsx("div", { className: "w-8 h-8 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-500/20", children: _jsxs("svg", { width: "20", height: "20", viewBox: "0 0 100 100", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [_jsx("rect", { x: "0", y: "0", width: "100", height: "100", rx: "20", fill: "transparent" }), _jsx("path", { d: "M25 70 C35 50, 65 50, 75 30", stroke: "white", strokeWidth: "8", strokeLinecap: "round", strokeLinejoin: "round" }), _jsx("circle", { cx: "75", cy: "30", r: "6", fill: "white" })] }) }), _jsx("span", { className: "text-lg font-bold text-slate-900 dark:text-white tracking-tight", children: "Price Tracker" })] }), _jsxs("div", { className: "hidden md:flex items-center gap-4", children: [_jsxs("div", { className: "flex items-center gap-3 px-3 py-1.5 bg-slate-50 dark:bg-gray-700/50 rounded-full border border-slate-200/50 dark:border-gray-600/50", children: [_jsx("div", { className: "w-8 h-8 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold text-sm", children: user?.email?.charAt(0).toUpperCase() || 'U' }), _jsx("span", { className: "text-sm font-medium text-slate-700 dark:text-slate-200 pr-2", children: user?.email })] }), _jsx("button", { onClick: logout, className: "p-2 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors", title: "Logout", children: _jsx(LogOut, { className: "w-5 h-5" }) })] }), _jsx("button", { className: "md:hidden p-2 text-slate-600 dark:text-slate-300", onClick: () => setIsMenuOpen(!isMenuOpen), children: isMenuOpen ? _jsx(X, { className: "w-6 h-6" }) : _jsx(Menu, { className: "w-6 h-6" }) })] }) }), isMenuOpen && (_jsx("div", { className: "md:hidden border-t border-slate-100 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-4 shadow-xl", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center gap-3 px-3 py-2 bg-slate-50 dark:bg-gray-700 rounded-lg", children: [_jsx("div", { className: "w-8 h-8 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold text-sm", children: user?.email?.charAt(0).toUpperCase() || 'U' }), _jsx("span", { className: "text-sm font-medium text-slate-700 dark:text-slate-200", children: user?.email })] }), _jsxs("button", { onClick: logout, className: "w-full flex items-center gap-2 px-3 py-2 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors", children: [_jsx(LogOut, { className: "w-4 h-4" }), _jsx("span", { children: "Logout" })] })] }) }))] }));
}
function MetricCard({ title, value, subtitle, icon: Icon, trend, color, onClick }) {
    const colorStyles = {
        blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400', icon: 'text-blue-600 dark:text-blue-400' },
        green: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400', icon: 'text-emerald-600 dark:text-emerald-400' },
        orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400', icon: 'text-orange-600 dark:text-orange-400' },
        purple: { bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-600 dark:text-violet-400', icon: 'text-violet-600 dark:text-violet-400' }
    };
    const style = colorStyles[color];
    return (_jsxs("div", { onClick: onClick, className: `relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl p-6 border border-slate-200/60 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 group ${onClick ? 'cursor-pointer hover:-translate-y-1' : ''}`, children: [_jsxs("div", { className: "flex justify-between items-start mb-4", children: [_jsx("div", { className: `w-12 h-12 rounded-xl ${style.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`, children: _jsx(Icon, { className: `w-6 h-6 ${style.icon}` }) }), trend && (_jsxs("div", { className: `flex items-center gap-1 text-sm font-medium ${trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'} bg-white dark:bg-gray-700 px-2 py-1 rounded-full border border-slate-100 dark:border-gray-600 shadow-sm`, children: [trend.isPositive ? _jsx(TrendingUp, { className: "w-3 h-3" }) : _jsx(TrendingDown, { className: "w-3 h-3" }), trend.value] }))] }), _jsxs("div", { children: [_jsx("h3", { className: "text-slate-500 dark:text-slate-400 text-sm font-medium mb-1", children: title }), _jsx("div", { className: "text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-1", children: value }), subtitle && _jsx("p", { className: "text-slate-400 dark:text-slate-500 text-sm", children: subtitle })] }), _jsx("div", { className: `absolute -right-6 -bottom-6 w-24 h-24 rounded-full ${style.bg} opacity-50 blur-2xl group-hover:opacity-100 transition-opacity` })] }));
}
// 3. Create Alert Modal
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
    return (_jsx("div", { className: "fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in", children: _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-in", children: [_jsxs("div", { className: "px-6 py-4 border-b border-slate-100 dark:border-gray-700 flex items-center justify-between bg-slate-50/50 dark:bg-gray-700/50", children: [_jsx("h3", { className: "text-lg font-semibold text-slate-900 dark:text-white", children: "Create Price Alert" }), _jsx("button", { onClick: onClose, className: "text-slate-400 hover:text-slate-600 dark:text-gray-400 dark:hover:text-gray-200 transition-colors", children: _jsx(XCircle, { className: "w-6 h-6" }) })] }), _jsxs("div", { className: "p-6 space-y-6", children: [_jsxs("div", { className: "bg-slate-50 dark:bg-gray-700/50 rounded-xl p-4 border border-slate-100 dark:border-gray-600", children: [_jsx("p", { className: "text-sm text-slate-500 dark:text-slate-400 mb-1", children: "Product" }), _jsx("p", { className: "text-slate-900 dark:text-white font-medium truncate", children: product.title }), _jsxs("div", { className: "flex items-center gap-2 mt-2", children: [_jsx("span", { className: "text-sm text-slate-500 dark:text-slate-400", children: "Current Price:" }), _jsxs("span", { className: "text-lg font-bold text-slate-900 dark:text-white", children: ["$", product.price] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2", children: "Target Price" }), _jsxs("div", { className: "relative", children: [_jsx(Target, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" }), _jsx("input", { type: "number", step: "0.01", min: "0", value: targetPrice, onChange: (e) => setTargetPrice(e.target.value), placeholder: "Enter target price", className: "w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all" })] }), _jsx("p", { className: "text-xs text-slate-500 mt-2", children: "We'll notify you when the price drops below this amount." })] })] }), _jsxs("div", { className: "px-6 py-4 bg-slate-50 dark:bg-gray-700/50 border-t border-slate-100 dark:border-gray-700 flex justify-end gap-3", children: [_jsx("button", { onClick: onClose, className: "px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-600 rounded-lg transition-colors", children: "Cancel" }), _jsx("button", { onClick: handleCreateAlert, disabled: loading || !targetPrice || parseFloat(targetPrice) <= 0, className: "px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/20", children: loading ? 'Creating...' : 'Create Alert' })] })] }) }));
}
// 4. Main Dashboard Component
function Dashboard() {
    const { user } = useAuth();
    const { t } = useTranslation();
    const [dashboardData, setDashboardData] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAlertModal, setShowAlertModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = { Authorization: `Bearer ${token}` };
                const [dashboardRes, productsRes] = await Promise.all([
                    fetch('/api/dashboard', { headers }),
                    fetch('/api/products', { headers })
                ]);
                if (dashboardRes.ok) {
                    const data = await dashboardRes.json();
                    setDashboardData(data);
                }
                if (productsRes.ok) {
                    const data = await productsRes.json();
                    setProducts(data);
                }
            }
            catch (error) {
                console.error('Error fetching dashboard data:', error);
                toast.error('Failed to load dashboard data');
            }
            finally {
                setLoading(false);
            }
        };
        if (user) {
            fetchData();
        }
    }, [user]);
    const platformColors = {
        amazon: { bg: 'bg-orange-100 text-orange-800', border: 'border-orange-200', name: 'Amazon' },
        ebay: { bg: 'bg-blue-100 text-blue-800', border: 'border-blue-200', name: 'eBay' },
        walmart: { bg: 'bg-blue-100 text-blue-800', border: 'border-blue-200', name: 'Walmart' },
        bestbuy: { bg: 'bg-yellow-100 text-yellow-800', border: 'border-yellow-200', name: 'Best Buy' },
        target: { bg: 'bg-red-100 text-red-800', border: 'border-red-200', name: 'Target' },
        aliexpress: { bg: 'bg-red-100 text-red-800', border: 'border-red-200', name: 'AliExpress' },
        shein: { bg: 'bg-black text-white', border: 'border-gray-800', name: 'Shein' }
    };
    if (loading) {
        return (_jsx("div", { className: "min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" }) }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-slate-50 dark:bg-gray-900 transition-colors duration-300", children: [_jsx(DashboardNav, {}), _jsxs("main", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8", children: [_jsxs("div", { className: "flex flex-col md:flex-row md:items-center justify-between gap-4", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-2xl font-bold text-slate-900 dark:text-white", children: ["Welcome back, ", user?.name || 'User', "! \uD83D\uDC4B"] }), _jsx("p", { className: "text-slate-500 dark:text-slate-400 mt-1", children: "Here's what's happening with your tracked products today." })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("button", { className: "flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-gray-700 rounded-xl hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors shadow-sm", children: [_jsx(RefreshCw, { className: "w-4 h-4" }), _jsx("span", { children: "Refresh" })] }), _jsxs(Link, { to: "/add-product", className: "flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/20", children: [_jsx(Plus, { className: "w-4 h-4" }), _jsx("span", { children: "Track New Product" })] })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: [_jsx(MetricCard, { title: "Total Products", value: dashboardData?.totalProducts || 0, icon: Package, color: "blue", trend: { value: "+12%", isPositive: true } }), _jsx(MetricCard, { title: "Total Value", value: `$${dashboardData?.totalValue?.toLocaleString() || '0'}`, icon: DollarSign, color: "green", trend: { value: "+5%", isPositive: true } }), _jsx(MetricCard, { title: "Price Drops", value: dashboardData?.priceDrops || 0, subtitle: "In the last 24h", icon: TrendingDown, color: "orange", trend: { value: "3 new", isPositive: true } }), _jsx(MetricCard, { title: "Active Alerts", value: dashboardData?.activeAlerts || 0, icon: Bell, color: "purple" })] }), _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-2xl border border-slate-200/60 dark:border-gray-700 shadow-sm overflow-hidden", children: [_jsxs("div", { className: "px-6 py-4 border-b border-slate-100 dark:border-gray-700 flex items-center justify-between", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-900 dark:text-white", children: "Recent Tracked Products" }), _jsxs(Link, { to: "/products", className: "text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium flex items-center gap-1", children: ["View All ", _jsx(ArrowRight, { className: "w-4 h-4" })] })] }), _jsx("div", { className: "divide-y divide-slate-100 dark:divide-gray-700", children: products.length === 0 ? (_jsxs("div", { className: "p-8 text-center", children: [_jsx("div", { className: "w-16 h-16 bg-slate-50 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4", children: _jsx(Package, { className: "w-8 h-8 text-slate-400" }) }), _jsx("h3", { className: "text-slate-900 dark:text-white font-medium mb-1", children: "No products yet" }), _jsx("p", { className: "text-slate-500 dark:text-slate-400 text-sm mb-4", children: "Start tracking products to see them here." }), _jsxs(Link, { to: "/add-product", className: "inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors", children: [_jsx(Plus, { className: "w-4 h-4" }), _jsx("span", { children: "Add Product" })] })] })) : (products.slice(0, 5).map((product) => {
                                    const platform = platformColors[product.platform] || platformColors.amazon;
                                    return (_jsx("div", { className: "p-4 hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors group", children: _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "relative w-16 h-16 rounded-xl overflow-hidden bg-white dark:bg-gray-700 border border-slate-200 dark:border-gray-600 flex-shrink-0 shadow-sm", children: _jsx("img", { src: product.imageUrl || 'https://via.placeholder.com/64x64', alt: product.title, className: "w-full h-full object-contain p-1", onError: (e) => {
                                                            e.target.src = 'https://via.placeholder.com/64x64';
                                                        } }) }), _jsxs("div", { className: "flex-1 min-w-0 space-y-1", children: [_jsx("h3", { className: "font-medium text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors", children: product.title }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${platform.bg} ${platform.border} border`, children: platform.name }), _jsxs("span", { className: "text-xs text-slate-400", children: ["Added ", new Date(product.createdAt || Date.now()).toLocaleDateString()] })] })] }), _jsxs("div", { className: "text-right space-y-1 flex-shrink-0", children: [_jsx("div", { className: "flex items-center gap-2 justify-end", children: _jsxs("span", { className: "text-lg font-bold text-slate-900 dark:text-white", children: ["$", product.price] }) }), product.originalPrice && product.originalPrice > product.price && (_jsxs("span", { className: "text-sm text-slate-400 line-through block", children: ["$", product.originalPrice] }))] }), _jsxs("div", { className: "flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity pl-4", children: [_jsx("button", { onClick: () => {
                                                                setSelectedProduct(product);
                                                                setShowAlertModal(true);
                                                            }, className: "p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-colors", title: "Create Alert", children: _jsx(Bell, { className: "w-4 h-4" }) }), _jsx("button", { className: "p-2 hover:bg-slate-100 dark:hover:bg-gray-600 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors", children: _jsx(Eye, { className: "w-4 h-4" }) }), _jsx("button", { className: "p-2 hover:bg-slate-100 dark:hover:bg-gray-600 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors", children: _jsx(MoreVertical, { className: "w-4 h-4" }) })] })] }) }, product.id));
                                })) })] })] }), _jsx(CreateAlertModal, { product: selectedProduct, isOpen: showAlertModal, onClose: () => {
                    setShowAlertModal(false);
                    setSelectedProduct(null);
                } })] }));
}
export default Dashboard;
//# sourceMappingURL=Dashboard.js.map