import React, { useState, useEffect } from 'react';
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
  Award,
  Sparkles,
  Brain,
  LineChart,
  Search,
  LayoutGrid
} from 'lucide-react';

// --- Types ---
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
  description?: string;
}

const DEFAULT_LANDING_PLANS: LandingPlan[] = [
  {
    id: 'free',
    name: 'Free Starter',
    price: 0,
    currency: 'USD',
    interval: 'monthly',
    features: {
      maxTrackedProducts: 5,
      alertFrequency: 'daily',
      priceHistoryDays: 90,
      exportData: false,
      prioritySupport: false,
    },
    description: "Perfect for casual shoppers."
  },
  {
    id: 'pro_monthly',
    name: 'Pro Monthly',
    price: 4.99,
    currency: 'USD',
    interval: 'monthly',
    features: {
      maxTrackedProducts: 9999, // Unlimited representation
      alertFrequency: 'instant',
      priceHistoryDays: 365,
      exportData: true,
      prioritySupport: true,
    },
    description: "For power users & resellers."
  },
  {
    id: 'pro_yearly',
    name: 'Pro Yearly',
    price: 49.99,
    currency: 'USD',
    interval: 'yearly',
    features: {
      maxTrackedProducts: 9999,
      alertFrequency: 'instant',
      priceHistoryDays: 365,
      exportData: true,
      prioritySupport: true,
    },
    description: "Best value for year-round savings."
  }
];

// --- Components ---

// 1. Navigation
function Navigation() {
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm' : 'bg-transparent'
      }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="0" y="0" width="100" height="100" rx="20" fill="transparent" />
                <path d="M25 70 C35 50, 65 50, 75 30" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="75" cy="30" r="6" fill="white" />
              </svg>
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">Price Tracker</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/features" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Features</Link>
            <a href="#ai-analysis" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">AI Analysis</a>
            <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Pricing</a>
            <Link to="/contact" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Contact</Link>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <Link
                to="/dashboard"
                className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-full font-medium transition-all hover:shadow-lg hover:shadow-slate-500/20 flex items-center gap-2"
              >
                <LayoutGrid className="w-4 h-4" />
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/auth" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">
                  Login
                </Link>
                <Link
                  to="/auth"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full font-medium transition-all hover:shadow-lg hover:shadow-indigo-500/30"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-slate-600"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-100 bg-white absolute left-0 right-0 px-4 shadow-xl">
            <div className="space-y-4">
              <Link to="/features" className="block text-slate-600 hover:text-indigo-600 font-medium" onClick={() => setIsMenuOpen(false)}>Features</Link>
              <a href="#ai-analysis" className="block text-slate-600 hover:text-indigo-600 font-medium" onClick={() => setIsMenuOpen(false)}>AI Analysis</a>
              <a href="#pricing" className="block text-slate-600 hover:text-indigo-600 font-medium" onClick={() => setIsMenuOpen(false)}>Pricing</a>
              <Link to="/contact" className="block text-slate-600 hover:text-indigo-600 font-medium" onClick={() => setIsMenuOpen(false)}>Contact</Link>

              <div className="pt-4 border-t border-slate-100 space-y-3">
                <Link to="/auth" className="block w-full text-center py-2.5 text-slate-600 font-medium">
                  Login
                </Link>
                <Link to="/auth" className="block w-full bg-indigo-600 text-white text-center py-2.5 rounded-lg font-medium">
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

