import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import { Menu, X, LogIn, Chrome, Play, CheckCircle, TrendingDown, Bell, Shield, Zap, Star, Globe, Download, ArrowRight, ShoppingCart, DollarSign, Clock, Users, Award } from 'lucide-react';
const DEFAULT_LANDING_PLANS = [
    {
        id: 'basic_monthly',
        name: 'Basic Monthly',
        price: 3,
        currency: 'USD',
        interval: 'monthly',
        features: {
            maxTrackedProducts: 50,
            alertFrequency: 'daily',
            priceHistoryDays: 60,
            exportData: false,
            prioritySupport: false,
        },
    },
    {
        id: 'basic_yearly',
        name: 'Basic Yearly',
        price: 30,
        currency: 'USD',
        interval: 'yearly',
        features: {
            maxTrackedProducts: 50,
            alertFrequency: 'daily',
            priceHistoryDays: 60,
            exportData: false,
            prioritySupport: false,
        },
    },
    {
        id: 'premium_monthly',
        name: 'Premium Monthly',
        price: 8,
        currency: 'USD',
        interval: 'monthly',
        features: {
            maxTrackedProducts: 200,
            alertFrequency: 'instant',
            priceHistoryDays: 365,
            exportData: true,
            prioritySupport: true,
        },
    },
    {
        id: 'premium_yearly',
        name: 'Premium Yearly',
        price: 80,
        currency: 'USD',
        interval: 'yearly',
        features: {
            maxTrackedProducts: 200,
            alertFrequency: 'instant',
            priceHistoryDays: 365,
            exportData: true,
            prioritySupport: true,
        },
    },
];
function PricingCard({ title, isPopular, monthlyPrice, yearlyPrice, features, buttonText, buttonColor }) {
    const { user } = useAuth();
    const [isYearly, setIsYearly] = useState(false);
    const currentPrice = isYearly ? yearlyPrice : monthlyPrice;
    const savings = isYearly ? Math.round((monthlyPrice * 12 - yearlyPrice) / (monthlyPrice * 12) * 100) : 0;
    const getBorderColor = () => {
        if (isPopular)
            return 'border-blue-500';
        return 'border-gray-200';
    };
    const getButtonClasses = () => {
        if (buttonColor === 'blue') {
            return 'w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors block text-center';
        }
        return 'w-full bg-gray-900 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-800 transition-colors block text-center';
    };
    const getPriceColor = () => {
        if (buttonColor === 'blue')
            return 'text-blue-600';
        return 'text-gray-900';
    };
    return (_jsxs("div", { className: `bg-white rounded-2xl shadow-lg p-8 border-2 ${getBorderColor()} relative`, children: [isPopular && (_jsx("div", { className: "absolute -top-4 left-1/2 transform -translate-x-1/2", children: _jsx("span", { className: "bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-semibold", children: "Most Popular" }) })), _jsxs("div", { className: "text-center mb-6", children: [_jsx("h3", { className: "text-2xl font-bold text-gray-900 mb-2", children: title }), _jsxs("div", { className: "flex items-center justify-center gap-4 mb-4", children: [_jsx("span", { className: `text-sm ${!isYearly ? 'text-gray-900 font-semibold' : 'text-gray-500'}`, children: "Monthly" }), _jsx("button", { onClick: () => setIsYearly(!isYearly), className: `relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isYearly ? 'bg-blue-600' : 'bg-gray-200'}`, children: _jsx("span", { className: `inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isYearly ? 'translate-x-6' : 'translate-x-1'}` }) }), _jsx("span", { className: `text-sm ${isYearly ? 'text-gray-900 font-semibold' : 'text-gray-500'}`, children: "Yearly" })] }), _jsxs("div", { className: `text-4xl font-bold ${getPriceColor()} mb-2`, children: ["$", currentPrice, _jsxs("span", { className: "text-lg text-gray-500", children: ["/", isYearly ? 'year' : 'month'] })] }), isYearly && savings > 0 && (_jsxs("p", { className: "text-green-600 font-semibold text-sm", children: ["Save ", savings, "% with yearly billing"] }))] }), _jsx("ul", { className: "space-y-4 mb-8", children: features.map((feature, index) => (_jsxs("li", { className: "flex items-center", children: [_jsx(CheckCircle, { className: "w-5 h-5 text-green-500 mr-3" }), _jsx("span", { children: feature })] }, index))) }), _jsx(Link, { to: user ? "/dashboard" : "/auth", className: getButtonClasses(), children: buttonText })] }));
}
// Navigation Component
function Navigation() {
    const { user } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    return (_jsx("nav", { className: "fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200", children: _jsxs("div", { className: "max-w-6xl mx-auto px-4", children: [_jsxs("div", { className: "flex items-center justify-between h-16", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 bg-[#2563EB] rounded-lg flex items-center justify-center shadow-sm", children: _jsxs("svg", { width: "24", height: "24", viewBox: "0 0 100 100", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [_jsx("rect", { x: "0", y: "0", width: "100", height: "100", rx: "20", fill: "#2563EB" }), _jsx("path", { d: "M25 70 C35 50, 65 50, 75 30", stroke: "white", strokeWidth: "8", strokeLinecap: "round", strokeLinejoin: "round" }), _jsx("circle", { cx: "75", cy: "30", r: "6", fill: "white" })] }) }), _jsx("span", { className: "text-xl font-bold text-gray-900", children: "Price Tracker" })] }), _jsxs("div", { className: "hidden md:flex items-center gap-8", children: [_jsx("a", { href: "#features", className: "text-gray-600 hover:text-gray-900 transition-colors", children: "Features" }), _jsx("a", { href: "#how-it-works", className: "text-gray-600 hover:text-gray-900 transition-colors", children: "How It Works" }), _jsx("a", { href: "#pricing", className: "text-gray-600 hover:text-gray-900 transition-colors", children: "Pricing" }), _jsx("a", { href: "#faq", className: "text-gray-600 hover:text-gray-900 transition-colors", children: "FAQ" })] }), _jsx("div", { className: "hidden md:flex items-center gap-4", children: user ? (_jsxs(_Fragment, { children: [_jsxs(Link, { to: "/dashboard", className: "text-gray-600 hover:text-gray-900 transition-colors flex items-center", children: [_jsx(LogIn, { className: "w-4 h-4 mr-2" }), "Dashboard"] }), _jsx(Link, { to: "/dashboard", className: "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors", children: "Go to Dashboard" })] })) : (_jsxs(_Fragment, { children: [_jsxs(Link, { to: "/auth", className: "text-gray-600 hover:text-gray-900 transition-colors flex items-center", children: [_jsx(LogIn, { className: "w-4 h-4 mr-2" }), "Login"] }), _jsx(Link, { to: "/auth", className: "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors", children: "Get Started" })] })) }), _jsx("button", { className: "md:hidden p-2", onClick: () => setIsMenuOpen(!isMenuOpen), "aria-label": "Toggle menu", children: isMenuOpen ? (_jsx(X, { className: "w-6 h-6 text-gray-600" })) : (_jsx(Menu, { className: "w-6 h-6 text-gray-600" })) })] }), isMenuOpen && (_jsx("div", { className: "md:hidden py-4 border-t border-gray-200 bg-white", children: _jsxs("div", { className: "space-y-4", children: [_jsx("a", { href: "#features", className: "block text-gray-600 hover:text-gray-900 transition-colors", onClick: () => setIsMenuOpen(false), children: "Features" }), _jsx("a", { href: "#how-it-works", className: "block text-gray-600 hover:text-gray-900 transition-colors", onClick: () => setIsMenuOpen(false), children: "How It Works" }), _jsx("a", { href: "#pricing", className: "block text-gray-600 hover:text-gray-900 transition-colors", onClick: () => setIsMenuOpen(false), children: "Pricing" }), _jsx("a", { href: "#faq", className: "block text-gray-600 hover:text-gray-900 transition-colors", onClick: () => setIsMenuOpen(false), children: "FAQ" }), _jsx("div", { className: "pt-4 border-t border-gray-200 space-y-2", children: user ? (_jsxs(_Fragment, { children: [_jsxs(Link, { to: "/dashboard", className: "block text-gray-600 hover:text-gray-900 transition-colors flex items-center", children: [_jsx(LogIn, { className: "w-4 h-4 mr-2" }), "Dashboard"] }), _jsx(Link, { to: "/dashboard", className: "block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-center", children: "Go to Dashboard" })] })) : (_jsxs(_Fragment, { children: [_jsxs(Link, { to: "/auth", className: "block text-gray-600 hover:text-gray-900 transition-colors flex items-center", children: [_jsx(LogIn, { className: "w-4 h-4 mr-2" }), "Login"] }), _jsx(Link, { to: "/auth", className: "block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-center", children: "Get Started" })] })) })] }) }))] }) }));
}
// Hero Section Component
function HeroSection() {
    return (_jsx("section", { className: "relative bg-gradient-to-br from-blue-50 to-indigo-100 py-16 sm:py-20 px-4 overflow-hidden", children: _jsx("div", { className: "max-w-6xl mx-auto", children: _jsxs("div", { className: "grid lg:grid-cols-2 gap-12 items-center", children: [_jsxs("div", { className: "space-y-8", children: [_jsxs("div", { className: "space-y-4", children: [_jsxs("h1", { className: "text-3xl sm:text-4xl lg:text-6xl font-bold text-gray-900 leading-tight", children: ["Track Prices Across Top Stores.", " ", _jsx("span", { className: "text-blue-600", children: "Save Big." }), " ", _jsx("span", { className: "text-indigo-600", children: "Shop Smarter." })] }), _jsx("p", { className: "text-base sm:text-lg lg:text-xl text-gray-600 leading-relaxed", children: "Your ultimate price tracking solution for AliExpress, eBay, Amazon, Shein, and Walmart. Get alerts, see history, and never miss a deal." })] }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-3 sm:gap-4", children: [_jsxs("button", { className: "bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-4 sm:py-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-2", onClick: () => window.open('https://chrome.google.com/webstore', '_blank'), children: [_jsx(Chrome, { className: "w-5 h-5" }), "Add to Chrome (It's Free!)"] }), _jsxs("button", { className: "px-6 sm:px-8 py-4 sm:py-6 rounded-xl border-2 border-gray-300 hover:border-blue-600 transition-all duration-300 flex items-center justify-center gap-2", onClick: () => {
                                            document.getElementById('how-it-works')?.scrollIntoView({
                                                behavior: 'smooth'
                                            });
                                        }, children: [_jsx(Play, { className: "w-5 h-5" }), "See How It Works"] })] }), _jsxs("div", { className: "flex items-center gap-6 text-sm text-gray-600", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-2 h-2 bg-green-500 rounded-full" }), _jsx("span", { children: "100% Free to Use" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-2 h-2 bg-green-500 rounded-full" }), _jsx("span", { children: "No Registration Required" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-2 h-2 bg-green-500 rounded-full" }), _jsx("span", { children: "Privacy Focused" })] })] })] }), _jsx("div", { className: "relative", children: _jsxs("div", { className: "bg-white rounded-3xl shadow-2xl p-6 sm:p-8 transform rotate-3 hover:rotate-0 transition-transform duration-500", children: [_jsx("div", { className: "w-full h-64 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-2xl flex items-center justify-center", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-16 h-16 bg-[#2563EB] rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg", children: _jsxs("svg", { width: "32", height: "32", viewBox: "0 0 100 100", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [_jsx("rect", { x: "0", y: "0", width: "100", height: "100", rx: "20", fill: "#2563EB" }), _jsx("path", { d: "M25 70 C35 50, 65 50, 75 30", stroke: "white", strokeWidth: "8", strokeLinecap: "round", strokeLinejoin: "round" }), _jsx("circle", { cx: "75", cy: "30", r: "6", fill: "white" })] }) }), _jsx("p", { className: "text-gray-600 font-medium", children: "Price Tracker Dashboard" })] }) }), _jsxs("div", { className: "mt-4 space-y-2", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("span", { className: "text-sm font-medium text-gray-600", children: "Today's Savings" }), _jsx("span", { className: "text-2xl font-bold text-green-600", children: "$247.32" })] }), _jsx("div", { className: "w-full bg-gray-200 rounded-full h-2", children: _jsx("div", { className: "bg-green-500 h-2 rounded-full w-3/4" }) })] })] }) })] }) }) }));
}
// Multi-Store Section Component
function MultiStoreSection() {
    return (_jsx("section", { className: "py-20 bg-white", children: _jsxs("div", { className: "max-w-6xl mx-auto px-4", children: [_jsxs("div", { className: "text-center mb-16", children: [_jsx("h2", { className: "text-4xl font-bold text-gray-900 mb-4", children: "Track Prices Across All Major Stores" }), _jsx("p", { className: "text-xl text-gray-600 max-w-2xl mx-auto", children: "One extension works everywhere. No need to visit multiple sites or apps." })] }), _jsx("div", { className: "grid md:grid-cols-2 lg:grid-cols-5 gap-8", children: [
                        { name: 'Amazon', icon: '🛒', color: 'bg-orange-100' },
                        { name: 'AliExpress', icon: '📦', color: 'bg-red-100' },
                        { name: 'eBay', icon: '🏷️', color: 'bg-blue-100' },
                        { name: 'Walmart', icon: '🛍️', color: 'bg-green-100' },
                        { name: 'Shein', icon: '👗', color: 'bg-purple-100' }
                    ].map((store) => (_jsxs("div", { className: "text-center", children: [_jsx("div", { className: `w-16 h-16 ${store.color} rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl`, children: store.icon }), _jsx("h3", { className: "text-lg font-semibold text-gray-900", children: store.name })] }, store.name))) })] }) }));
}
// Multi-Language Section Component
function MultiLanguageSection() {
    return (_jsx("section", { className: "py-20 bg-gray-50", children: _jsx("div", { className: "max-w-6xl mx-auto px-4", children: _jsxs("div", { className: "grid lg:grid-cols-2 gap-12 items-center", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-4xl font-bold text-gray-900 mb-6", children: "Available in Multiple Languages" }), _jsx("p", { className: "text-xl text-gray-600 mb-8", children: "Use Price Tracker in your preferred language. We support English, Spanish, French, German, and more." }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsx(Globe, { className: "w-6 h-6 text-blue-600" }), _jsx("span", { className: "text-gray-600", children: "12+ Languages Supported" })] })] }), _jsx("div", { className: "bg-white rounded-3xl p-8 shadow-lg", children: _jsx("div", { className: "space-y-4", children: ['English', 'Español', 'Français', 'Deutsch', 'Italiano'].map((lang) => (_jsxs("div", { className: "flex items-center justify-between p-3 bg-gray-50 rounded-lg", children: [_jsx("span", { className: "font-medium", children: lang }), _jsx(CheckCircle, { className: "w-5 h-5 text-green-600" })] }, lang))) }) })] }) }) }));
}
// Browser Extension Section Component
function BrowserExtensionSection() {
    return (_jsx("section", { className: "py-20 bg-white", children: _jsx("div", { className: "max-w-6xl mx-auto px-4", children: _jsxs("div", { className: "grid lg:grid-cols-2 gap-12 items-center", children: [_jsxs("div", { className: "order-2 lg:order-1", children: [_jsx("h2", { className: "text-4xl font-bold text-gray-900 mb-6", children: "Powerful Browser Extension" }), _jsx("p", { className: "text-xl text-gray-600 mb-8", children: "Install our Chrome extension and start tracking prices with just one click. No complex setup required." }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(CheckCircle, { className: "w-5 h-5 text-green-600" }), _jsx("span", { children: "One-click price tracking" })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(CheckCircle, { className: "w-5 h-5 text-green-600" }), _jsx("span", { children: "Real-time price alerts" })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(CheckCircle, { className: "w-5 h-5 text-green-600" }), _jsx("span", { children: "Price history charts" })] })] })] }), _jsx("div", { className: "order-1 lg:order-2", children: _jsx("div", { className: "bg-gradient-to-br from-blue-100 to-indigo-200 rounded-3xl p-8", children: _jsxs("div", { className: "bg-white rounded-2xl p-6 shadow-lg", children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx(Chrome, { className: "w-6 h-6 text-blue-600" }), _jsx("span", { className: "font-semibold", children: "Price Tracker Extension" })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Current Price" }), _jsx("span", { className: "font-bold text-green-600", children: "$89.99" })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Lowest Price" }), _jsx("span", { className: "font-bold text-red-600", children: "$67.50" })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Price Drop" }), _jsx("span", { className: "font-bold text-blue-600", children: "-25%" })] })] })] }) }) })] }) }) }));
}
// Price History Section Component
function PriceHistorySection() {
    return (_jsx("section", { className: "py-20 bg-gray-50", children: _jsx("div", { className: "max-w-6xl mx-auto px-4", children: _jsxs("div", { className: "grid lg:grid-cols-2 gap-12 items-center", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-4xl font-bold text-gray-900 mb-6", children: "Visual Price History" }), _jsx("p", { className: "text-xl text-gray-600 mb-8", children: "See price trends over time with our interactive charts. Make informed decisions about when to buy." }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(TrendingDown, { className: "w-5 h-5 text-blue-600" }), _jsx("span", { children: "Price trend analysis" })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Clock, { className: "w-5 h-5 text-blue-600" }), _jsx("span", { children: "Historical data" })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(TrendingDown, { className: "w-5 h-5 text-blue-600" }), _jsx("span", { children: "Interactive charts" })] })] })] }), _jsx("div", { className: "bg-white rounded-3xl p-8 shadow-lg", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "font-semibold", children: "Price History" }), _jsx("span", { className: "text-sm text-gray-600", children: "Last 30 days" })] }), _jsx("div", { className: "h-48 bg-gradient-to-t from-green-100 to-blue-100 rounded-lg flex items-end justify-between p-4", children: [60, 80, 45, 90, 70, 85, 65, 75, 50, 80, 90, 85].map((height, index) => (_jsx("div", { className: "w-2 bg-blue-600 rounded-full", style: { height: `${height}%` } }, index))) }), _jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsx("span", { className: "text-gray-600", children: "Lowest: $67.50" }), _jsx("span", { className: "text-gray-600", children: "Highest: $89.99" })] })] }) })] }) }) }));
}
// Price Drop Alert Section Component
function PriceDropAlertSection() {
    return (_jsx("section", { className: "py-20 bg-white", children: _jsx("div", { className: "max-w-6xl mx-auto px-4", children: _jsxs("div", { className: "grid lg:grid-cols-2 gap-12 items-center", children: [_jsxs("div", { className: "order-2 lg:order-1", children: [_jsx("h2", { className: "text-4xl font-bold text-gray-900 mb-6", children: "Smart Price Drop Alerts" }), _jsx("p", { className: "text-xl text-gray-600 mb-8", children: "Set your target price and get instant notifications when prices drop. Never miss the best deals again." }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Bell, { className: "w-5 h-5 text-green-600" }), _jsx("span", { children: "Instant notifications" })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(DollarSign, { className: "w-5 h-5 text-green-600" }), _jsx("span", { children: "Custom price targets" })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Shield, { className: "w-5 h-5 text-green-600" }), _jsx("span", { children: "Email & browser alerts" })] })] })] }), _jsx("div", { className: "order-1 lg:order-2", children: _jsx("div", { className: "bg-gradient-to-br from-green-100 to-blue-100 rounded-3xl p-8", children: _jsxs("div", { className: "bg-white rounded-2xl p-6 shadow-lg", children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx(Bell, { className: "w-6 h-6 text-green-600" }), _jsx("span", { className: "font-semibold", children: "Price Alert" })] }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Product" }), _jsx("span", { className: "font-medium", children: "iPhone 15 Pro" })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Target Price" }), _jsx("span", { className: "font-bold text-blue-600", children: "$799" })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-sm text-gray-600", children: "Current Price" }), _jsx("span", { className: "font-bold text-green-600", children: "$749" })] }), _jsx("div", { className: "bg-green-100 rounded-lg p-3 text-center", children: _jsx("span", { className: "text-green-800 font-semibold", children: "Price dropped! \uD83C\uDF89" }) })] })] }) }) })] }) }) }));
}
// Why Choose Us Section Component
function WhyChooseUsSection() {
    return (_jsx("section", { className: "py-20 bg-gray-50", children: _jsxs("div", { className: "max-w-6xl mx-auto px-4", children: [_jsxs("div", { className: "text-center mb-16", children: [_jsx("h2", { className: "text-4xl font-bold text-gray-900 mb-4", children: "Why Choose Price Tracker?" }), _jsx("p", { className: "text-xl text-gray-600 max-w-2xl mx-auto", children: "Join thousands of users who are already saving money with our powerful price tracking tools." })] }), _jsx("div", { className: "grid md:grid-cols-2 lg:grid-cols-3 gap-8", children: [
                        {
                            icon: Zap,
                            title: "Lightning Fast",
                            description: "Track prices instantly with our optimized browser extension."
                        },
                        {
                            icon: Shield,
                            title: "Privacy First",
                            description: "Your data stays private. We never sell your information."
                        },
                        {
                            icon: Star,
                            title: "100% Free",
                            description: "All features are completely free to use, forever."
                        },
                        {
                            icon: Users,
                            title: "Trusted by 50K+",
                            description: "Join our growing community of smart shoppers."
                        },
                        {
                            icon: Award,
                            title: "Best in Class",
                            description: "Rated #1 price tracking extension by users."
                        },
                        {
                            icon: ShoppingCart,
                            title: "Multi-Store",
                            description: "Track prices across all major online retailers."
                        }
                    ].map((feature, index) => (_jsxs("div", { className: "bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow", children: [_jsx("div", { className: "w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4", children: _jsx(feature.icon, { className: "w-6 h-6 text-blue-600" }) }), _jsx("h3", { className: "text-xl font-semibold text-gray-900 mb-3", children: feature.title }), _jsx("p", { className: "text-gray-600", children: feature.description })] }, index))) })] }) }));
}
// How It Works Section Component
function HowItWorksSection() {
    return (_jsx("section", { className: "py-20 bg-white", children: _jsxs("div", { className: "max-w-6xl mx-auto px-4", children: [_jsxs("div", { className: "text-center mb-16", children: [_jsx("h2", { className: "text-4xl font-bold text-gray-900 mb-4", children: "How It Works" }), _jsx("p", { className: "text-xl text-gray-600 max-w-2xl mx-auto", children: "Get started in just 3 simple steps" })] }), _jsx("div", { className: "grid md:grid-cols-3 gap-8", children: [
                        {
                            step: "1",
                            title: "Install Extension",
                            description: "Add our Chrome extension to your browser with one click.",
                            icon: Download
                        },
                        {
                            step: "2",
                            title: "Browse Products",
                            description: "Visit any product page on supported stores and click track.",
                            icon: ShoppingCart
                        },
                        {
                            step: "3",
                            title: "Get Alerts",
                            description: "Set your target price and receive instant notifications.",
                            icon: Bell
                        }
                    ].map((step, index) => (_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6", children: _jsx("span", { className: "text-white text-xl font-bold", children: step.step }) }), _jsx("h3", { className: "text-xl font-semibold text-gray-900 mb-3", children: step.title }), _jsx("p", { className: "text-gray-600", children: step.description })] }, index))) })] }) }));
}
// FAQ Section Component
function FAQSection() {
    const [openFaq, setOpenFaq] = useState(null);
    const faqs = [
        {
            question: "Is Price Tracker really free?",
            answer: "Yes! All features are completely free to use. We believe everyone should have access to smart shopping tools."
        },
        {
            question: "Which browsers are supported?",
            answer: "Currently, we support Google Chrome. We're working on Firefox and Safari support."
        },
        {
            question: "How accurate are the price alerts?",
            answer: "Our price tracking is highly accurate and updates in real-time. We monitor prices continuously to ensure you never miss a deal."
        },
        {
            question: "Can I track multiple products?",
            answer: "Absolutely! You can track unlimited products across all supported stores."
        },
        {
            question: "Is my data secure?",
            answer: "Yes, we take privacy seriously. Your data is encrypted and we never sell your information to third parties."
        }
    ];
    return (_jsx("section", { className: "py-20 bg-gray-50", children: _jsxs("div", { className: "max-w-4xl mx-auto px-4", children: [_jsxs("div", { className: "text-center mb-16", children: [_jsx("h2", { className: "text-4xl font-bold text-gray-900 mb-4", children: "Frequently Asked Questions" }), _jsx("p", { className: "text-xl text-gray-600", children: "Everything you need to know about Price Tracker" })] }), _jsx("div", { className: "space-y-4", children: faqs.map((faq, index) => (_jsxs("div", { className: "bg-white rounded-2xl shadow-lg", children: [_jsxs("button", { className: "w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 rounded-2xl transition-colors", onClick: () => setOpenFaq(openFaq === index ? null : index), children: [_jsx("span", { className: "font-semibold text-gray-900", children: faq.question }), _jsx(ArrowRight, { className: `w-5 h-5 text-gray-600 transition-transform ${openFaq === index ? 'rotate-90' : ''}` })] }), openFaq === index && (_jsx("div", { className: "px-6 pb-4", children: _jsx("p", { className: "text-gray-600", children: faq.answer }) }))] }, index))) })] }) }));
}
// CTA Section Component
function CTASection() {
    return (_jsx("section", { className: "py-20 bg-blue-600", children: _jsxs("div", { className: "max-w-4xl mx-auto px-4 text-center", children: [_jsx("h2", { className: "text-4xl font-bold text-white mb-6", children: "Ready to Start Saving?" }), _jsx("p", { className: "text-xl text-blue-100 mb-8", children: "Join thousands of users who are already saving money with Price Tracker" }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-4 justify-center", children: [_jsxs("button", { className: "bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-xl text-lg font-semibold transition-colors flex items-center justify-center gap-2", onClick: () => window.open('https://chrome.google.com/webstore', '_blank'), children: [_jsx(Chrome, { className: "w-5 h-5" }), "Add to Chrome - Free"] }), _jsxs(Link, { to: "/dashboard", className: "border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold transition-colors flex items-center justify-center gap-2", children: [_jsx(TrendingDown, { className: "w-5 h-5" }), "View Dashboard"] })] })] }) }));
}
// Footer Component
function Footer() {
    return (_jsx("footer", { className: "bg-gray-900 text-white py-12", children: _jsxs("div", { className: "max-w-6xl mx-auto px-4", children: [_jsxs("div", { className: "grid md:grid-cols-4 gap-8", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-3 mb-4", children: [_jsx("div", { className: "w-8 h-8 bg-[#2563EB] rounded-lg flex items-center justify-center shadow-sm", children: _jsxs("svg", { width: "16", height: "16", viewBox: "0 0 100 100", fill: "none", xmlns: "http://www.w3.org/2000/svg", children: [_jsx("rect", { x: "0", y: "0", width: "100", height: "100", rx: "20", fill: "#2563EB" }), _jsx("path", { d: "M25 70 C35 50, 65 50, 75 30", stroke: "white", strokeWidth: "8", strokeLinecap: "round", strokeLinejoin: "round" }), _jsx("circle", { cx: "75", cy: "30", r: "6", fill: "white" })] }) }), _jsx("span", { className: "text-xl font-bold", children: "Price Tracker" })] }), _jsx("p", { className: "text-gray-400 mb-4", children: "Your ultimate price tracking solution for smart shopping." }), _jsx("div", { className: "flex space-x-4", children: _jsxs("a", { href: "#", className: "text-gray-400 hover:text-white transition-colors", children: [_jsx("span", { className: "sr-only", children: "Twitter" }), _jsx("svg", { className: "w-6 h-6", fill: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { d: "M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" }) })] }) })] }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold mb-4", children: "Product" }), _jsxs("ul", { className: "space-y-2 text-gray-400", children: [_jsx("li", { children: _jsx("a", { href: "#", className: "hover:text-white transition-colors", children: "Features" }) }), _jsx("li", { children: _jsx("a", { href: "#", className: "hover:text-white transition-colors", children: "Pricing" }) }), _jsx("li", { children: _jsx("a", { href: "#", className: "hover:text-white transition-colors", children: "Download" }) }), _jsx("li", { children: _jsx("a", { href: "#", className: "hover:text-white transition-colors", children: "API" }) })] })] }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold mb-4", children: "Support" }), _jsxs("ul", { className: "space-y-2 text-gray-400", children: [_jsx("li", { children: _jsx("a", { href: "#", className: "hover:text-white transition-colors", children: "Help Center" }) }), _jsx("li", { children: _jsx("a", { href: "#", className: "hover:text-white transition-colors", children: "Contact" }) }), _jsx("li", { children: _jsx("a", { href: "#", className: "hover:text-white transition-colors", children: "Status" }) }), _jsx("li", { children: _jsx("a", { href: "#", className: "hover:text-white transition-colors", children: "Bug Report" }) })] })] }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold mb-4", children: "Company" }), _jsxs("ul", { className: "space-y-2 text-gray-400", children: [_jsx("li", { children: _jsx("a", { href: "#", className: "hover:text-white transition-colors", children: "About" }) }), _jsx("li", { children: _jsx("a", { href: "#", className: "hover:text-white transition-colors", children: "Blog" }) }), _jsx("li", { children: _jsx("a", { href: "#", className: "hover:text-white transition-colors", children: "Careers" }) }), _jsx("li", { children: _jsx("a", { href: "#", className: "hover:text-white transition-colors", children: "Privacy" }) })] })] })] }), _jsx("div", { className: "border-t border-gray-800 mt-8 pt-8 text-center text-gray-400", children: _jsx("p", { children: "\u00A9 2024 Price Tracker. All rights reserved." }) })] }) }));
}
// Main Landing Page Component
const Landing = () => {
    console.log('Landing page component rendering...');
    // Fetch dynamic pricing plans
    const [plans, setPlans] = React.useState(DEFAULT_LANDING_PLANS);
    React.useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/api/payments/plans');
                const json = await res.json();
                if (json?.success && Array.isArray(json.data?.plans) && json.data.plans.length) {
                    setPlans(json.data.plans);
                }
            }
            catch (_) {
                // ignore and fall back to defaults
            }
        })();
    }, []);
    const effectivePlans = plans.length ? plans : DEFAULT_LANDING_PLANS;
    const findPlanVariant = (keyword, interval) => effectivePlans.find((pl) => pl.interval === interval && (pl.name || '').toLowerCase().includes(keyword));
    const findPrice = (keyword, interval, fallback) => findPlanVariant(keyword, interval)?.price ?? fallback;
    const formatFrequency = (freq) => {
        if (!freq)
            return 'Daily';
        return freq.charAt(0).toUpperCase() + freq.slice(1);
    };
    const buildFeatureList = (plan) => {
        const target = plan || DEFAULT_LANDING_PLANS[0];
        const base = target.features || DEFAULT_LANDING_PLANS[0].features;
        return [
            `${base.maxTrackedProducts} tracked products`,
            `${formatFrequency(base.alertFrequency)} alerts`,
            `${base.priceHistoryDays}-day price history`,
            base.exportData ? 'Data export included' : 'Email summaries',
            base.prioritySupport ? 'Priority support' : 'Standard support',
        ];
    };
    const basicMonthlyPlan = findPlanVariant('basic', 'monthly');
    const basicYearlyPlan = findPlanVariant('basic', 'yearly');
    const premiumMonthlyPlan = findPlanVariant('premium', 'monthly');
    const premiumYearlyPlan = findPlanVariant('premium', 'yearly');
    const basicMonthly = basicMonthlyPlan?.price ?? 3;
    const basicYearly = basicYearlyPlan?.price ?? 30;
    const premiumMonthly = premiumMonthlyPlan?.price ?? 8;
    const premiumYearly = premiumYearlyPlan?.price ?? 80;
    const basicFeatures = buildFeatureList(basicMonthlyPlan || basicYearlyPlan);
    const premiumFeatures = buildFeatureList(premiumMonthlyPlan || premiumYearlyPlan);
    // Build additional dynamic plans beyond Basic/Premium
    const extraPlans = React.useMemo(() => {
        const grouped = new Map();
        effectivePlans.forEach((pl) => {
            const name = (pl.name || '').trim();
            const lower = name.toLowerCase();
            if (!name)
                return;
            if (lower.includes('basic') || lower.includes('premium'))
                return;
            const existing = grouped.get(name) || { title: name, features: buildFeatureList(pl) };
            if (pl.interval === 'monthly')
                existing.monthlyPrice = pl.price;
            if (pl.interval === 'yearly')
                existing.yearlyPrice = pl.price;
            if (!existing.features.length) {
                existing.features = buildFeatureList(pl);
            }
            grouped.set(name, existing);
        });
        return Array.from(grouped.values());
    }, [plans]);
    return (_jsxs("div", { className: "min-h-screen bg-white", children: [_jsx(Navigation, {}), _jsx("div", { className: "pt-16", children: _jsx(HeroSection, {}) }), _jsx("section", { id: "features", children: _jsx(MultiStoreSection, {}) }), _jsx(MultiLanguageSection, {}), _jsx(BrowserExtensionSection, {}), _jsx(PriceHistorySection, {}), _jsx(PriceDropAlertSection, {}), _jsx("section", { id: "features", children: _jsx(WhyChooseUsSection, {}) }), _jsx("section", { id: "pricing", className: "py-20 bg-gray-50", children: _jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: [_jsxs("div", { className: "text-center mb-16", children: [_jsx("h2", { className: "text-4xl font-bold text-gray-900 mb-4", children: "Simple, Transparent Pricing" }), _jsx("p", { className: "text-xl text-gray-600 max-w-3xl mx-auto", children: "Start free for 7 days, then choose the plan that works best for you" })] }), _jsxs("div", { className: "bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl p-8 mb-12 text-center", children: [_jsx("div", { className: "text-5xl mb-4", children: "\uD83C\uDF89" }), _jsx("h3", { className: "text-3xl font-bold mb-4", children: "First 7 Days FREE!" }), _jsx("p", { className: "text-xl mb-6", children: "Enjoy all Premium features for 7 days - completely free!" }), _jsx("div", { className: "bg-white bg-opacity-20 rounded-lg p-4 inline-block", children: _jsxs("p", { className: "text-lg", children: [_jsx("strong", { children: "200 tracked products" }), " \u2022 ", _jsx("strong", { children: "Instant alerts" }), " \u2022 ", _jsx("strong", { children: "365-day history" })] }) })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto", children: [_jsxs("div", { className: "bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200", children: [_jsxs("div", { className: "text-center mb-6", children: [_jsx("h3", { className: "text-2xl font-bold text-gray-900 mb-2", children: "Free Plan" }), _jsxs("div", { className: "text-4xl font-bold text-gray-900 mb-2", children: ["$0", _jsx("span", { className: "text-lg text-gray-500", children: "/month" })] }), _jsx("p", { className: "text-gray-600", children: "After 7-day trial" })] }), _jsxs("ul", { className: "space-y-4 mb-8", children: [_jsxs("li", { className: "flex items-center", children: [_jsx(CheckCircle, { className: "w-5 h-5 text-green-500 mr-3" }), _jsx("span", { children: "10 tracked products" })] }), _jsxs("li", { className: "flex items-center", children: [_jsx(CheckCircle, { className: "w-5 h-5 text-green-500 mr-3" }), _jsx("span", { children: "1-2 price alerts per month" })] }), _jsxs("li", { className: "flex items-center", children: [_jsx(CheckCircle, { className: "w-5 h-5 text-green-500 mr-3" }), _jsx("span", { children: "30-day price history" })] }), _jsxs("li", { className: "flex items-center", children: [_jsx(CheckCircle, { className: "w-5 h-5 text-green-500 mr-3" }), _jsx("span", { children: "Basic support" })] })] }), _jsx(Link, { to: "/auth", className: "w-full bg-gray-100 text-gray-900 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors block text-center", children: "Get Started Free" })] }), _jsx(PricingCard, { title: "Basic", isPopular: true, monthlyPrice: basicMonthly, yearlyPrice: basicYearly, features: basicFeatures, buttonText: "Choose Basic", buttonColor: "blue" }), _jsx(PricingCard, { title: "Premium", isPopular: false, monthlyPrice: premiumMonthly, yearlyPrice: premiumYearly, features: premiumFeatures, buttonText: "Choose Premium", buttonColor: "gray" }), extraPlans.map((p) => (_jsx(PricingCard, { title: p.title, isPopular: false, monthlyPrice: p.monthlyPrice ?? 0, yearlyPrice: p.yearlyPrice ?? (p.monthlyPrice ? Math.round((p.monthlyPrice * 12) * 0.83) : 0), features: p.features, buttonText: `Choose ${p.title}`, buttonColor: "gray" }, p.title)))] }), _jsxs("div", { className: "text-center mt-12", children: [_jsx("p", { className: "text-gray-600 mb-4", children: "Trusted by thousands of users worldwide" }), _jsxs("div", { className: "flex justify-center items-center gap-8 text-gray-400", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Shield, { className: "w-5 h-5" }), _jsx("span", { children: "Secure payments" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Clock, { className: "w-5 h-5" }), _jsx("span", { children: "Cancel anytime" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Users, { className: "w-5 h-5" }), _jsx("span", { children: "24/7 support" })] })] })] })] }) }), _jsx("section", { id: "how-it-works", children: _jsx(HowItWorksSection, {}) }), _jsx("section", { id: "faq", children: _jsx(FAQSection, {}) }), _jsx(CTASection, {}), _jsx(Footer, {})] }));
};
export default Landing;
//# sourceMappingURL=Landing.js.map