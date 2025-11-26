import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import {
  Menu,
  X,
  LogIn,
  Chrome,
  Play,
  CheckCircle,
  TrendingDown,
  Bell,
  Shield,
  Zap,
  Star,
  Globe,
  Download,
  ArrowRight,
  ShoppingCart,
  DollarSign,
  Clock,
  Users,
  Award
} from 'lucide-react';

interface LandingPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly';
  features: {
    maxTrackedProducts: number;
    alertFrequency: 'instant' | 'hourly' | 'daily';
    priceHistoryDays: number;
    exportData: boolean;
    prioritySupport: boolean;
  };
}

const DEFAULT_LANDING_PLANS: LandingPlan[] = [
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

// Pricing Card Component with Toggle
interface PricingCardProps {
  title: string;
  isPopular: boolean;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  buttonText: string;
  buttonColor: 'blue' | 'gray';
}

function PricingCard({ title, isPopular, monthlyPrice, yearlyPrice, features, buttonText, buttonColor }: PricingCardProps) {
  const { user } = useAuth();
  const [isYearly, setIsYearly] = useState(false);

  const currentPrice = isYearly ? yearlyPrice : monthlyPrice;
  const savings = isYearly ? Math.round((monthlyPrice * 12 - yearlyPrice) / (monthlyPrice * 12) * 100) : 0;

  const getBorderColor = () => {
    if (isPopular) return 'border-blue-500';
    return 'border-gray-200';
  };

  const getButtonClasses = () => {
    if (buttonColor === 'blue') {
      return 'w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors block text-center';
    }
    return 'w-full bg-gray-900 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-800 transition-colors block text-center';
  };

  const getPriceColor = () => {
    if (buttonColor === 'blue') return 'text-blue-600';
    return 'text-gray-900';
  };

  return (
    <div className={`bg-white rounded-2xl shadow-lg p-8 border-2 ${getBorderColor()} relative`}>
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
            Most Popular
          </span>
        </div>
      )}

      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>

        {/* Pricing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-4">
          <span className={`text-sm ${!isYearly ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
            Monthly
          </span>
          <button
            onClick={() => setIsYearly(!isYearly)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isYearly ? 'bg-blue-600' : 'bg-gray-200'
              }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isYearly ? 'translate-x-6' : 'translate-x-1'
                }`}
            />
          </button>
          <span className={`text-sm ${isYearly ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
            Yearly
          </span>
        </div>

        <div className={`text-4xl font-bold ${getPriceColor()} mb-2`}>
          ${currentPrice}
          <span className="text-lg text-gray-500">
            /{isYearly ? 'year' : 'month'}
          </span>
        </div>

        {isYearly && savings > 0 && (
          <p className="text-green-600 font-semibold text-sm">
            Save {savings}% with yearly billing
          </p>
        )}
      </div>

      <ul className="space-y-4 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Link to={user ? "/dashboard" : "/auth"} className={getButtonClasses()}>
        {buttonText}
      </Link>
    </div>
  );
}

// Navigation Component
function Navigation() {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#2563EB] rounded-lg flex items-center justify-center shadow-sm">
              <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="0" y="0" width="100" height="100" rx="20" fill="#2563EB" />
                <path d="M25 70 C35 50, 65 50, 75 30" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="75" cy="30" r="6" fill="white" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900">Price Tracker</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors">
              How It Works
            </a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">
              Pricing
            </a>
            <a href="#faq" className="text-gray-600 hover:text-gray-900 transition-colors">
              FAQ
            </a>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Link to="/dashboard" className="text-gray-600 hover:text-gray-900 transition-colors flex items-center">
                  <LogIn className="w-4 h-4 mr-2" />
                  Dashboard
                </Link>
                <Link to="/dashboard" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                  Go to Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link to="/auth" className="text-gray-600 hover:text-gray-900 transition-colors flex items-center">
                  <LogIn className="w-4 h-4 mr-2" />
                  Login
                </Link>
                <Link to="/auth" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-gray-600" />
            ) : (
              <Menu className="w-6 h-6 text-gray-600" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 bg-white">
            <div className="space-y-4">
              <a
                href="#features"
                className="block text-gray-600 hover:text-gray-900 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="block text-gray-600 hover:text-gray-900 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                How It Works
              </a>
              <a
                href="#pricing"
                className="block text-gray-600 hover:text-gray-900 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Pricing
              </a>
              <a
                href="#faq"
                className="block text-gray-600 hover:text-gray-900 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                FAQ
              </a>
              <div className="pt-4 border-t border-gray-200 space-y-2">
                {user ? (
                  <>
                    <Link to="/dashboard" className="block text-gray-600 hover:text-gray-900 transition-colors flex items-center">
                      <LogIn className="w-4 h-4 mr-2" />
                      Dashboard
                    </Link>
                    <Link to="/dashboard" className="block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-center">
                      Go to Dashboard
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/auth" className="block text-gray-600 hover:text-gray-900 transition-colors flex items-center">
                      <LogIn className="w-4 h-4 mr-2" />
                      Login
                    </Link>
                    <Link to="/auth" className="block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors text-center">
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

// Hero Section Component
function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-blue-50 to-indigo-100 py-16 sm:py-20 px-4 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Track Prices Across Top Stores.{" "}
                <span className="text-blue-600">Save Big.</span>{" "}
                <span className="text-indigo-600">Shop Smarter.</span>
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 leading-relaxed">
                Your ultimate price tracking solution for AliExpress, eBay, Amazon, Shein, and Walmart.
                Get alerts, see history, and never miss a deal.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-4 sm:py-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-2"
                onClick={() => window.open('https://chrome.google.com/webstore', '_blank')}
              >
                <Chrome className="w-5 h-5" />
                Add to Chrome (It's Free!)
              </button>
              <button
                className="px-6 sm:px-8 py-4 sm:py-6 rounded-xl border-2 border-gray-300 hover:border-blue-600 transition-all duration-300 flex items-center justify-center gap-2"
                onClick={() => {
                  document.getElementById('how-it-works')?.scrollIntoView({
                    behavior: 'smooth'
                  });
                }}
              >
                <Play className="w-5 h-5" />
                See How It Works
              </button>
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>100% Free to Use</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>No Registration Required</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Privacy Focused</span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <div className="w-full h-64 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-2xl flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#2563EB] rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="0" y="0" width="100" height="100" rx="20" fill="#2563EB" />
                      <path d="M25 70 C35 50, 65 50, 75 30" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="75" cy="30" r="6" fill="white" />
                    </svg>
                  </div>
                  <p className="text-gray-600 font-medium">Price Tracker Dashboard</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Today's Savings</span>
                  <span className="text-2xl font-bold text-green-600">$247.32</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full w-3/4"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Multi-Store Section Component
function MultiStoreSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Track Prices Across All Major Stores
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            One extension works everywhere. No need to visit multiple sites or apps.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8">
          {[
            { name: 'Amazon', icon: '🛒', color: 'bg-orange-100' },
            { name: 'AliExpress', icon: '📦', color: 'bg-red-100' },
            { name: 'eBay', icon: '🏷️', color: 'bg-blue-100' },
            { name: 'Walmart', icon: '🛍️', color: 'bg-green-100' },
            { name: 'Shein', icon: '👗', color: 'bg-purple-100' }
          ].map((store) => (
            <div key={store.name} className="text-center">
              <div className={`w-16 h-16 ${store.color} rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl`}>
                {store.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{store.name}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Multi-Language Section Component
function MultiLanguageSection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Available in Multiple Languages
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Use Price Tracker in your preferred language. We support English, Spanish, French, German, and more.
            </p>
            <div className="flex items-center gap-4">
              <Globe className="w-6 h-6 text-blue-600" />
              <span className="text-gray-600">12+ Languages Supported</span>
            </div>
          </div>
          <div className="bg-white rounded-3xl p-8 shadow-lg">
            <div className="space-y-4">
              {['English', 'Español', 'Français', 'Deutsch', 'Italiano'].map((lang) => (
                <div key={lang} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">{lang}</span>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Browser Extension Section Component
function BrowserExtensionSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Powerful Browser Extension
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Install our Chrome extension and start tracking prices with just one click.
              No complex setup required.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>One-click price tracking</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Real-time price alerts</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>Price history charts</span>
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <div className="bg-gradient-to-br from-blue-100 to-indigo-200 rounded-3xl p-8">
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <Chrome className="w-6 h-6 text-blue-600" />
                  <span className="font-semibold">Price Tracker Extension</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Current Price</span>
                    <span className="font-bold text-green-600">$89.99</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Lowest Price</span>
                    <span className="font-bold text-red-600">$67.50</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Price Drop</span>
                    <span className="font-bold text-blue-600">-25%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Price History Section Component
function PriceHistorySection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Visual Price History
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              See price trends over time with our interactive charts.
              Make informed decisions about when to buy.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <TrendingDown className="w-5 h-5 text-blue-600" />
                <span>Price trend analysis</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-600" />
                <span>Historical data</span>
              </div>
              <div className="flex items-center gap-3">
                <TrendingDown className="w-5 h-5 text-blue-600" />
                <span>Interactive charts</span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-3xl p-8 shadow-lg">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Price History</span>
                <span className="text-sm text-gray-600">Last 30 days</span>
              </div>
              <div className="h-48 bg-gradient-to-t from-green-100 to-blue-100 rounded-lg flex items-end justify-between p-4">
                {[60, 80, 45, 90, 70, 85, 65, 75, 50, 80, 90, 85].map((height, index) => (
                  <div key={index} className="w-2 bg-blue-600 rounded-full" style={{ height: `${height}%` }}></div>
                ))}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Lowest: $67.50</span>
                <span className="text-gray-600">Highest: $89.99</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Price Drop Alert Section Component
function PriceDropAlertSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Smart Price Drop Alerts
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Set your target price and get instant notifications when prices drop.
              Never miss the best deals again.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-green-600" />
                <span>Instant notifications</span>
              </div>
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span>Custom price targets</span>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-green-600" />
                <span>Email & browser alerts</span>
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <div className="bg-gradient-to-br from-green-100 to-blue-100 rounded-3xl p-8">
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                  <Bell className="w-6 h-6 text-green-600" />
                  <span className="font-semibold">Price Alert</span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Product</span>
                    <span className="font-medium">iPhone 15 Pro</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Target Price</span>
                    <span className="font-bold text-blue-600">$799</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Current Price</span>
                    <span className="font-bold text-green-600">$749</span>
                  </div>
                  <div className="bg-green-100 rounded-lg p-3 text-center">
                    <span className="text-green-800 font-semibold">Price dropped! 🎉</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Why Choose Us Section Component
function WhyChooseUsSection() {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Why Choose Price Tracker?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Join thousands of users who are already saving money with our powerful price tracking tools.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
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
          ].map((feature, index) => (
            <div key={index} className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// How It Works Section Component
function HowItWorksSection() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get started in just 3 simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
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
          ].map((step, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-white text-xl font-bold">{step.step}</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{step.title}</h3>
              <p className="text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// FAQ Section Component
function FAQSection() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600">
            Everything you need to know about Price Tracker
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-lg">
              <button
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 rounded-2xl transition-colors"
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
              >
                <span className="font-semibold text-gray-900">{faq.question}</span>
                <ArrowRight className={`w-5 h-5 text-gray-600 transition-transform ${openFaq === index ? 'rotate-90' : ''}`} />
              </button>
              {openFaq === index && (
                <div className="px-6 pb-4">
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// CTA Section Component
function CTASection() {
  return (
    <section className="py-20 bg-blue-600">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold text-white mb-6">
          Ready to Start Saving?
        </h2>
        <p className="text-xl text-blue-100 mb-8">
          Join thousands of users who are already saving money with Price Tracker
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-xl text-lg font-semibold transition-colors flex items-center justify-center gap-2"
            onClick={() => window.open('https://chrome.google.com/webstore', '_blank')}
          >
            <Chrome className="w-5 h-5" />
            Add to Chrome - Free
          </button>
          <Link
            to="/dashboard"
            className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <TrendingDown className="w-5 h-5" />
            View Dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}

// Footer Component
function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-[#2563EB] rounded-lg flex items-center justify-center shadow-sm">
                <svg width="16" height="16" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="0" y="0" width="100" height="100" rx="20" fill="#2563EB" />
                  <path d="M25 70 C35 50, 65 50, 75 30" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="75" cy="30" r="6" fill="white" />
                </svg>
              </div>
              <span className="text-xl font-bold">Price Tracker</span>
            </div>
            <p className="text-gray-400 mb-4">
              Your ultimate price tracking solution for smart shopping.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <span className="sr-only">Twitter</span>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Download</a></li>
              <li><a href="#" className="hover:text-white transition-colors">API</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Bug Report</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">About</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2024 Price Tracker. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

// Main Landing Page Component
const Landing: React.FC = () => {
  console.log('Landing page component rendering...');

  // Fetch dynamic pricing plans
  const [plans, setPlans] = React.useState<LandingPlan[]>(DEFAULT_LANDING_PLANS);
  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/payments/plans');
        const json = await res.json();
        if (json?.success && Array.isArray(json.data?.plans) && json.data.plans.length) {
          setPlans(json.data.plans);
        }
      } catch (_) {
        // ignore and fall back to defaults
      }
    })();
  }, []);

  const effectivePlans = plans.length ? plans : DEFAULT_LANDING_PLANS;

  const findPlanVariant = (keyword: 'basic' | 'premium', interval: 'monthly' | 'yearly') =>
    effectivePlans.find(
      (pl) => pl.interval === interval && (pl.name || '').toLowerCase().includes(keyword)
    );

  const findPrice = (keyword: 'basic' | 'premium', interval: 'monthly' | 'yearly', fallback: number) =>
    findPlanVariant(keyword, interval)?.price ?? fallback;

  const formatFrequency = (freq?: string) => {
    if (!freq) return 'Daily';
    return freq.charAt(0).toUpperCase() + freq.slice(1);
  };

  const buildFeatureList = (plan?: LandingPlan) => {
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
    const grouped = new Map<
      string,
      { title: string; monthlyPrice?: number; yearlyPrice?: number; features: string[] }
    >();
    effectivePlans.forEach((pl) => {
      const name = (pl.name || '').trim();
      const lower = name.toLowerCase();
      if (!name) return;
      if (lower.includes('basic') || lower.includes('premium')) return;
      const existing = grouped.get(name) || { title: name, features: buildFeatureList(pl) };
      if (pl.interval === 'monthly') existing.monthlyPrice = pl.price;
      if (pl.interval === 'yearly') existing.yearlyPrice = pl.price;
      if (!existing.features.length) {
        existing.features = buildFeatureList(pl);
      }
      grouped.set(name, existing);
    });
    return Array.from(grouped.values());
  }, [plans]);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <Navigation />

      {/* Hero Section */}
      <div className="pt-16">
        <HeroSection />
      </div>

      {/* Multi-Store Tracking */}
      <section id="features">
        <MultiStoreSection />
      </section>

      {/* Multi-Language Support */}
      <MultiLanguageSection />

      {/* Browser Extension */}
      <BrowserExtensionSection />

      {/* Price History */}
      <PriceHistorySection />

      {/* Price Drop Alerts */}
      <PriceDropAlertSection />

      {/* Why Choose Us */}
      <section id="features">
        <WhyChooseUsSection />
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Start free for 7 days, then choose the plan that works best for you
            </p>
          </div>

          {/* Free Period Banner */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl p-8 mb-12 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-3xl font-bold mb-4">First 7 Days FREE!</h3>
            <p className="text-xl mb-6">
              Enjoy all Premium features for 7 days - completely free!
            </p>
            <div className="bg-white bg-opacity-20 rounded-lg p-4 inline-block">
              <p className="text-lg">
                <strong>200 tracked products</strong> • <strong>Instant alerts</strong> • <strong>365-day history</strong>
              </p>
            </div>
          </div>

          {/* Pricing Plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Free Plan</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">
                  $0
                  <span className="text-lg text-gray-500">/month</span>
                </div>
                <p className="text-gray-600">After 7-day trial</p>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span>10 tracked products</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span>1-2 price alerts per month</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span>30-day price history</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                  <span>Basic support</span>
                </li>
              </ul>

              <Link to="/auth" className="w-full bg-gray-100 text-gray-900 py-3 px-6 rounded-lg font-semibold hover:bg-gray-200 transition-colors block text-center">
                Get Started Free
              </Link>
            </div>

            {/* Basic Plan */}
            <PricingCard
              title="Basic"
              isPopular={true}
              monthlyPrice={basicMonthly}
              yearlyPrice={basicYearly}
              features={basicFeatures}
              buttonText="Choose Basic"
              buttonColor="blue"
            />

            {/* Premium Plan */}
            <PricingCard
              title="Premium"
              isPopular={false}
              monthlyPrice={premiumMonthly}
              yearlyPrice={premiumYearly}
              features={premiumFeatures}
              buttonText="Choose Premium"
              buttonColor="gray"
            />

            {/* Extra Plans from backend */}
            {extraPlans.map((p) => (
              <PricingCard
                key={p.title}
                title={p.title}
                isPopular={false}
                monthlyPrice={p.monthlyPrice ?? 0}
                yearlyPrice={p.yearlyPrice ?? (p.monthlyPrice ? Math.round((p.monthlyPrice * 12) * 0.83) : 0)}
                features={p.features}
                buttonText={`Choose ${p.title}`}
                buttonColor="gray"
              />
            ))}
          </div>

          {/* Trust Indicators */}
          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">Trusted by thousands of users worldwide</p>
            <div className="flex justify-center items-center gap-8 text-gray-400">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                <span>Secure payments</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>24/7 support</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works">
        <HowItWorksSection />
      </section>

      {/* FAQ */}
      <section id="faq">
        <FAQSection />
      </section>

      {/* CTA */}
      <CTASection />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Landing; 