// 2. Hero Section
function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px]" />
        <div className="absolute top-20 right-1/4 w-[400px] h-[400px] bg-violet-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-sm font-medium mb-6 animate-fade-in-up">
            <Sparkles className="w-4 h-4" />
            <span>New: AI-Powered Price Predictions</span>
          </div>

          <h1 className="text-5xl lg:text-7xl font-bold text-slate-900 tracking-tight mb-8 leading-tight">
            Stop Overpaying. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
              Shop Like a Pro.
            </span>
          </h1>

          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            The all-in-one price tracker that uses AI to predict price drops, find hidden coupons, calculates prices globally and track prices across Amazon, eBay, Walmart, and more.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => window.open('https://chrome.google.com/webstore', '_blank')}
              className="group bg-slate-900 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/20 hover:-translate-y-1 flex items-center gap-3"
            >
              <Chrome className="w-5 h-5" />
              Add to Chrome
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-4 rounded-full font-semibold text-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all flex items-center gap-2"
            >
              <Play className="w-5 h-5" />
              Watch Demo
            </button>
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="relative mx-auto max-w-5xl">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-2xl blur opacity-20" />
          <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200/50">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50/50">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400/80" />
                <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                <div className="w-3 h-3 rounded-full bg-green-400/80" />
              </div>
              <div className="ml-4 flex-1 bg-white h-6 rounded-md border border-slate-200/50 max-w-sm" />
            </div>
            {/* Abstract UI Representation */}
            <div className="p-8 grid grid-cols-3 gap-6 bg-slate-50/30">
              <div className="col-span-2 space-y-6">
                <div className="h-64 bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                  <div className="flex justify-between mb-6">
                    <div className="w-32 h-6 bg-slate-100 rounded" />
                    <div className="w-16 h-6 bg-green-100 rounded text-green-600 text-xs flex items-center justify-center font-medium">Active</div>
                  </div>
                  <div className="flex items-end justify-between h-40 gap-2">
                    {[40, 60, 45, 70, 50, 80, 65, 85, 55, 90].map((h, i) => (
                      <div key={i} className="w-full bg-indigo-100 rounded-t-sm relative group">
                        <div
                          className="absolute bottom-0 w-full bg-indigo-500 rounded-t-sm transition-all duration-500 group-hover:bg-indigo-600"
                          style={{ height: `${h}%` }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="h-32 bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex flex-col justify-between">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-slate-900">$1,240</div>
                      <div className="text-sm text-slate-500">Total Savings</div>
                    </div>
                  </div>
                  <div className="h-32 bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex flex-col justify-between">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Bell className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-slate-900">12</div>
                      <div className="text-sm text-slate-500">Active Alerts</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                    <div className="flex gap-3 mb-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-lg" />
                      <div className="space-y-1">
                        <div className="w-24 h-4 bg-slate-100 rounded" />
                        <div className="w-16 h-3 bg-slate-50 rounded" />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="w-16 h-5 bg-slate-100 rounded" />
                      <div className="w-20 h-8 bg-indigo-600 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// 2.5 Platform Logos - Infinite Scroll Marquee
function PlatformLogos() {
  const logos = [
    { name: 'Amazon', file: 'amazon.svg' },
    { name: 'eBay', file: 'ebay.svg' },
    { name: 'Walmart', file: 'walmart.svg' },
    { name: 'Target', file: 'target.svg' },
    { name: 'Best Buy', file: 'bestbuy.svg' },
    { name: 'AliExpress', file: 'aliexpress.svg' },
    { name: 'Shein', file: 'shein.svg' },
  ];

  // Double the logos for seamless infinite scroll
  const allLogos = [...logos, ...logos];

  return (
    <section className="py-12 border-y border-slate-100 bg-gradient-to-r from-slate-50 via-white to-slate-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm font-medium text-slate-500 mb-8 tracking-wider uppercase">
          Trusted by Shoppers on
        </p>
      </div>

      {/* Marquee Container */}
      <div className="relative">
        {/* Gradient fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        {/* Scrolling track */}
        <div className="flex animate-marquee hover:pause-animation">
          {allLogos.map((logo, index) => (
            <div
              key={`${logo.name}-${index}`}
              className="flex-shrink-0 mx-8 md:mx-12 group"
            >
              <img
                src={`/logos/${logo.file}`}
                alt={`${logo.name} logo`}
                className="h-10 md:h-12 w-auto object-contain opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300 hover:scale-110 cursor-pointer"
                onError={(e) => {
                  // Fallback to text if image fails
                  (e.target as HTMLImageElement).style.display = 'none';
                  const parent = (e.target as HTMLImageElement).parentElement;
                  if (parent) {
                    parent.innerHTML = `<span class="text-slate-400 font-bold text-xl whitespace-nowrap">${logo.name}</span>`;
                  }
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee 25s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}


// 3. AI Features Section (Dark Mode)
function AISection() {
  return (
    <section id="ai-analysis" className="py-24 bg-slate-900 text-white overflow-hidden relative">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-violet-500/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm font-medium mb-6">
              <Brain className="w-4 h-4" />
              <span>Powered by Advanced AI</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 tracking-tight">
              Shopping Intelligence <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
                From the Future.
              </span>
            </h2>
            <p className="text-lg text-slate-400 mb-8 leading-relaxed">
              Our AI analyzes millions of data points to predict price trends, assess deal quality, and find hidden discounts that other tools miss.
            </p>

            <div className="space-y-6">
              {[
                { title: 'Price Prediction', desc: 'Know if the price will drop in the next 7 days.', icon: LineChart },
                { title: 'Deal Quality Score', desc: 'Instant 1-10 rating based on historical data.', icon: Star },
                { title: 'Smart Coupons', desc: 'Automatically tests the best codes for you.', icon: Zap }
              ].map((feature, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0 border border-slate-700">
                    <feature.icon className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-1">{feature.title}</h3>
                    <p className="text-slate-400">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-3xl blur-2xl opacity-20" />
            <div className="relative bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-3xl p-8">
              {/* AI Card Simulation */}
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-700 pb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-lg p-2">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" alt="Product" className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <div className="font-medium text-white">Sony WH-1000XM5</div>
                      <div className="text-sm text-slate-400">Amazon.com</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">$348.00</div>
                    <div className="text-sm text-green-400">-13% Drop</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-slate-400">AI Recommendation</span>
                      <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs font-medium">Strong Buy</span>
                    </div>
                    <p className="text-sm text-slate-300">
                      Price is at a 6-month low. AI predicts a 85% chance of price increase within 48 hours.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50 text-center">
                      <div className="text-sm text-slate-400 mb-1">Deal Score</div>
                      <div className="text-3xl font-bold text-indigo-400">9.2<span className="text-sm text-slate-500">/10</span></div>
                    </div>
                    <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50 text-center">
                      <div className="text-sm text-slate-400 mb-1">Potential Savings</div>
                      <div className="text-3xl font-bold text-green-400">$52</div>
                    </div>
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

// 4. Features Bento Grid
function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
            Everything You Need to Save
          </h2>
          <p className="text-lg text-slate-600">
            Powerful tools designed to help you make smarter purchasing decisions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Large Card */}
          <div className="md:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="relative z-10">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
                <Globe className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Universal Tracking</h3>
              <p className="text-slate-600 max-w-md">
                One extension for every store. Track prices on Amazon, eBay, Walmart, AliExpress, and hundreds more with a single click.
              </p>
            </div>
            <div className="absolute right-0 bottom-0 w-1/2 h-full bg-gradient-to-l from-indigo-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* Tall Card */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow md:row-span-2">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
              <Bell className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Instant Alerts</h3>
            <p className="text-slate-600 mb-8">
              Set your target price and get notified the second it drops. Never miss a flash sale again.
            </p>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <div className="text-sm font-medium text-slate-700">Price dropped by 15%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Standard Card */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
              <LineChart className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Price History</h3>
            <p className="text-slate-600">
              View 365-day price history charts to spot trends and fake discounts.
            </p>
          </div>

          {/* Standard Card */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-6">
              <Shield className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Privacy First</h3>
            <p className="text-slate-600">
              We don't sell your data. Your shopping habits remain private and secure.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// 5. Pricing Section
function PricingSection({ plans }: { plans: LandingPlan[] }) {
  const [isYearly, setIsYearly] = useState(false);

  // Helper to find plans
  const findPlan = (interval: 'monthly' | 'yearly') => {
    // Find PRO plan for the interval
    return plans.find(p => p.id.startsWith('pro') && p.interval === interval);
  };

  const currentProPlan = findPlan(isYearly ? 'yearly' : 'monthly');
  // Free plan is static but might come from API with 'free' ID
  const freePlan = plans.find(p => p.id === 'free') || DEFAULT_LANDING_PLANS[0];

  return (
    <section id="pricing" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-slate-600 mb-8">
            Start for free, upgrade when you need more power.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-full border border-slate-200">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${!isYearly ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${isYearly ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
            >
              Yearly <span className="text-green-600 text-xs ml-1">-20%</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Plan */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="mb-4">
              <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold uppercase tracking-wider">Starter</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Free Forever</h3>
            <div className="text-4xl font-bold text-slate-900 mb-4">$0<span className="text-base font-normal text-slate-500">/mo</span></div>
            <p className="text-slate-600 mb-8 text-sm">{freePlan?.description || "Perfect for casual shoppers."}</p>
            <Link to="/auth" className="block w-full py-4 px-6 rounded-xl bg-slate-100 text-slate-900 font-semibold text-center hover:bg-slate-200 transition-colors">
              Get Started Free
            </Link>
            <ul className="mt-8 space-y-4">
              {['10 Products Per Month', '1 Notification/Day', 'Price History', 'Basic Support'].map((feat, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-slate-600">
                  <CheckCircle className="w-5 h-5 text-slate-400" />
                  {feat}
                </li>
              ))}
            </ul>
          </div>

          {/* Pro Plan */}
          <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 bg-gradient-to-bl from-indigo-500 to-transparent w-24 h-24 opacity-20" />
            <div className="mb-4">
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-semibold uppercase tracking-wider border border-indigo-500/30">Most Popular</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
            <div className="text-4xl font-bold text-white mb-4">
              ${currentProPlan?.price ?? '4.99'}
              <span className="text-base font-normal text-slate-400">/{currentProPlan?.interval === 'yearly' ? 'year' : 'mo'}</span>
            </div>
            <p className="text-slate-400 mb-8 text-sm">{currentProPlan?.description || "For power users & resellers."}</p>
            <Link to="/auth" className="block w-full py-4 px-6 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-center hover:shadow-lg hover:shadow-indigo-500/25 transition-all">
              Go Pro
            </Link>
            <ul className="mt-8 space-y-4">
              {[
                'Unlimited Product Tracking',
                'Unlimited Notifications',
                'AI Smart Recommendations',
                'Export Data (CSV)',
                'Global Price Comparison',
                'Email Alerts'
              ].map((feat, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-slate-300">
                  <CheckCircle className="w-5 h-5 text-indigo-400" />
                  {feat}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

// 6. FAQ Section
function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const faqs = [
    { q: "Is Price Tracker really free?", a: "Yes! We have a generous free plan that lets you track up to 10 Products per month." },
    { q: "How fast are the alerts?", a: "Premium users get instant alerts within seconds of a price drop. Free users get daily updates." },
    { q: "Which sites do you support?", a: "We support most major retailers including Amazon, eBay, Walmart, Best Buy, Target, Shein and AliExpress." },
    { q: "Can I cancel anytime?", a: "Absolutely. There are no contracts and you can cancel your subscription with one click." }
  ];

  return (
    <section id="faq" className="py-24 bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center tracking-tight">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <span className="font-semibold text-slate-900">{faq.q}</span>
                <ArrowRight className={`w-5 h-5 text-slate-400 transition-transform ${openIndex === i ? 'rotate-90' : ''}`} />
              </button>
              {openIndex === i && (
                <div className="px-6 pb-4 text-slate-600 leading-relaxed">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// 7. Footer
function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-500/20">
                <svg width="20" height="20" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M25 70 C35 50, 65 50, 75 30" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="75" cy="30" r="6" fill="white" />
                </svg>
              </div>
              <span className="font-bold text-slate-900">Price Tracker</span>
            </div>
            <p className="text-slate-500 text-sm">
              Smart shopping tools for the modern era. Save money automatically.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><Link to="/features" className="hover:text-indigo-600">Features</Link></li>
              <li><a href="#pricing" className="hover:text-indigo-600">Pricing</a></li>
              <li><Link to="/auth" className="hover:text-indigo-600">Login</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><Link to="/about" className="hover:text-indigo-600">About</Link></li>
              <li><Link to="/privacy-policy" className="hover:text-indigo-600">Privacy</Link></li>
              <li><Link to="/terms-and-conditions" className="hover:text-indigo-600">Terms</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 mb-4">Connect</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li><a href="#" className="hover:text-indigo-600">Twitter</a></li>
              <li><a href="#" className="hover:text-indigo-600">GitHub</a></li>
              <li><Link to="/contact" className="hover:text-indigo-600">Contact</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-100 pt-8 text-center text-sm text-slate-500">
          &copy; {new Date().getFullYear()} Price Tracker. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

// --- Main Landing Component ---
const Landing: React.FC = () => {
  const [plans, setPlans] = useState<LandingPlan[]>(DEFAULT_LANDING_PLANS);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/payments/plans');
        const json = await res.json();
        if (json?.success && Array.isArray(json.data?.plans)) {
          // Map API plans to LandingPlan if structure differs, or just use if matches.
          // For now assuming we rely on DEFAULT_LANDING_PLANS unless API returns something compatible
          // If API returns different structure we might need mapping.
          // Let's stick to defaults for consistency with Subscription page styles requested for now
          // setPlans(json.data.plans); 
        }
      } catch (_) {
        // ignore
      }
    })();
  }, []);

  const effectivePlans = DEFAULT_LANDING_PLANS; // Force defaults to ensure matching design for now

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <Navigation />
      <HeroSection />
      <PlatformLogos />
      <FeaturesSection />
      <AISection />
      <PricingSection plans={effectivePlans} />
      <FAQSection />
      <Footer />
    </div>
  );
};

export default Landing;