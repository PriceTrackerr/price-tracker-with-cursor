import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Bell, BellRing, Filter, ArrowUpDown, Plus, Trash2, Target, TrendingUp, TrendingDown, Package, X, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../components/AuthContext';
import { useTranslation } from 'react-i18next';
import PriceDisplay from '../components/PriceDisplay';
// Alert Card Component matching Figma design exactly
function AlertCard({ id, productName, platform, currentPrice, targetPrice, isActive, isTargetReached, notifyOnRestock, onToggleActive, onDelete }) {
    const priceDifference = currentPrice - targetPrice;
    const isAboveTarget = currentPrice > targetPrice;
    return (_jsx("div", { className: `transition-all duration-300 border rounded-[0.625rem] p-4 ${isTargetReached
            ? 'border-green-200 bg-green-50/50'
            : isActive
                ? 'border-gray-300 hover:border-blue-500 bg-white hover:shadow-md'
                : 'border-gray-200 bg-gray-50'}`, children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx("h3", { className: "font-medium text-[#030213] truncate", children: productName }), isTargetReached && (_jsx("span", { className: "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800", children: "Target Reached" }))] }), _jsx("p", { className: "text-sm text-[#717182]", children: platform })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-xs text-[#717182]", children: isActive ? 'Active' : 'Inactive' }), _jsx("button", { onClick: () => onToggleActive(id), className: `relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isActive ? 'bg-blue-600' : 'bg-gray-300'}`, children: _jsx("span", { className: `inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'}` }) })] }), _jsx("button", { onClick: () => onDelete(id), className: "p-2 hover:bg-[#d4183d]/10 hover:text-[#d4183d] rounded transition-colors", children: _jsx(Trash2, { size: 16 }) })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "text-xs text-[#717182] uppercase tracking-wide", children: "Current Price" }), _jsx("p", { className: "text-lg font-semibold text-[#030213]", children: _jsx(PriceDisplay, { priceUSD: currentPrice, selectedCurrency: "USD" }) })] }), _jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "text-xs text-[#717182] uppercase tracking-wide", children: "Target Price" }), _jsx("p", { className: "text-lg font-semibold text-[#030213]", children: _jsx(PriceDisplay, { priceUSD: targetPrice, selectedCurrency: "USD" }) })] })] }), _jsxs("div", { className: "space-y-2", children: [isTargetReached ? (_jsxs("div", { className: "flex items-center gap-2 p-3 bg-green-100 rounded-lg", children: [_jsx(Target, { className: "text-green-600", size: 16 }), _jsx("span", { className: "text-sm font-medium text-green-800", children: "Target price reached!" })] })) : (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm text-[#717182]", children: isAboveTarget ? 'Above target by' : 'Below target by' }), _jsxs("div", { className: `flex items-center gap-1 text-sm font-medium ${isAboveTarget ? 'text-red-600' : 'text-green-600'}`, children: [isAboveTarget ? _jsx(TrendingUp, { size: 14 }) : _jsx(TrendingDown, { size: 14 }), _jsx(PriceDisplay, { priceUSD: Math.abs(priceDifference), selectedCurrency: "USD" })] })] }), _jsx("div", { className: "relative", children: _jsx("div", { className: "w-full bg-[#ececf0] rounded-full h-2", children: _jsx("div", { className: `h-2 rounded-full transition-all duration-300 ${isAboveTarget ? 'bg-red-500' : 'bg-green-500'}`, style: {
                                                width: `${Math.min(Math.abs(priceDifference / targetPrice) * 100, 100)}%`
                                            } }) }) })] })), notifyOnRestock && (_jsxs("div", { className: "flex items-center gap-2 text-xs text-[#717182]", children: [_jsx(Package, { size: 12 }), _jsx("span", { children: "Restock notifications enabled" })] }))] })] }) }));
}
// Create Alert Dialog Component matching Figma design
function CreateAlertDialog({ products, onCreateAlert, user }) {
    const [open, setOpen] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState("");
    const [targetPrice, setTargetPrice] = useState("");
    const [notifyOnRestock, setNotifyOnRestock] = useState(false);
    const selectedProduct = products.find(p => p.id === selectedProductId);
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedProductId || !targetPrice) {
            return;
        }
        onCreateAlert({
            productId: selectedProductId,
            targetPrice: parseFloat(targetPrice),
            notifyOnRestock
        });
        // Reset form
        setSelectedProductId("");
        setTargetPrice("");
        setNotifyOnRestock(false);
        setOpen(false);
    };
    const handleCancel = () => {
        setSelectedProductId("");
        setTargetPrice("");
        setNotifyOnRestock(false);
        setOpen(false);
    };
    return (_jsxs(_Fragment, { children: [_jsxs("button", { onClick: () => setOpen(true), className: "flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-[0.625rem] hover:bg-blue-700 transition-colors font-medium shadow-sm", children: [_jsx(Plus, { size: 16 }), "Create Alert"] }), open && (_jsx("div", { className: "fixed inset-0 bg-[#030213] bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-[0.625rem] p-6 w-full max-w-md mx-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsx("h3", { className: "text-lg font-medium text-gray-900", children: "Create Price Alert" }), _jsx("button", { onClick: handleCancel, className: "text-gray-500 hover:text-gray-700", children: _jsx(X, { className: "w-5 h-5" }) })] }), _jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Product" }), _jsxs("select", { value: selectedProductId, onChange: (e) => setSelectedProductId(e.target.value), className: "w-full px-3 py-2 border border-gray-300 rounded-[0.625rem] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white", required: true, children: [_jsx("option", { value: "", children: "Select a product to track" }), products.map((product) => (_jsxs("option", { value: product.id, children: [product.title, " - ", product.platform, " - ", _jsx(PriceDisplay, { priceUSD: product.price, selectedCurrency: "USD" })] }, product.id)))] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: "Target Price" }), _jsxs("div", { className: "relative", children: [_jsx("span", { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-[#717182]", children: "$" }), _jsx("input", { type: "number", step: "0.01", placeholder: "0.00", value: targetPrice, onChange: (e) => setTargetPrice(e.target.value), className: "w-full pl-8 pr-3 py-2 border border-gray-300 rounded-[0.625rem] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white", required: true })] }), selectedProduct && targetPrice && (_jsxs("p", { className: "text-xs text-[#717182]", children: ["Current price: ", _jsx(PriceDisplay, { priceUSD: selectedProduct.price, selectedCurrency: "USD" }), parseFloat(targetPrice) < selectedProduct.price && (_jsxs("span", { className: "text-green-600", children: [" ", "(", _jsx(PriceDisplay, { priceUSD: selectedProduct.price - parseFloat(targetPrice), selectedCurrency: "USD" }), " below current)"] })), parseFloat(targetPrice) > selectedProduct.price && (_jsxs("span", { className: "text-red-600", children: [" ", "(", _jsx(PriceDisplay, { priceUSD: parseFloat(targetPrice) - selectedProduct.price, selectedCurrency: "USD" }), " above current)"] }))] }))] }), (user?.subscription?.tier || 'free') === 'free' && (_jsxs("div", { className: "bg-yellow-50 border border-yellow-200 rounded-md p-3 flex items-start gap-2", children: [_jsx(AlertTriangle, { className: "w-4 h-4 text-yellow-600 mt-0.5" }), _jsxs("div", { className: "text-sm text-yellow-700", children: [_jsx("p", { className: "font-medium", children: "Free Plan Limit" }), _jsxs("p", { children: ["You will only receive 1 notification per day. ", _jsx("a", { href: "/subscription", className: "underline hover:text-yellow-800", children: "Upgrade to Pro" }), " for unlimited alerts."] })] })] })), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx("input", { type: "checkbox", id: "restock", checked: notifyOnRestock, onChange: (e) => setNotifyOnRestock(e.target.checked), className: "h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" }), _jsx("label", { htmlFor: "restock", className: "text-sm text-gray-700 font-normal", children: "Notify me when restocked" })] }), _jsxs("div", { className: "flex items-center gap-2 pt-4", children: [_jsx("button", { type: "submit", disabled: !selectedProductId || !targetPrice, className: "flex-1 px-4 py-2 bg-blue-600 text-white rounded-[0.625rem] hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium", children: "Create Alert" }), _jsx("button", { type: "button", onClick: handleCancel, className: "flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-[0.625rem] hover:bg-gray-200 font-medium", children: "Cancel" })] })] })] }) }))] }));
}
export default function Alerts() {
    const [alerts, setAlerts] = useState([]);
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [sortBy, setSortBy] = useState("newest");
    const [filterBy, setFilterBy] = useState("all");
    const { getAuthHeaders, user, loading: authLoading } = useAuth();
    const { t } = useTranslation();
    const selectedCurrency = user?.preferences?.currency || 'USD';
    useEffect(() => {
        // Wait for auth to be ready before fetching data
        if (!authLoading) {
            fetchAlerts();
            fetchProducts();
        }
    }, [authLoading]);
    const fetchProducts = async () => {
        try {
            const response = await fetch('/api/products', {
                headers: getAuthHeaders(),
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
    const fetchAlerts = async () => {
        try {
            const response = await fetch('/api/alerts', {
                headers: getAuthHeaders(),
            });
            const data = await response.json();
            if (data.success) {
                // Transform the data to match our interface
                const transformedAlerts = data.data.map((alert) => ({
                    id: alert.id,
                    productId: alert.productId,
                    productName: alert.productTitle || alert.productName,
                    platform: alert.platform || 'Unknown',
                    currentPrice: alert.currentPrice,
                    targetPrice: alert.targetPrice,
                    isActive: alert.isActive,
                    isTargetReached: alert.currentPrice <= alert.targetPrice,
                    notifyOnRestock: alert.notifyOnRestock || false,
                    createdAt: alert.createdAt
                }));
                setAlerts(transformedAlerts);
            }
        }
        catch (error) {
            console.error('Error fetching alerts:', error);
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleToggleActive = async (alertId) => {
        try {
            const response = await fetch(`/api/alerts/${alertId}/toggle`, {
                method: 'PUT',
                headers: getAuthHeaders(),
            });
            const data = await response.json();
            if (data.success) {
                setAlerts(alerts.map(alert => alert.id === alertId ? { ...alert, isActive: !alert.isActive } : alert));
                toast.success('Alert updated');
            }
            else {
                toast.error('Failed to update alert');
            }
        }
        catch (error) {
            console.error('Error updating alert:', error);
            // Fallback to local state update
            setAlerts(alerts.map(alert => alert.id === alertId ? { ...alert, isActive: !alert.isActive } : alert));
            toast.success('Alert updated');
        }
    };
    const handleDeleteAlert = async (alertId) => {
        if (!confirm('Are you sure you want to delete this alert?')) {
            return;
        }
        try {
            const response = await fetch(`/api/alerts/${alertId}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });
            const data = await response.json();
            if (data.success) {
                setAlerts(alerts.filter(alert => alert.id !== alertId));
                toast.success('Alert deleted');
            }
            else {
                toast.error('Failed to delete alert');
            }
        }
        catch (error) {
            console.error('Error deleting alert:', error);
            setAlerts(alerts.filter(alert => alert.id !== alertId));
            toast.success('Alert deleted');
        }
    };
    const handleCreateAlert = async (newAlert) => {
        const selectedProduct = products.find(p => p.id === newAlert.productId);
        if (!selectedProduct) {
            toast.error('Product not found');
            return;
        }
        try {
            const response = await fetch('/api/alerts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getAuthHeaders(),
                },
                body: JSON.stringify({
                    productId: newAlert.productId,
                    targetPrice: newAlert.targetPrice,
                    notifyOnRestock: newAlert.notifyOnRestock,
                }),
            });
            const data = await response.json();
            if (data.success) {
                const alert = {
                    id: data.data.id || Date.now().toString(),
                    productId: newAlert.productId,
                    productName: selectedProduct.title,
                    platform: selectedProduct.platform,
                    currentPrice: selectedProduct.price,
                    targetPrice: newAlert.targetPrice,
                    isActive: true,
                    isTargetReached: selectedProduct.price <= newAlert.targetPrice,
                    notifyOnRestock: newAlert.notifyOnRestock,
                    createdAt: new Date().toISOString(),
                };
                setAlerts([alert, ...alerts]);
                toast.success('Alert created successfully!');
            }
            else {
                console.error('Alert creation failed:', data);
                toast.error(data.message || 'Failed to create alert');
            }
        }
        catch (error) {
            console.error('Error creating alert:', error);
            toast.error('Failed to create alert');
        }
    };
    const filteredAndSortedAlerts = alerts
        .filter(alert => {
        switch (filterBy) {
            case "active":
                return alert.isActive;
            case "inactive":
                return !alert.isActive;
            case "reached":
                return alert.isTargetReached;
            default:
                return true;
        }
    })
        .sort((a, b) => {
        switch (sortBy) {
            case "newest":
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            case "oldest":
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            case "price-low":
                return a.targetPrice - b.targetPrice;
            case "price-high":
                return b.targetPrice - a.targetPrice;
            default:
                return 0;
        }
    });
    const activeAlerts = alerts.filter(alert => alert.isActive).length;
    const reachedTargets = alerts.filter(alert => alert.isTargetReached && alert.isActive).length;
    if (isLoading || authLoading) {
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" }) }));
    }
    return (_jsx("div", { className: "min-h-screen bg-white p-6", children: _jsxs("div", { className: "max-w-6xl mx-auto space-y-6", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("h2", { className: "text-2xl font-medium text-gray-900", children: "Alerts" }), reachedTargets > 0 && (_jsxs("div", { className: "relative", children: [_jsx(BellRing, { className: "text-green-600", size: 20 }), _jsx("span", { className: "absolute -top-1 -right-1 bg-green-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center", children: reachedTargets })] }))] }), _jsxs("div", { className: "flex items-center gap-4 text-sm text-[#717182]", children: [_jsxs("span", { children: [alerts.length, " total alerts"] }), _jsxs("span", { children: [activeAlerts, " active"] }), reachedTargets > 0 && (_jsxs("span", { className: "text-green-600 font-medium", children: [reachedTargets, " target", reachedTargets === 1 ? '' : 's', " reached"] }))] })] }), _jsx(CreateAlertDialog, { products: products, onCreateAlert: handleCreateAlert, user: user })] }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-4", children: [_jsxs("div", { className: "relative", children: [_jsx(Filter, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#717182]" }), _jsxs("select", { value: filterBy, onChange: (e) => setFilterBy(e.target.value), className: "w-full sm:w-48 pl-10 pr-4 py-2 border border-gray-300 rounded-[0.625rem] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white", children: [_jsx("option", { value: "all", children: "All Alerts" }), _jsx("option", { value: "active", children: "Active Only" }), _jsx("option", { value: "inactive", children: "Inactive Only" }), _jsx("option", { value: "reached", children: "Target Reached" })] })] }), _jsxs("div", { className: "relative", children: [_jsx(ArrowUpDown, { className: "absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#717182]" }), _jsxs("select", { value: sortBy, onChange: (e) => setSortBy(e.target.value), className: "w-full sm:w-48 pl-10 pr-4 py-2 border border-gray-300 rounded-[0.625rem] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white", children: [_jsx("option", { value: "newest", children: "Newest First" }), _jsx("option", { value: "oldest", children: "Oldest First" }), _jsx("option", { value: "price-low", children: "Target Price (Low to High)" }), _jsx("option", { value: "price-high", children: "Target Price (High to Low)" })] })] })] }), filteredAndSortedAlerts.length === 0 ? (_jsxs("div", { className: "text-center py-12", children: [_jsx(Bell, { className: "mx-auto text-[#717182] mb-4", size: 48 }), _jsx("h3", { className: "text-lg font-medium text-gray-900 mb-2", children: "No alerts found" }), _jsx("p", { className: "text-[#717182] mb-4", children: alerts.length === 0
                                ? "Create your first price alert to get notified when products reach your target price."
                                : "No alerts match your current filter criteria." })] })) : (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6", children: filteredAndSortedAlerts.map((alert) => (_jsx(AlertCard, { ...alert, onToggleActive: handleToggleActive, onDelete: handleDeleteAlert }, alert.id))) }))] }) }));
}
//# sourceMappingURL=Alerts.js.map