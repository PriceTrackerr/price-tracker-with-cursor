import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Filter, ExternalLink, AlertTriangle, Zap, Bell, Activity, ArrowUpRight, ArrowDownRight, Minus, Check } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';
import { useAuth } from '../components/AuthContext';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
const platformColors = {
    amazon: "bg-orange-100 text-orange-800 border-orange-200",
    ebay: "bg-blue-100 text-blue-800 border-blue-200",
    walmart: "bg-yellow-100 text-yellow-800 border-yellow-200",
    aliexpress: "bg-red-100 text-red-800 border-red-200",
    shein: "bg-purple-100 text-purple-800 border-purple-200"
};
export default function History() {
    const { t } = useTranslation();
    const { getAuthHeaders, user } = useAuth();
    const location = useLocation();
    const selectedCurrency = user?.preferences?.currency || 'USD';
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [timeRange, setTimeRange] = useState('7d');
    const [chartType, setChartType] = useState('line');
    const [loading, setLoading] = useState(true);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('date');
    const [priceHistory, setPriceHistory] = useState([]);
    const [showPriceDropAlert, setShowPriceDropAlert] = useState(true);
    const [checkedProducts, setCheckedProducts] = useState(new Set());
    const [seenPriceDropIds, setSeenPriceDropIds] = useState([]);
    // Handle URL parameters for notifications and highlighting
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const highlightParam = params.get('highlight');
        const selectedProductParam = params.get('selectedProduct');
        if (selectedProductParam && products.length > 0) {
            // Check if the product exists in our products list
            const productExists = products.find(p => p.id === selectedProductParam);
            if (productExists) {
                setSelectedProduct(selectedProductParam);
            }
        }
        if (highlightParam) {
            // Highlight products with price drops (excluding seen ones)
            const highlightIds = highlightParam.split(',');
            const unseenHighlightIds = highlightIds.filter(id => !seenPriceDropIds.includes(id));
            setCheckedProducts(new Set(unseenHighlightIds));
        }
    }, [location.search, products, seenPriceDropIds]);
    // Remove the problematic automatic history fetching
    useEffect(() => {
        fetchProducts();
        fetchSeenPriceDrops();
    }, []);
    // Remove the automatic fetchAllProductsHistory calls
    // useEffect(() => {
    //   if (products.length > 0) {
    //     fetchAllProductsHistory();
    //   }
    // }, [products]);
    // useEffect(() => {
    //   if (products.length > 0 && allProductsHistory.length === 0) {
    //     fetchAllProductsHistory();
    //   }
    // }, [products, allProductsHistory.length]);
    useEffect(() => {
        if (selectedProduct && selectedProduct !== 'all') {
            fetchPriceHistory(selectedProduct);
        }
        else if (selectedProduct === 'all') {
            // For "all products" view, show empty or cached data
            setPriceHistory([]);
        }
        else {
            // When no product is selected, show empty
            setPriceHistory([]);
        }
    }, [selectedProduct]);
    const fetchProducts = async () => {
        try {
            const response = await fetch('/api/products', {
                headers: getAuthHeaders(),
            });
            const data = await response.json();
            if (data.success) {
                setProducts(data.data);
                // Don't set a default selected product - let user choose
            }
        }
        catch (error) {
            console.error('Error fetching products:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const fetchPriceHistory = async (productId) => {
        try {
            const response = await fetch(`/api/products/${productId}/history`, {
                headers: getAuthHeaders(),
            });
            const data = await response.json();
            if (data.success) {
                setPriceHistory(data.data);
            }
        }
        catch (error) {
            console.error('Error fetching price history:', error);
        }
    };
    // Remove the fetchAllProductsHistory function entirely
    // const fetchAllProductsHistory = async () => {
    //   try {
    //     setHistoryLoading(true);
    //     console.log('Fetching all products history...');
    //     // Fetch history for all products in parallel instead of sequentially
    //     const historyPromises = products.map(async (product) => {
    //       try {
    //         const response = await fetch(`/api/products/${product.id}/history`, {
    //           headers: getAuthHeaders(),
    //         });
    //         const data = await response.json();
    //         if (data.success) {
    //           return data.data;
    //         }
    //         return [];
    //       } catch (error) {
    //         console.error(`Error fetching history for product ${product.id}:`, error);
    //         return [];
    //       }
    //     });
    //     const allHistoryArrays = await Promise.all(historyPromises);
    //     const allHistory = allHistoryArrays.flat();
    //     console.log(`Fetched ${allHistory.length} history entries`);
    //     setPriceHistory(allHistory);
    //     setAllProductsHistory(allHistory); // Store for when no product is selected
    //   } catch (error) {
    //     console.error('Error fetching all products history:', error);
    //   } finally {
    //     setHistoryLoading(false);
    //   }
    // };
    const fetchSeenPriceDrops = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/users/seen-price-drops', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                setSeenPriceDropIds(data.data);
            }
        }
        catch (error) {
            console.error('Error fetching seen price drops:', error);
        }
    };
    const markPriceDropAsSeen = async (productId) => {
        try {
            const token = localStorage.getItem('token');
            await fetch('/api/users/mark-price-drop-seen', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ productId })
            });
            // Update local state
            setSeenPriceDropIds((prev) => [...prev, productId]);
            setCheckedProducts((prev) => {
                const newSet = new Set(prev);
                newSet.delete(productId);
                return newSet;
            });
            // Trigger a custom event to notify other components
            window.dispatchEvent(new CustomEvent('priceDropMarkedAsSeen', {
                detail: { productId }
            }));
        }
        catch (error) {
            console.error('Error marking price drop as seen:', error);
        }
    };
    const handleProductSelection = (productId) => {
        setSelectedProduct(productId);
        // If this product has a price drop and hasn't been seen yet, mark it as seen
        if (productHasPriceDrop(productId) && !seenPriceDropIds.includes(productId)) {
            markPriceDropAsSeen(productId);
        }
    };
    const filteredProducts = products.filter(product => product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.platform.toLowerCase().includes(searchTerm.toLowerCase()));
    const getPriceMetrics = () => {
        if (priceHistory.length === 0)
            return { currentPrice: 0, totalChange: 0, changePercent: 0 };
        // Sort by timestamp to get chronological order
        const sortedHistory = [...priceHistory].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        const currentPrice = sortedHistory[sortedHistory.length - 1]?.price || 0;
        const firstPrice = sortedHistory[0]?.price || currentPrice;
        const totalChange = currentPrice - firstPrice;
        const changePercent = firstPrice !== 0 ? (totalChange / firstPrice) * 100 : 0;
        return { currentPrice, totalChange, changePercent };
    };
    const metrics = getPriceMetrics();
    // Simplified price drop detection - only for selected product
    const getCurrentProductDropInfo = () => {
        if (!currentProduct || currentProductHistory.length < 2)
            return null;
        const sortedHistory = [...currentProductHistory].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        const last = sortedHistory[sortedHistory.length - 1];
        const prev = sortedHistory[sortedHistory.length - 2];
        if (!last || !prev || last.price >= prev.price)
            return null;
        const dropAmount = prev.price - last.price;
        const dropPercentage = (dropAmount / prev.price) * 100;
        return {
            dropAmount,
            dropPercentage,
            lastDropDate: new Date(last.timestamp).toLocaleDateString(),
            originalPrice: prev.price,
            currentPrice: last.price
        };
    };
    // Get current product data
    const currentProduct = selectedProduct ? products.find(p => p.id === selectedProduct) : null;
    const currentProductHistory = priceHistory.filter(h => h.productId === selectedProduct);
    // Prepare chart data
    const chartData = priceHistory.map((entry, index) => {
        const prevEntry = index > 0 ? priceHistory[index - 1] : null;
        const change = prevEntry ? entry.price - prevEntry.price : 0;
        const changePercent = prevEntry && prevEntry.price !== 0 ? (change / prevEntry.price) * 100 : 0;
        return {
            date: new Date(entry.timestamp).toLocaleDateString(),
            price: entry.price,
            change,
            changePercent,
            isPositive: change < 0
        };
    });
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (_jsxs("div", { className: "bg-white border border-gray-200 rounded-lg p-3 shadow-lg", children: [_jsx("p", { className: "text-sm text-gray-600", children: label }), _jsxs("p", { className: "text-sm font-medium", children: ["Price: ", _jsxs("span", { className: "text-blue-600", children: ["$", payload[0].value.toFixed(2)] })] })] }));
        }
        return null;
    };
    const renderChart = () => {
        if (chartData.length === 0) {
            return (_jsx("div", { className: "flex items-center justify-center h-96 text-gray-500", children: _jsx("p", { children: "No price history data available" }) }));
        }
        const commonProps = {
            data: chartData,
            margin: { top: 20, right: 30, left: 20, bottom: 5 }
        };
        switch (chartType) {
            case "area":
                return (_jsxs(AreaChart, { ...commonProps, children: [_jsx("defs", { children: _jsxs("linearGradient", { id: "priceGradient", x1: "0", y1: "0", x2: "0", y2: "1", children: [_jsx("stop", { offset: "5%", stopColor: "#3b82f6", stopOpacity: 0.3 }), _jsx("stop", { offset: "95%", stopColor: "#3b82f6", stopOpacity: 0.01 })] }) }), _jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#f1f5f9" }), _jsx(XAxis, { dataKey: "date", axisLine: false, tickLine: false, tick: { fontSize: 12, fill: '#64748b' } }), _jsx(YAxis, { axisLine: false, tickLine: false, tick: { fontSize: 12, fill: '#64748b' }, domain: ['dataMin - 10', 'dataMax + 10'] }), _jsx(Tooltip, { contentStyle: {
                                backgroundColor: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
                            } }), _jsx(Area, { type: "monotone", dataKey: "price", stroke: "#3b82f6", strokeWidth: 3, fill: "url(#priceGradient)", dot: { fill: '#3b82f6', strokeWidth: 2, r: 4 }, activeDot: { r: 6, fill: '#3b82f6' } })] }));
            case "bar":
                return (_jsxs(BarChart, { ...commonProps, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#f1f5f9" }), _jsx(XAxis, { dataKey: "date", axisLine: false, tickLine: false, tick: { fontSize: 12, fill: '#64748b' } }), _jsx(YAxis, { axisLine: false, tickLine: false, tick: { fontSize: 12, fill: '#64748b' }, domain: ['dataMin - 10', 'dataMax + 10'] }), _jsx(Tooltip, { contentStyle: {
                                backgroundColor: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
                            } }), _jsx(Bar, { dataKey: "price", fill: "#3b82f6", radius: [4, 4, 0, 0] })] }));
            default:
                return (_jsxs(LineChart, { ...commonProps, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "#f1f5f9" }), _jsx(XAxis, { dataKey: "date", axisLine: false, tickLine: false, tick: { fontSize: 12, fill: '#64748b' } }), _jsx(YAxis, { axisLine: false, tickLine: false, tick: { fontSize: 12, fill: '#64748b' }, domain: ['dataMin - 10', 'dataMax + 10'] }), _jsx(Tooltip, { contentStyle: {
                                backgroundColor: 'white',
                                border: 'none',
                                borderRadius: '12px',
                                boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
                            } }), _jsx(Line, { type: "monotone", dataKey: "price", stroke: "#3b82f6", strokeWidth: 3, dot: { fill: '#3b82f6', strokeWidth: 2, r: 4 }, activeDot: { r: 6, fill: '#3b82f6' } })] }));
        }
    };
    const getChangeIcon = (change) => {
        if (change > 0)
            return _jsx(ArrowUpRight, { className: "w-4 h-4" });
        if (change < 0)
            return _jsx(ArrowDownRight, { className: "w-4 h-4" });
        return _jsx(Minus, { className: "w-4 h-4" });
    };
    const getChangeColor = (change) => {
        if (change > 0)
            return "text-red-600";
        if (change < 0)
            return "text-green-600";
        return "text-gray-600";
    };
    // Check if current product has a price drop
    const currentProductHasDrop = () => {
        if (!currentProduct || currentProductHistory.length < 2)
            return false;
        const sortedHistory = [...currentProductHistory].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        const last = sortedHistory[sortedHistory.length - 1];
        const prev = sortedHistory[sortedHistory.length - 2];
        return last && prev && last.price < prev.price;
    };
    // Check if a product has price drops for dropdown highlighting
    const productHasPriceDrop = (productId) => {
        // Get price history from the global data instead of local state
        const product = products.find(p => p.id === productId);
        const productHistory = product?.priceHistory || [];
        if (productHistory.length < 2)
            return false;
        const sortedHistory = productHistory.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        const last = sortedHistory[sortedHistory.length - 1];
        const prev = sortedHistory[sortedHistory.length - 2];
        return last && prev && last.price < prev.price;
    };
    // Get products with price drops that haven't been seen
    const getUnseenProductsWithDrops = () => {
        return products.filter(product => productHasPriceDrop(product.id) && !seenPriceDropIds.includes(product.id));
    };
    // Handle product check (countdown functionality)
    const handleProductCheck = (productId) => {
        setCheckedProducts(prev => {
            const newSet = new Set(prev);
            newSet.add(productId);
            return newSet;
        });
    };
    if (loading) {
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" }) }));
    }
    if (historyLoading) {
        return (_jsx("div", { className: "flex items-center justify-center h-64", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" }), _jsx("p", { className: "text-gray-600", children: "Loading price history..." })] }) }));
    }
    return (_jsxs("div", { className: "space-y-8", children: [(() => {
                const unseenProductsWithDrops = getUnseenProductsWithDrops();
                if (unseenProductsWithDrops.length > 0 && showPriceDropAlert) {
                    return (_jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-emerald-600/20 via-green-600/20 to-teal-600/20 rounded-2xl blur-xl opacity-60" }), _jsxs("div", { className: "relative border-0 bg-gradient-to-r from-emerald-50 to-green-50 backdrop-blur-sm shadow-2xl shadow-emerald-500/10 rounded-2xl overflow-hidden", children: [_jsx("div", { className: "absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-green-400/20 rounded-full blur-2xl" }), _jsx("div", { className: "relative p-6", children: _jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex items-start gap-4", children: [_jsx("div", { className: "w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center animate-pulse", children: _jsx(Zap, { className: "w-6 h-6 text-white" }) }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx("h3", { className: "text-xl font-bold text-emerald-900", children: "\uD83D\uDD25 Hot Price Drops Detected!" }), _jsxs("span", { className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-300 animate-bounce", children: [unseenProductsWithDrops.length, " products"] })] }), _jsx("p", { className: "text-emerald-700 mb-4", children: "Don't miss these amazing deals! Products with significant price reductions." }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto", children: unseenProductsWithDrops.map((product) => {
                                                                        const productHistory = product.priceHistory || [];
                                                                        const sortedHistory = productHistory.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
                                                                        const last = sortedHistory[sortedHistory.length - 1];
                                                                        const prev = sortedHistory[sortedHistory.length - 2];
                                                                        const dropAmount = prev.price - last.price;
                                                                        const dropPercent = ((dropAmount / prev.price) * 100).toFixed(1);
                                                                        return (_jsxs("div", { className: "flex items-center gap-3 p-3 bg-white/60 backdrop-blur-sm rounded-xl border border-emerald-200/50 hover:bg-white/80 transition-all cursor-pointer group", onClick: () => handleProductSelection(product.id), children: [_jsx("div", { className: "w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center", children: _jsx(TrendingDown, { className: "w-4 h-4 text-emerald-600" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "font-semibold text-emerald-900 text-sm truncate", children: product.title }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("span", { className: "text-emerald-700 font-medium text-sm", children: ["$", last.price] }), _jsxs("span", { className: "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-300", children: ["-", dropPercent, "%"] })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("button", { onClick: (e) => {
                                                                                                e.stopPropagation();
                                                                                                markPriceDropAsSeen(product.id);
                                                                                            }, className: "w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center hover:bg-emerald-200 transition-colors opacity-0 group-hover:opacity-100", title: "Mark as seen", children: _jsx(Check, { className: "w-3 h-3 text-emerald-600" }) }), _jsx(ExternalLink, { className: "w-4 h-4 text-emerald-600" })] })] }, product.id));
                                                                    }) }), unseenProductsWithDrops.length > 6 && (_jsx("div", { className: "text-center mt-3", children: _jsxs("span", { className: "text-emerald-600 text-sm font-medium", children: ["+", unseenProductsWithDrops.length - 6, " more products with price drops"] }) }))] })] }), _jsx("button", { onClick: () => setShowPriceDropAlert(false), className: "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 p-2 rounded-lg transition-colors", children: "\u00D7" })] }) })] })] }));
                }
                return null;
            })(), _jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-cyan-600/10 rounded-3xl blur-xl opacity-50" }), _jsx("div", { className: "relative border-0 bg-white/80 backdrop-blur-xl shadow-2xl shadow-blue-500/10 rounded-2xl p-6", children: _jsxs("div", { className: "flex flex-col lg:flex-row lg:items-center justify-between gap-6", children: [_jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center", children: _jsx(Activity, { className: "w-6 h-6 text-white" }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Price Analytics" }), _jsx("p", { className: "text-gray-600", children: "Advanced price tracking & insights" })] })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Filter, { className: "w-4 h-4 text-gray-500" }), _jsx("span", { className: "text-sm text-gray-600", children: "Filters:" })] }), _jsxs("div", { className: "relative", children: [_jsxs("select", { value: selectedProduct, onChange: (e) => handleProductSelection(e.target.value), className: "w-48 px-3 py-2 border-0 bg-gray-50/50 backdrop-blur-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none", children: [_jsx("option", { value: "", children: "Select Product" }), _jsx("option", { value: "all", children: "All Products" }), [...products]
                                                            .sort((a, b) => {
                                                            const aHasDrop = productHasPriceDrop(a.id) && !seenPriceDropIds.includes(a.id);
                                                            const bHasDrop = productHasPriceDrop(b.id) && !seenPriceDropIds.includes(b.id);
                                                            // Sort: price drops first, then alphabetically
                                                            if (aHasDrop && !bHasDrop)
                                                                return -1;
                                                            if (!aHasDrop && bHasDrop)
                                                                return 1;
                                                            return a.title.localeCompare(b.title);
                                                        })
                                                            .map((product) => (_jsxs("option", { value: product.id, className: `truncate ${checkedProducts.has(product.id)
                                                                ? 'text-green-600 font-semibold bg-green-50'
                                                                : productHasPriceDrop(product.id) && !seenPriceDropIds.includes(product.id)
                                                                    ? 'text-orange-600 font-semibold'
                                                                    : ''}`, children: [product.title.length > 30 ? product.title.substring(0, 30) + '...' : product.title, checkedProducts.has(product.id) && ' 🎯', productHasPriceDrop(product.id) && !checkedProducts.has(product.id) && !seenPriceDropIds.includes(product.id) && ' 🔥'] }, product.id)))] }), _jsx("div", { className: "absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none", children: _jsx("svg", { className: "w-4 h-4 text-gray-400", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M19 9l-7 7-7-7" }) }) })] }), _jsxs("select", { value: timeRange, onChange: (e) => setTimeRange(e.target.value), className: "w-32 px-3 py-2 border-0 bg-gray-50/50 backdrop-blur-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "7d", children: "7 Days" }), _jsx("option", { value: "30d", children: "30 Days" }), _jsx("option", { value: "90d", children: "90 Days" }), _jsx("option", { value: "1y", children: "1 Year" })] }), _jsxs("select", { value: chartType, onChange: (e) => setChartType(e.target.value), className: "w-32 px-3 py-2 border-0 bg-gray-50/50 backdrop-blur-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500", children: [_jsx("option", { value: "line", children: "Line" }), _jsx("option", { value: "area", children: "Area" }), _jsx("option", { value: "bar", children: "Bar" })] })] })] }) })] }), currentProduct && getCurrentProductDropInfo() && (_jsx("div", { className: "border-0 bg-gradient-to-r from-amber-50 to-yellow-50 shadow-lg border-l-4 border-l-amber-400 rounded-xl p-4", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center", children: _jsx(AlertTriangle, { className: "w-5 h-5 text-amber-600" }) }), _jsxs("div", { className: "flex-1", children: [_jsxs("h4", { className: "font-semibold text-amber-900", children: ["Price Drop Alert for ", currentProduct.title] }), _jsxs("p", { className: "text-amber-700 text-sm", children: ["Dropped $", getCurrentProductDropInfo()?.dropAmount.toFixed(2), " (", getCurrentProductDropInfo()?.dropPercentage.toFixed(1), "%) since ", getCurrentProductDropInfo()?.lastDropDate] })] }), _jsxs("div", { className: "text-right", children: [_jsxs("p", { className: "text-2xl font-bold text-amber-900", children: ["$", getCurrentProductDropInfo()?.currentPrice] }), _jsxs("p", { className: "text-sm text-amber-600 line-through", children: ["$", getCurrentProductDropInfo()?.originalPrice] })] })] }) })), currentProduct && checkedProducts.has(currentProduct.id) && (_jsx("div", { className: "border-0 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg border-l-4 border-l-green-400 rounded-xl p-4 mb-6", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 bg-green-100 rounded-full flex items-center justify-center", children: _jsx(Bell, { className: "w-5 h-5 text-green-600" }) }), _jsxs("div", { className: "flex-1", children: [_jsx("h4", { className: "font-semibold text-green-900", children: "Notification Product Selected" }), _jsx("p", { className: "text-green-700 text-sm", children: "This product was selected from your notifications. View the price trend below." })] }), _jsx("div", { className: "text-right", children: _jsx("span", { className: "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800", children: "\uD83C\uDFAF Selected" }) })] }) })), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [_jsx("div", { className: "border-0 bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-2xl", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-blue-600 font-medium", children: "Current Price" }), _jsxs("p", { className: "text-3xl font-bold text-blue-900", children: ["$", metrics.currentPrice.toFixed(2)] })] }), _jsx("div", { className: "w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center", children: _jsx(TrendingDown, { className: "w-6 h-6 text-blue-600" }) })] }) }), _jsx("div", { className: "border-0 bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-2xl", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-green-600 font-medium", children: "Total Change" }), _jsxs("p", { className: "text-3xl font-bold text-green-900", children: ["$", Math.abs(metrics.totalChange).toFixed(2)] })] }), _jsx("div", { className: "w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center", children: _jsx(TrendingDown, { className: "w-6 h-6 text-green-600" }) })] }) }), _jsx("div", { className: "border-0 bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm text-purple-600 font-medium", children: "Change %" }), _jsxs("p", { className: `text-3xl font-bold ${metrics.totalChange < 0 ? 'text-green-900' : 'text-red-900'}`, children: [metrics.changePercent.toFixed(1), "%"] })] }), _jsx("div", { className: "w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center", children: metrics.totalChange < 0 ? (_jsx(TrendingDown, { className: "w-6 h-6 text-green-600" })) : (_jsx(TrendingUp, { className: "w-6 h-6 text-red-600" })) })] }) })] }), _jsxs("div", { className: "border-0 shadow-2xl shadow-gray-200/20 rounded-2xl overflow-hidden", children: [_jsx("div", { className: "bg-gradient-to-r from-gray-50 to-blue-50/30 p-6 border-b border-gray-100", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-xl font-bold text-gray-900", children: "Price Trend Analysis" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-3 h-3 bg-blue-500 rounded-full" }), _jsx("span", { className: "text-sm text-gray-600", children: currentProduct?.title || 'Select a product' }), currentProduct && currentProductHasDrop() && (_jsx("span", { className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 animate-pulse", children: "Price Drop!" }))] })] }) }), _jsx("div", { className: "p-6", children: _jsx("div", { className: "h-96", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: renderChart() }) }) })] }), _jsxs("div", { className: "border-0 shadow-2xl shadow-gray-200/20 rounded-2xl overflow-hidden", children: [_jsx("div", { className: "bg-gradient-to-r from-gray-50 to-blue-50/30 p-6 border-b border-gray-100", children: _jsx("h3", { className: "text-xl font-bold text-gray-900", children: "Price History Details" }) }), _jsx("div", { className: "p-6", children: _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b border-gray-200", children: [_jsx("th", { className: "text-left py-3 px-4 font-semibold text-gray-700", children: "Date" }), _jsx("th", { className: "text-left py-3 px-4 font-semibold text-gray-700", children: "Price" }), _jsx("th", { className: "text-left py-3 px-4 font-semibold text-gray-700", children: "Change" }), _jsx("th", { className: "text-left py-3 px-4 font-semibold text-gray-700", children: "Change %" }), _jsx("th", { className: "text-left py-3 px-4 font-semibold text-gray-700", children: "Status" })] }) }), _jsx("tbody", { children: chartData.map((entry, index) => (_jsxs("tr", { className: "border-b border-gray-100 hover:bg-gray-50", children: [_jsx("td", { className: "py-3 px-4 text-gray-700", children: entry.date }), _jsxs("td", { className: "py-3 px-4 font-medium text-gray-900", children: ["$", entry.price.toFixed(2)] }), _jsxs("td", { className: `py-3 px-4 flex items-center gap-1 ${getChangeColor(entry.change)}`, children: [getChangeIcon(entry.change), _jsxs("span", { children: ["$", Math.abs(entry.change).toFixed(2)] })] }), _jsxs("td", { className: `py-3 px-4 ${getChangeColor(entry.change)}`, children: [entry.changePercent.toFixed(1), "%"] }), _jsx("td", { className: "py-3 px-4", children: entry.change < 0 ? (_jsxs("span", { className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800", children: [_jsx(TrendingDown, { className: "w-3 h-3 mr-1" }), "Drop"] })) : entry.change > 0 ? (_jsxs("span", { className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800", children: [_jsx(TrendingUp, { className: "w-3 h-3 mr-1" }), "Rise"] })) : (_jsxs("span", { className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800", children: [_jsx(Minus, { className: "w-3 h-3 mr-1" }), "Stable"] })) })] }, index))) })] }) }) })] })] }));
}
//# sourceMappingURL=History.js.map