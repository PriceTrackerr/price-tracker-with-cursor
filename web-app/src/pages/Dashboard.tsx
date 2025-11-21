import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthContext';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
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
  Users
} from 'lucide-react';

// Metric Card Component
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
}

function MetricCard({ title, value, subtitle, icon: Icon, trend, color, onClick }: MetricCardProps & { onClick?: () => void }) {
  const colorClasses = {
    blue: {
      bg: 'from-blue-500 to-blue-600',
      light: 'from-blue-50 to-blue-100',
      text: 'text-blue-600',
      icon: 'text-blue-600'
    },
    green: {
      bg: 'from-green-500 to-green-600',
      light: 'from-green-50 to-green-100',
      text: 'text-green-600',
      icon: 'text-green-600'
    },
    orange: {
      bg: 'from-orange-500 to-orange-600',
      light: 'from-orange-50 to-orange-100',
      text: 'text-orange-600',
      icon: 'text-orange-600'
    },
    purple: {
      bg: 'from-purple-500 to-purple-600',
      light: 'from-purple-50 to-purple-100',
      text: 'text-purple-600',
      icon: 'text-purple-600'
    }
  };

  const colors = colorClasses[color];

  return (
    <div 
      className={`relative overflow-hidden border-0 shadow-lg shadow-gray-200/50 hover:shadow-xl hover:shadow-gray-200/60 transition-all duration-300 hover:-translate-y-1 bg-white rounded-xl ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className={`absolute inset-0 bg-gradient-to-br opacity-5 ${colors.bg}`} />
      <div className="relative p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-gray-900">{value}</p>
              {subtitle && (
                <p className="text-sm text-gray-500">{subtitle}</p>
              )}
            </div>
            {trend && (
              <div className="flex items-center gap-1">
                <span className={`text-sm font-medium ${
                  trend.isPositive ? "text-green-600" : "text-red-600"
                }`}>
                  {trend.isPositive ? '+' : ''}{trend.value}
                </span>
                <span className="text-sm text-gray-500">from last month</span>
              </div>
            )}
          </div>
          <div className={`w-12 h-12 rounded-lg bg-gradient-to-br flex items-center justify-center ${colors.light}`}>
            <Icon className={`w-6 h-6 ${colors.icon}`} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Create Alert Modal Component
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Create Price Alert</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XCircle className="w-6 h-6" />
          </button>
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">Product: {product.title}</p>
          <p className="text-sm text-gray-600 mb-4">Current Price: ${product.price}</p>
          
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Price
          </label>
          <div className="relative">
            <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="number"
              step="0.01"
              min="0"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              placeholder="Enter target price"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateAlert}
            disabled={loading || !targetPrice || parseFloat(targetPrice) <= 0}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Creating...' : 'Create Alert'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Product Table Component
function ProductTable({ searchTerm, navigate }: { searchTerm: string; navigate: any }) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const { t } = useTranslation();
  const { loading: authLoading, token } = useAuth();

  console.log('Dashboard ProductTable - Component rendered:', { authLoading, hasToken: !!token, productsCount: products.length });

  useEffect(() => {
    // Wait for auth to be ready before fetching data
    if (!authLoading && token) {
      fetchProducts();
    }
  }, [authLoading, token]);

  const fetchProducts = async () => {
    if (!token) return;
    
    try {
      const response = await fetch('/api/products', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      console.log('Dashboard ProductTable - API Response:', data);
      if (data.success) {
        // Sort by date (newest first) and show ALL products
        const sortedProducts = data.data.sort((a: any, b: any) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        console.log('Dashboard ProductTable - Setting products:', sortedProducts.length);
        setProducts(sortedProducts);
      } else {
        console.error('Failed to fetch products:', data.message);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriceChange = (product: any) => {
    if (!product.priceHistory || product.priceHistory.length < 2) return null;
    const current = product.priceHistory[product.priceHistory.length - 1]?.price;
    const previous = product.priceHistory[product.priceHistory.length - 2]?.price;
    if (!current || !previous) return null;
    const change = current - previous;
    const percentChange = (change / previous) * 100;
    return {
      value: Math.abs(change).toFixed(2),
      percent: Math.abs(percentChange).toFixed(1),
      isPositive: change < 0
    };
  };

  // Mock price change data for demo (remove when real data is available)
  const getMockPriceChange = (product: any) => {
    const mockChanges = [
      { value: "5.99", percent: "8.5", isPositive: true },
      { value: "12.50", percent: "15.2", isPositive: false },
      { value: "3.25", percent: "4.1", isPositive: true },
      { value: "8.75", percent: "11.3", isPositive: false }
    ];
    return mockChanges[product.id?.charCodeAt(0) % 4 || 0];
  };

  const platformColors = {
    amazon: { bg: 'bg-orange-100', text: 'text-orange-800', name: 'Amazon' },
    aliexpress: { bg: 'bg-red-100', text: 'text-red-800', name: 'AliExpress' },
    ebay: { bg: 'bg-blue-100', text: 'text-blue-800', name: 'eBay' },
    shein: { bg: 'bg-pink-100', text: 'text-pink-800', name: 'Shein' },
    walmart: { bg: 'bg-blue-100', text: 'text-blue-800', name: 'Walmart' }
  };

  const stockConfig = {
    'in_stock': { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'In Stock' },
    'out_of_stock': { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100', label: 'Out of Stock' },
    'unknown': { icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-100', label: 'Unknown' }
  };

  // Filter products based on search term
  const filteredProducts = products.filter(product => 
    product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.platform.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Properly truncate title to 50 characters
  const truncateTitle = (title: string) => {
    if (title.length <= 50) return title;
    return title.substring(0, 50) + '...';
  };

  const handleCreateAlert = (product: any) => {
    setSelectedProduct(product);
    setShowAlertModal(true);
  };

  if (loading || authLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg border-0 shadow-gray-200/50">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">All Tracked Products</h2>
              <p className="text-sm text-gray-600 mt-1">Monitor price changes across platforms (sorted by date)</p>
            </div>
            <button 
              onClick={() => navigate('/products')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              View All Products
            </button>
          </div>
          <div className="divide-y divide-gray-200">
            {filteredProducts.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No products tracked yet</p>
                <p className="text-sm">Start tracking products to see them here</p>
              </div>
            ) : (
              filteredProducts.map((product) => {
                const priceChange = getPriceChange(product);
                const platform = platformColors[product.platform as keyof typeof platformColors] || platformColors.amazon;
                const stock = stockConfig[product.stockStatus as keyof typeof stockConfig] || stockConfig.unknown;
                const StockIcon = stock.icon;

                return (
                  <div key={product.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      {/* Product Image */}
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <img
                          src={product.imageUrl || 'https://via.placeholder.com/64x64'}
                          alt={product.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64x64';
                          }}
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <h3 className="font-medium text-gray-900 truncate">
                          {truncateTitle(product.title)}
                        </h3>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${platform.bg} ${platform.text}`}>
                            {platform.name}
                          </span>
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${stock.bg}`}>
                            <StockIcon className={`w-3 h-3 ${stock.color}`} />
                            <span className={`text-xs font-medium ${stock.color}`}>{stock.label}</span>
                          </div>
                          
                          {/* Matched Products Indicator */}
                          {product.matchedProducts && product.matchedProducts.length > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              <Users className="w-3 h-3 text-blue-500" />
                              <span className="text-xs text-blue-600 font-medium">
                                {product.matchedProducts.length} match{product.matchedProducts.length !== 1 ? 'es' : ''}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Price Info */}
                      <div className="text-right space-y-1 flex-shrink-0">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-gray-900">
                            ${product.price}
                          </span>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <span className="text-sm text-gray-500 line-through">
                              ${product.originalPrice}
                            </span>
                          )}
                        </div>
                        {/* Price Change Indicator */}
                        <div className="flex items-center gap-1 justify-end">
                          {(() => {
                            const priceChange = getPriceChange(product) || getMockPriceChange(product);
                            if (!priceChange) return null;
                            
                            return (
                              <>
                                {priceChange.isPositive && <TrendingDown className="w-3 h-3 text-green-600" />}
                                {!priceChange.isPositive && <TrendingUp className="w-3 h-3 text-red-600" />}
                                <span className={`text-xs font-medium ${
                                  priceChange.isPositive ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {priceChange.isPositive ? '' : '+'}${priceChange.value} ({priceChange.percent}%)
                                </span>
                              </>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <button
                          onClick={() => handleCreateAlert(product)}
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                          title="Create Alert"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <Eye className="w-4 h-4 text-gray-600" />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                          <MoreVertical className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Create Alert Modal */}
      <CreateAlertModal 
        product={selectedProduct}
        isOpen={showAlertModal}
        onClose={() => {
          setShowAlertModal(false);
          setSelectedProduct(null);
        }}
      />
    </>
  );
}

