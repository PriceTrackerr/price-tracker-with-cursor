import React from 'react';
import {
    Globe,
    Tag,
    TrendingDown,
    Zap,
    ShieldCheck,
    Smartphone,
    BarChart3,
    Bell
} from 'lucide-react';
import { motion } from 'framer-motion';
import { LandingNav, LandingFooter } from '../components/LandingLayout';

const Features = () => {
    const features = [
        {
            icon: <Globe className="w-8 h-8 text-blue-500" />,
            title: "Global Price Comparison",
            description: "Don't just shop locally. We instantly compare prices across Amazon, eBay, and more in 6+ countries (US, UK, DE, JP, CA, AU) to find arbitrage opportunities.",
            color: "bg-blue-500/10 border-blue-500/20"
        },
        {
            icon: <Tag className="w-8 h-8 text-green-500" />,
            title: "Smart Coupon Finder",
            description: "Stop searching for codes. We automatically find and verify 'hardcoded' coupons (like SAVE20) and scrape Reddit/Slickdeals for hidden gems that actually work.",
            color: "bg-green-500/10 border-green-500/20"
        },
        {
            icon: <TrendingDown className="w-8 h-8 text-purple-500" />,
            title: "Price History Tracking",
            description: "See the real price trend. Our charts show you if today's 'deal' is actually good or just a marked-up scam. Know exactly when to buy.",
            color: "bg-purple-500/10 border-purple-500/20"
        },
        {
            icon: <Bell className="w-8 h-8 text-yellow-500" />,
            title: "Instant Stock Alerts",
            description: "Missed out on a PS5 drop? Never again. Set alerts for out-of-stock items and get notified the second they are back on shelves.",
            color: "bg-yellow-500/10 border-yellow-500/20"
        },
        {
            icon: <BarChart3 className="w-8 h-8 text-indigo-500" />,
            title: "AI Analysis",
            description: "Not sure if it's quality? Our AI analyzes thousands of reviews to give you a 'Buy' or 'Pass' recommendation with a confidence score.",
            color: "bg-indigo-500/10 border-indigo-500/20"
        },
        {
            icon: <ShieldCheck className="w-8 h-8 text-teal-500" />,
            title: "Scam Protection",
            description: "We verify seller ratings and flag suspicious third-party listings so you don't get tricked by fake storefronts.",
            color: "bg-teal-500/10 border-teal-500/20"
        }
    ];

    return (
        <>
            <LandingNav />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-24 pb-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Header */}
                    <div className="text-center mb-16">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 mb-6"
                        >
                            Powerful Features for <br /> Smarter Shopping
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto"
                        >
                            Real Price Tracker isn't just a browser extension. It's a comprehensive shopping assistant powered by real-time data and AI.
                        </motion.p>
                    </div>

                    {/* Features Grid */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={`p-8 rounded-2xl border ${feature.color} backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}
                            >
                                <div className="mb-6 p-4 rounded-xl bg-white dark:bg-gray-700 shadow-sm w-fit">
                                    {feature.icon}
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                    {feature.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>

                    {/* CTA Section */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6 }}
                        className="mt-20 p-12 rounded-3xl bg-gradient-to-r from-blue-600 to-purple-800 text-center text-white relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                        <div className="relative z-10">
                            <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to stop overpaying?</h2>
                            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
                                Join thousands of smart shoppers saving an average of $320 per year. Start your free trial today.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <a
                                    href="/signup"
                                    className="px-8 py-3 bg-white text-blue-600 rounded-full font-bold hover:bg-gray-100 transition-colors shadow-lg"
                                >
                                    Get Started Free
                                </a>
                                <a
                                    href="/contact"
                                    className="px-8 py-3 bg-blue-700/50 text-white border border-blue-400/30 rounded-full font-bold hover:bg-blue-700 transition-colors"
                                >
                                    Contact Sales
                                </a>
                            </div>
                        </div>
                    </motion.div>

                </div>
            </div>
            <LandingFooter />
        </>
    );
};

export default Features;
