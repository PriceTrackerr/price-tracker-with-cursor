import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Package,
  DollarSign,
  TrendingDown,
  Bell,
  ExternalLink,
  MoreVertical,
  Eye,
  Trash2,
  Search,
  User,
  Settings,
  LogOut,
  ChevronDown,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Minus,
  Plus,
  Target,
  Users,
  RefreshCw,
  Clock,
  Sparkles,
  ArrowRight,
  Menu,
  X
} from 'lucide-react';

// --- Components ---

// 1. Navigation
function DashboardNav() {
  const { logout, user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-500/20">
              <svg width="20" height="20" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="0" y="0" width="100" height="100" rx="20" fill="transparent" />
                <path d="M25 70 C35 50, 65 50, 75 30" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="75" cy="30" r="6" fill="white" />
              </svg>
            </div>
            <span className="text-lg font-bold text-slate-900 tracking-tight">Price Tracker</span>
          </Link>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-200/50">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold text-sm">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="text-sm font-medium text-slate-700 pr-2">{user?.email}</span>
            </div>
            <button
              onClick={logout}
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-slate-600"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 shadow-xl">
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-lg">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold text-sm">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="text-sm font-medium text-slate-700">{user?.email}</span>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}

// 2. Metric Card Component
interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color: 'blue' | 'green' | 'orange' | 'purple';
  onClick?: () => void;
}

