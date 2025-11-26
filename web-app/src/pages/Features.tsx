import React from 'react';
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

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <nav className="bg-white border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-gray-900">Price Tracker</span>
                    </Link>
                    <Link to="/" className="text-gray-600 hover:text-gray-900">
                        Back to Home
                    </Link>
                </div>
            </nav>

            <div className="max-w-6xl mx-auto px-4 py-12">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Powerful Features</h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Everything you need to save money and shop smarter online.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                    {features.map((feature, index) => (
                        <div key={index} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                                <feature.icon className="w-6 h-6 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                            <p className="text-gray-600 leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>

                <div className="bg-blue-600 rounded-3xl p-8 md:p-16 text-center text-white">
                    <h2 className="text-3xl font-bold mb-6">Ready to start saving?</h2>
                    <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
                        Join thousands of smart shoppers who are already saving money with Price Tracker.
                    </p>
                    <Link
                        to="/auth"
                        className="inline-block bg-white text-blue-600 px-8 py-4 rounded-xl font-bold hover:bg-gray-100 transition-colors"
                    >
                        Get Started for Free
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Features;
