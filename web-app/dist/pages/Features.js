import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Zap, Bell, TrendingDown, Shield, Globe, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';
const Features = () => {
    const features = [
        {
            icon: Zap,
            title: "Real-Time Tracking",
            description: "Our advanced algorithms monitor prices 24/7, ensuring you never miss a price drop. Updates happen instantly."
        },
        {
            icon: Bell,
            title: "Smart Alerts",
            description: "Set your target price and get notified via email or browser notification the moment a product hits your desired price."
        },
        {
            icon: TrendingDown,
            title: "Price History Charts",
            description: "View detailed price history charts to analyze trends and determine the best time to buy. Spot fake discounts easily."
        },
        {
            icon: Shield,
            title: "Privacy Focused",
            description: "We don't track your browsing history. We only track the specific products you add to your watchlist."
        },
        {
            icon: Globe,
            title: "Multi-Store Support",
            description: "Track products from Amazon, eBay, Walmart, AliExpress, and Shein all in one single dashboard."
        },
        {
            icon: Smartphone,
            title: "Mobile Friendly",
            description: "Access your dashboard from any device. Our responsive design ensures a great experience on phone, tablet, or desktop."
        }
    ];
    return (_jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx("nav", { className: "bg-white border-b border-gray-200", children: _jsxs("div", { className: "max-w-6xl mx-auto px-4 h-16 flex items-center justify-between", children: [_jsxs(Link, { to: "/", className: "flex items-center gap-2", children: [_jsx("div", { className: "w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center", children: _jsx(Zap, { className: "w-5 h-5 text-white" }) }), _jsx("span", { className: "text-xl font-bold text-gray-900", children: "Price Tracker" })] }), _jsx(Link, { to: "/", className: "text-gray-600 hover:text-gray-900", children: "Back to Home" })] }) }), _jsxs("div", { className: "max-w-6xl mx-auto px-4 py-12", children: [_jsxs("div", { className: "text-center mb-16", children: [_jsx("h1", { className: "text-4xl font-bold text-gray-900 mb-4", children: "Powerful Features" }), _jsx("p", { className: "text-xl text-gray-600 max-w-2xl mx-auto", children: "Everything you need to save money and shop smarter online." })] }), _jsx("div", { className: "grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16", children: features.map((feature, index) => (_jsxs("div", { className: "bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow", children: [_jsx("div", { className: "w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6", children: _jsx(feature.icon, { className: "w-6 h-6 text-blue-600" }) }), _jsx("h3", { className: "text-xl font-bold text-gray-900 mb-3", children: feature.title }), _jsx("p", { className: "text-gray-600 leading-relaxed", children: feature.description })] }, index))) }), _jsxs("div", { className: "bg-blue-600 rounded-3xl p-8 md:p-16 text-center text-white", children: [_jsx("h2", { className: "text-3xl font-bold mb-6", children: "Ready to start saving?" }), _jsx("p", { className: "text-blue-100 text-lg mb-8 max-w-2xl mx-auto", children: "Join thousands of smart shoppers who are already saving money with Price Tracker." }), _jsx(Link, { to: "/auth", className: "inline-block bg-white text-blue-600 px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition-colors", children: "Get Started for Free" })] })] })] }));
};
export default Features;
//# sourceMappingURL=Features.js.map