function MetricCard({ title, value, subtitle, icon: Icon, trend, color, onClick }: MetricCardProps) {
  const colorStyles = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'text-blue-600' },
    green: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: 'text-emerald-600' },
    orange: { bg: 'bg-orange-50', text: 'text-orange-600', icon: 'text-orange-600' },
    purple: { bg: 'bg-violet-50', text: 'text-violet-600', icon: 'text-violet-600' }
  };

  const style = colorStyles[color];

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden bg-white rounded-2xl p-6 border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300 group ${onClick ? 'cursor-pointer hover:-translate-y-1' : ''}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-xl ${style.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={`w-6 h-6 ${style.icon}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm font-medium ${trend.isPositive ? 'text-emerald-600' : 'text-rose-600'} bg-white px-2 py-1 rounded-full border border-slate-100 shadow-sm`}>
            {trend.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend.value}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-slate-500 text-sm font-medium mb-1">{title}</h3>
        <div className="text-3xl font-bold text-slate-900 tracking-tight mb-1">{value}</div>
        {subtitle && <p className="text-slate-400 text-sm">{subtitle}</p>}
      </div>

      {/* Decorative gradient blob */}
      <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full ${style.bg} opacity-50 blur-2xl group-hover:opacity-100 transition-opacity`} />
    </div>
  );
}

// 3. Create Alert Modal Component
function CreateAlertModal({ product, isOpen, onClose }: { product: any, isOpen: boolean, onClose: () => void }) {
  const [targetPrice, setTargetPrice] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateAlert = async () => {
    if (!targetPrice || parseFloat(targetPrice) <= 0) return;

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
      } else {
        console.error('Alert creation failed:', data);
        toast.error(data.message || 'Failed to create alert');
      }
    } catch (error) {
      console.error('Error creating alert:', error);
      toast.error('Error creating alert');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-in">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-lg font-semibold text-slate-900">Create Price Alert</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <p className="text-sm text-slate-500 mb-1">Product</p>
            <p className="text-slate-900 font-medium truncate">{product.title}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-slate-500">Current Price:</span>
              <span className="text-lg font-bold text-slate-900">${product.price}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Target Price
            </label>
            <div className="relative">
              <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="number"
                step="0.01"
                min="0"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="Enter target price"
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              We'll notify you when the price drops below this amount.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateAlert}
            disabled={loading || !targetPrice || parseFloat(targetPrice) <= 0}
            className="px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/20"
          >
            {loading ? 'Creating...' : 'Create Alert'}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Main Dashboard Component ---
export default function Dashboard() {
  const { getAuthHeaders, user, loading: authLoading, token, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [products, setProducts] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalProducts: 0,
    totalValue: 0,
    priceDrops: 0,
    activeAlerts: 0
  });
  const [seenPriceDropIds, setSeenPriceDropIds] = useState<string[]>([]);
  const [isBanned, setIsBanned] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showAlertModal, setShowAlertModal] = useState(false);

  const fetchDashboardData = async () => {
    if (!token) {
      console.log('Dashboard - No token available');
      return;
    }

    console.log('Dashboard - Fetching dashboard data...');
    try {
      const timestamp = Date.now();
      const randomParam = Math.random().toString(36).substring(7);

      const [productsRes, alertsRes] = await Promise.all([
        fetch(`/api/products?t=${timestamp}&r=${randomParam}&fresh=true`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }),
        fetch(`/api/alerts?t=${timestamp}&r=${randomParam}&fresh=true`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        })
      ]);

      // Check if user is banned (403 status)
      if (productsRes.status === 403) {
        setProducts([]);
        setAlerts([]);
        setIsBanned(true);
        return;
      }

      const productsData = await productsRes.json();
      const alertsData = await alertsRes.json();

      if (productsData.success) {
        const productsArray = productsData.data;
        console.log('Dashboard - Products fetched:', productsArray.length);
        setProducts(productsArray);
        const totalValue = productsArray.reduce((sum: number, p: any) => sum + (p.price || 0), 0);

        // Only calculate price drops if we have seen price drop IDs loaded
        // This prevents temporary numbers from showing
        const priceDrops = productsArray.filter((p: any) => {
          if (!p.priceHistory || p.priceHistory.length < 2) {
            return false;
          }

          const sortedHistory = p.priceHistory.sort((a: any, b: any) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );

          const last = sortedHistory[sortedHistory.length - 1];
          const prev = sortedHistory[sortedHistory.length - 2];

          const hasDrop = last && prev && last.price < prev.price;
          const isSeen = seenPriceDropIds.includes(p.id);

          return hasDrop && !isSeen; // Only count unseen price drops
        }).length;

        // Force immediate state update
        console.log('Dashboard - Setting products in main component:', productsArray.length);
        setMetrics(prevMetrics => ({
          ...prevMetrics,
          totalProducts: productsArray.length,
          totalValue: totalValue,
          priceDrops: priceDrops,
          activeAlerts: alertsData.success ? alertsData.data.filter((alert: any) => alert.isActive).length : 0
        }));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerPriceCheck = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/alerts/trigger-check', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Price check completed! Check notifications for any alerts.');
        // Refresh dashboard data to show updated prices
        fetchDashboardData();
      } else {
        toast.error('Failed to trigger price check');
      }
    } catch (error) {
      console.error('Error triggering price check:', error);
      toast.error('Error triggering price check');
    }
  };

  const updatePriceHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Update price history for all products
      const updatePromises = products.map(product =>
        fetch(`/api/alerts/update-price-history/${product.id}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
      );

      await Promise.all(updatePromises);
      toast.success('Price history updated for all products!');
      fetchDashboardData();
    } catch (error) {
      console.error('Error updating price history:', error);
      toast.error('Error updating price history');
    }
  };

  // Fetch seen price drops first, then dashboard data
  const fetchSeenPriceDrops = async () => {
    if (!token) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/users/seen-price-drops', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setSeenPriceDropIds(data.data);
        // Don't call fetchDashboardData here - let useEffect handle it
      }
    } catch (error) {
      console.error('Error fetching seen price drops:', error);
    }
  };

  // Watch for changes in seenPriceDropIds and fetch dashboard data
  useEffect(() => {
    if (token && !authLoading) {
      fetchDashboardData();
    }
  }, [seenPriceDropIds, token, authLoading]);

  // Handle price drops card click
  const handlePriceDropsClick = () => {
    // Get products with price drops
    const productsWithDrops = products.filter((p: any) => {
      if (!p.priceHistory || p.priceHistory.length < 2) return false;
      const sortedHistory = p.priceHistory.sort((a: any, b: any) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      const last = sortedHistory[sortedHistory.length - 1];
      const prev = sortedHistory[sortedHistory.length - 2];
      const hasDrop = last && prev && last.price < prev.price;
      const isSeen = seenPriceDropIds.includes(p.id);
      return hasDrop && !isSeen;
    });

    if (productsWithDrops.length > 0) {
      const dropIds = productsWithDrops.map((p: any) => p.id).join(',');
      navigate(`/history?highlight=${dropIds}`);
    } else {
      // If no price drops, just navigate to history page
      navigate('/history');
    }
  };

  useEffect(() => {
    if (token && !authLoading && seenPriceDropIds.length === 0) {
      fetchSeenPriceDrops();
    }
  }, [token, authLoading]);

  // Listen for price drop marked as seen events
  useEffect(() => {
    const handlePriceDropMarkedAsSeen = () => {
      fetchSeenPriceDrops();
    };

    window.addEventListener('priceDropMarkedAsSeen', handlePriceDropMarkedAsSeen);

    return () => {
      window.removeEventListener('priceDropMarkedAsSeen', handlePriceDropMarkedAsSeen);
    };
  }, []);

  // Auto-refresh when page becomes visible (when user returns from tracking)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && !authLoading && token) {
        fetchSeenPriceDrops();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [authLoading, token]);

  // Show loading screen
  if (authLoading || loading && products.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const platformColors = {
    amazon: { bg: 'bg-orange-50 text-orange-600', border: 'border-orange-200', name: 'Amazon' },
    aliexpress: { bg: 'bg-red-50 text-red-600', border: 'border-red-200', name: 'AliExpress' },
    ebay: { bg: 'bg-blue-50 text-blue-600', border: 'border-blue-200', name: 'eBay' },
    shein: { bg: 'bg-pink-50 text-pink-600', border: 'border-pink-200', name: 'Shein' },
    walmart: { bg: 'bg-blue-50 text-blue-600', border: 'border-blue-200', name: 'Walmart' }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <DashboardNav />

      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-[100px]" />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* Banned User Banner */}
        {isBanned && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center gap-3 animate-fade-in">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-rose-900">Account Suspended</h3>
              <p className="text-sm text-rose-700 mt-1">
                Your account has been suspended. Please contact support for assistance.
              </p>
            </div>
            <button
              onClick={() => window.open('mailto:support@pricetracker.com', '_blank')}
              className="text-sm font-medium text-rose-600 hover:text-rose-800 underline"
            >
              Contact Support
            </button>
          </div>
        )}

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
            <p className="text-slate-500 mt-1">Overview of your tracked products and savings</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={triggerPriceCheck}
              className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Check Prices</span>
            </button>
            <button
              onClick={updatePriceHistory}
              className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md"
            >
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">Update History</span>
            </button>
            <button
              onClick={() => fetchSeenPriceDrops()}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/20 transition-all hover:shadow-indigo-500/30 hover:-translate-y-0.5"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Products"
            value={metrics.totalProducts}
            subtitle="Across 5 platforms"
            icon={Package}
            trend={{ value: "12%", isPositive: true }}
            color="blue"
            onClick={() => navigate('/products')}
          />
          <MetricCard
            title="Total Value"
            value={`$${metrics.totalValue.toLocaleString()}`}
            subtitle="Tracked value"
            icon={DollarSign}
            trend={{ value: "8%", isPositive: true }}
            color="green"
            onClick={() => navigate('/products')}
          />
          <MetricCard
            title="Price Drops"
            value={metrics.priceDrops}
            subtitle="This week"
            icon={TrendingDown}
            trend={{ value: "15%", isPositive: true }}
            color="orange"
            onClick={handlePriceDropsClick}
          />
          <MetricCard
            title="Active Alerts"
            value={metrics.activeAlerts}
            subtitle="Monitoring"
            icon={Bell}
            color="purple"
            onClick={() => navigate('/alerts')}
          />
        </div>

        {/* Recent Products Section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Recent Tracked Products</h2>
              <p className="text-sm text-slate-500 mt-0.5">Monitor price changes across platforms</p>
            </div>
            <button
              onClick={() => navigate('/products')}
              className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {products.length === 0 ? (
              <div className="p-16 text-center">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-1">No products tracked yet</h3>
                <p className="text-slate-500 mb-6">Start tracking products to see them here</p>
                <button
                  onClick={() => window.open('https://chrome.google.com/webstore', '_blank')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Install Extension
                </button>
              </div>
            ) : (
              products.map((product) => {
                const platform = platformColors[product.platform as keyof typeof platformColors] || platformColors.amazon;

                return (
                  <div key={product.id} className="p-4 hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center gap-4">
                      {/* Product Image */}
                      <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-white border border-slate-200 flex-shrink-0 shadow-sm">
                        <img
                          src={product.imageUrl || 'https://via.placeholder.com/64x64'}
                          alt={product.title}
                          className="w-full h-full object-contain p-1"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64x64';
                          }}
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <h3 className="font-medium text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                          {product.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${platform.bg} ${platform.border} border`}>
                            {platform.name}
                          </span>
                          <span className="text-xs text-slate-400">Added {new Date(product.createdAt || Date.now()).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Price Info */}
                      <div className="text-right space-y-1 flex-shrink-0">
                        <div className="flex items-center gap-2 justify-end">
                          <span className="text-lg font-bold text-slate-900">
                            ${product.price}
                          </span>
                        </div>
                        {product.originalPrice && product.originalPrice > product.price && (
                          <span className="text-sm text-slate-400 line-through block">
                            ${product.originalPrice}
                          </span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity pl-4">
                        <button
                          onClick={() => {
                            setSelectedProduct(product);
                            setShowAlertModal(true);
                          }}
                          className="p-2 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
                          title="Create Alert"
                        >
                          <Bell className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-900 rounded-lg transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-900 rounded-lg transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* Create Alert Modal */}
      <CreateAlertModal
        product={selectedProduct}
        isOpen={showAlertModal}
        onClose={() => {
          setShowAlertModal(false);
          setSelectedProduct(null);
        }}
      />
    </div>
  );
}