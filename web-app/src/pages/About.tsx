import React from 'react';
import { Users, Target, Heart, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PublicNavigation } from '../components/PublicNavigation';

const About = () => {
    return (
        <>
            <PublicNavigation />
            <div className="min-h-screen bg-gray-50 pt-24">
                <div className="max-w-4xl mx-auto px-4 py-12">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">About Us</h1>
                        <p className="text-xl text-gray-600">
                            Empowering shoppers to make smarter purchasing decisions.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 mb-16">
                        <div className="bg-white p-8 rounded-2xl shadow-sm">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                                <Target className="w-6 h-6 text-blue-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
                            <p className="text-gray-600 leading-relaxed">
                                We believe that everyone deserves to get the best value for their money. Our mission is to provide transparent, accurate, and real-time price tracking tools that help consumers save money on their favorite products across major online retailers.
                            </p>
                        </div>

                        <div className="bg-white p-8 rounded-2xl shadow-sm">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                                <Heart className="w-6 h-6 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Values</h2>
                            <p className="text-gray-600 leading-relaxed">
                                We prioritize user privacy, data accuracy, and simplicity. We build tools that we use ourselves, ensuring that our users get a seamless and ad-free experience that genuinely adds value to their shopping journey.
                            </p>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12 text-center">
                        <Globe className="w-12 h-12 text-blue-600 mx-auto mb-6" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Global Reach</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto mb-8">
                            Started in 2024, Price Tracker has grown to support thousands of users worldwide, tracking prices across major platforms like Amazon, eBay, Walmart, and more.
                        </p>
                        <div className="flex justify-center gap-8 text-gray-500">
                            <div>
                                <div className="text-3xl font-bold text-gray-900">50K+</div>
                                <div className="text-sm">Users</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-gray-900">1M+</div>
                                <div className="text-sm">Products Tracked</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-gray-900">$2M+</div>
                                <div className="text-sm">Money Saved</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default About;