export default function Dashboard() {
  const { getAuthHeaders, user, loading: authLoading, token } = useAuth();
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
    } finally {
      setLoading(false);
    }
  };

  // Watch for changes in seenPriceDropIds and fetch dashboard data
  useEffect(() => {
    if (token && !authLoading) {
      fetchDashboardData();
    }
  }, [seenPriceDropIds, token, authLoading]);

  // Mark price drop as seen
  const markPriceDropAsSeen = async (productId: string) => {
    try {
      const response = await fetch('/api/users/mark-price-drop-seen', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId })
      });
      
      if (response.ok) {
        // Update local state
        setSeenPriceDropIds(prev => [...prev, productId]);
        // Recalculate metrics
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error marking price drop as seen:', error);
    }
  };

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

  // Force refresh function
  const forceRefresh = () => {
    fetchSeenPriceDrops();
  };

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
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Banned User Banner */}
      {isBanned && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">Account Suspended</h3>
              <p className="text-sm text-red-700 mt-1">
                Your account has been suspended. Please contact support for assistance.
              </p>
            </div>
            <button
              onClick={() => window.open('mailto:support@pricetracker.com', '_blank')}
              className="text-sm font-medium text-red-600 hover:text-red-800 underline"
            >
              Contact Support
            </button>
          </div>
        </div>
      )}

      {/* Header with Refresh Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Track your products and monitor price changes</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={triggerPriceCheck}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 12l2 2 4-4"></path>
              <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c1.5 0 2.9.37 4.13 1.02"></path>
            </svg>
            Check Prices
          </button>
          <button
            onClick={updatePriceHistory}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
            </svg>
            Update History
          </button>
          <button
            onClick={() => {
              fetchSeenPriceDrops();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
              <path d="M21 3v5h-5"></path>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
              <path d="M3 21v-5h5"></path>
            </svg>
            Refresh
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

      {/* Recent Products */}
      <div className="bg-white rounded-xl shadow-lg border-0 shadow-gray-200/50">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Recent Tracked Products</h2>
              <p className="text-sm text-gray-600 mt-1">Monitor price changes across platforms</p>
            </div>
            <button 
              onClick={() => navigate('/products')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              View All Products
            </button>
          </div>
          <div className="divide-y divide-gray-200">
            {products.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No products tracked yet</p>
                <p className="text-sm">Start tracking products to see them here</p>
              </div>
                         ) : (
               products.map((product) => (
                 <div key={product.id} className="p-4 hover:bg-gray-50 transition-colors">
                   <div className="flex items-center gap-4">
                     {/* Product Image */}
                     <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                       <img
                         src={product.imageUrl || 'https://via.placeholder.com/64x64'}
                         alt={product.title}
                         className="w-full h-full object-cover"
                         onError={(e) => {
                           (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64x64';
                         }}
                       />
                     </div>
                     
                     {/* Product Info */}
                     <div className="flex-1 min-w-0 space-y-2">
                       <h3 className="font-medium text-gray-900 truncate">
                         {product.title.length > 50 ? product.title.substring(0, 50) + '...' : product.title}
                       </h3>
                       <p className="text-sm text-gray-500 capitalize">{product.platform}</p>
                     </div>
                     
                     {/* Price Info */}
                     <div className="text-right space-y-1 flex-shrink-0">
                       <div className="flex items-center gap-2">
                         <span className="text-lg font-bold text-gray-900">
                           ${product.price}
                         </span>
                         {product.originalPrice && product.originalPrice > product.price && (
                           <span className="text-sm text-gray-500 line-through">
                             ${product.originalPrice}
                           </span>
                         )}
                       </div>
                     </div>
                     
                     {/* Action Buttons */}
                     <div className="flex items-center space-x-2 flex-shrink-0">
                       <button
                         onClick={() => {
                           setSelectedProduct(product);
                           setShowAlertModal(true);
                         }}
                         className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                         title="Create Alert"
                       >
                         <Plus className="w-4 h-4" />
                       </button>
                       <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                         <Eye className="w-4 h-4 text-gray-600" />
                       </button>
                       <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                         <MoreVertical className="w-4 h-4 text-gray-600" />
                       </button>
                     </div>
                   </div>
                 </div>
               ))
             )}
          </div>
        </div>
      </div>
      
             {/* Original ProductTable (commented out for debugging) */}
       {/* <ProductTable searchTerm="" navigate={navigate} /> */}
       
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