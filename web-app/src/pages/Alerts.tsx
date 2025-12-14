import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  Filter,
  ArrowUpDown,
  Plus,
  Trash2,
  Target,
  TrendingUp,
  TrendingDown,
  Package,
  X,
  AlertTriangle
} from 'lucide-react';
import { User } from '../components/AuthContext';
import toast from 'react-hot-toast';
import { useAuth } from '../components/AuthContext';
import { useTranslation } from 'react-i18next';
import PriceDisplay from '../components/PriceDisplay';
import { useLocation } from 'react-router-dom';

interface Product {
  id: string;
  title: string;
  price: number;
  currency: string;
  platform: 'amazon' | 'aliexpress' | 'walmart';
  imageUrl?: string;
  url: string;
  createdAt: string;
}

interface Alert {
  id: string;
  productId: string;
  productName: string;
  platform: string;
  currentPrice: number;
  targetPrice: number;
  isActive: boolean;
  isTargetReached: boolean;
  notifyOnRestock: boolean;
  createdAt: string;
}

// Alert Card Component matching Figma design exactly
function AlertCard({
  id,
  productName,
  platform,
  currentPrice,
  targetPrice,
  isActive,
  isTargetReached,
  notifyOnRestock,
  onToggleActive,
  onDelete
}: {
  id: string;
  productName: string;
  platform: string;
  currentPrice: number;
  targetPrice: number;
  isActive: boolean;
  isTargetReached: boolean;
  notifyOnRestock: boolean;
  onToggleActive: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const priceDifference = currentPrice - targetPrice;
  const isAboveTarget = currentPrice > targetPrice;

  return (
    <div className={`transition-all duration-300 border rounded-[0.625rem] p-4 ${isTargetReached
      ? 'border-green-200 dark:border-green-700/50 bg-green-50/50 dark:bg-green-900/20'
      : isActive
        ? 'border-gray-300 dark:border-gray-600 hover:border-slate-500 dark:hover:border-slate-400 bg-white dark:bg-gray-800 hover:shadow-md'
        : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'
      }`}>
      <div className="space-y-4">
        {/* Header with Product Info and Controls */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-gray-900 dark:text-white truncate">{productName}</h3>
              {isTargetReached && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Target Reached
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{platform}</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {isActive ? 'Active' : 'Inactive'}
              </span>
              <button
                onClick={() => onToggleActive(id)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isActive ? 'bg-slate-900' : 'bg-gray-300'
                  }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'
                  }`} />
              </button>
            </div>
            <button
              onClick={() => onDelete(id)}
              className="p-2 hover:bg-[#d4183d]/10 hover:text-[#d4183d] rounded transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Price Information */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Current Price</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              <PriceDisplay priceUSD={currentPrice} selectedCurrency="USD" />
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Target Price</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              <PriceDisplay priceUSD={targetPrice} selectedCurrency="USD" />
            </p>
          </div>
        </div>

        {/* Status and Progress */}
        <div className="space-y-2">
          {isTargetReached ? (
            <div className="flex items-center gap-2 p-3 bg-green-100 rounded-lg">
              <Target className="text-green-600" size={16} />
              <span className="text-sm font-medium text-green-800">
                Target price reached!
              </span>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {isAboveTarget ? 'Above target by' : 'Below target by'}
                </span>
                <div className={`flex items-center gap-1 text-sm font-medium ${isAboveTarget ? 'text-red-600' : 'text-green-600'
                  }`}>
                  {isAboveTarget ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  <PriceDisplay priceUSD={Math.abs(priceDifference)} selectedCurrency="USD" />
                </div>
              </div>

              {/* Progress Bar */}
              <div className="relative">
                <div className="w-full bg-[#ececf0] rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${isAboveTarget ? 'bg-red-500' : 'bg-green-500'
                      }`}
                    style={{
                      width: `${Math.min(Math.abs(priceDifference / targetPrice) * 100, 100)}%`
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {notifyOnRestock && (
            <div className="flex items-center gap-2 text-xs text-[#717182]">
              <Package size={12} />
              <span>Restock notifications enabled</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Create Alert Dialog Component matching Figma design
function CreateAlertDialog({
  products,
  onCreateAlert,
  user
}: {
  products: Product[];
  onCreateAlert: (alert: {
    productId: string;
    targetPrice: number;
    notifyOnRestock: boolean;
  }) => void;
  user: User | null;
}) {
  const [open, setOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [notifyOnRestock, setNotifyOnRestock] = useState(false);

  const selectedProduct = products.find(p => p.id === selectedProductId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProductId || !targetPrice) {
      return;
    }

    onCreateAlert({
      productId: selectedProductId,
      targetPrice: parseFloat(targetPrice),
      notifyOnRestock
    });

    // Reset form
    setSelectedProductId("");
    setTargetPrice("");
    setNotifyOnRestock(false);
    setOpen(false);
  };

  const handleCancel = () => {
    setSelectedProductId("");
    setTargetPrice("");
    setNotifyOnRestock(false);
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-[0.625rem] hover:bg-slate-800 transition-colors font-medium shadow-sm"
      >
        <Plus size={16} />
        Create Alert
      </button>

      {open && (
        <div className="fixed inset-0 bg-[#030213] bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-[0.625rem] p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Create Price Alert</h3>
              <button onClick={handleCancel} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Product Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Product</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-[0.625rem] bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                  required
                >
                  <option value="">Select a product to track</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.title} - {product.platform} - <PriceDisplay priceUSD={product.price} selectedCurrency="USD" />
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Price */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Target Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#717182]">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-[0.625rem] bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                    required
                  />
                </div>
                {selectedProduct && targetPrice && (
                  <p className="text-xs text-[#717182]">
                    Current price: <PriceDisplay priceUSD={selectedProduct.price} selectedCurrency="USD" />
                    {parseFloat(targetPrice) < selectedProduct.price && (
                      <span className="text-green-600">
                        {" "}(<PriceDisplay priceUSD={selectedProduct.price - parseFloat(targetPrice)} selectedCurrency="USD" /> below current)
                      </span>
                    )}
                    {parseFloat(targetPrice) > selectedProduct.price && (
                      <span className="text-red-600">
                        {" "}(<PriceDisplay priceUSD={parseFloat(targetPrice) - selectedProduct.price} selectedCurrency="USD" /> above current)
                      </span>
                    )}
                  </p>
                )}
              </div>

              {/* Notification Limit Warning */}
              {(user?.subscription?.tier || 'free') === 'free' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-700">
                    <p className="font-medium">Free Plan Limit</p>
                    <p>You will only receive 1 notification per day. <a href="/subscription" className="underline hover:text-yellow-800">Upgrade to Pro</a> for unlimited alerts.</p>
                  </div>
                </div>
              )}

              {/* Restock Notification */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="restock"
                  checked={notifyOnRestock}
                  onChange={(e) => setNotifyOnRestock(e.target.checked)}
                  className="h-4 w-4 text-slate-600 border-gray-300 rounded focus:ring-slate-500"
                />
                <label htmlFor="restock" className="text-sm text-gray-700 font-normal">
                  Notify me when restocked
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4">
                <button
                  type="submit"
                  disabled={!selectedProductId || !targetPrice}
                  className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-[0.625rem] hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Create Alert
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-[0.625rem] hover:bg-gray-200 dark:hover:bg-gray-600 font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default function Alerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState("newest");
  const [filterBy, setFilterBy] = useState("all");
  const { getAuthHeaders, user, loading: authLoading } = useAuth();
  const { t } = useTranslation();
  const selectedCurrency = user?.preferences?.currency || 'USD';

  useEffect(() => {
    // Wait for auth to be ready before fetching data
    if (!authLoading) {
      fetchAlerts();
      fetchProducts();
    }
  }, [authLoading]);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products', {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/alerts', {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        // Transform the data to match our interface
        const transformedAlerts: Alert[] = data.data.map((alert: any) => ({
          id: alert.id,
          productId: alert.productId,
          productName: alert.productTitle || alert.productName,
          platform: alert.platform || 'Unknown',
          currentPrice: alert.currentPrice,
          targetPrice: alert.targetPrice,
          isActive: alert.isActive,
          isTargetReached: alert.currentPrice <= alert.targetPrice,
          notifyOnRestock: alert.notifyOnRestock || false,
          createdAt: alert.createdAt
        }));
        setAlerts(transformedAlerts);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (alertId: string) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}/toggle`, {
        method: 'PUT',
        headers: getAuthHeaders(),
      });
      const data = await response.json();

      if (data.success) {
        setAlerts(alerts.map(alert =>
          alert.id === alertId ? { ...alert, isActive: !alert.isActive } : alert
        ));
        toast.success('Alert updated');
      } else {
        toast.error('Failed to update alert');
      }
    } catch (error) {
      console.error('Error updating alert:', error);
      // Fallback to local state update
      setAlerts(alerts.map(alert =>
        alert.id === alertId ? { ...alert, isActive: !alert.isActive } : alert
      ));
      toast.success('Alert updated');
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    if (!confirm('Are you sure you want to delete this alert?')) {
      return;
    }

    try {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        setAlerts(alerts.filter(alert => alert.id !== alertId));
        toast.success('Alert deleted');
      } else {
        toast.error('Failed to delete alert');
      }
    } catch (error) {
      console.error('Error deleting alert:', error);
      setAlerts(alerts.filter(alert => alert.id !== alertId));
      toast.success('Alert deleted');
    }
  };

  const handleCreateAlert = async (newAlert: {
    productId: string;
    targetPrice: number;
    notifyOnRestock: boolean;
  }) => {
    const selectedProduct = products.find(p => p.id === newAlert.productId);
    if (!selectedProduct) {
      toast.error('Product not found');
      return;
    }

    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          productId: newAlert.productId,
          targetPrice: newAlert.targetPrice,
          notifyOnRestock: newAlert.notifyOnRestock,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const alert: Alert = {
          id: data.data.id || Date.now().toString(),
          productId: newAlert.productId,
          productName: selectedProduct.title,
          platform: selectedProduct.platform,
          currentPrice: selectedProduct.price,
          targetPrice: newAlert.targetPrice,
          isActive: true,
          isTargetReached: selectedProduct.price <= newAlert.targetPrice,
          notifyOnRestock: newAlert.notifyOnRestock,
          createdAt: new Date().toISOString(),
        };

        setAlerts([alert, ...alerts]);
        toast.success('Alert created successfully!');
      } else {
        console.error('Alert creation failed:', data);
        toast.error(data.message || 'Failed to create alert');
      }
    } catch (error) {
      console.error('Error creating alert:', error);
      toast.error('Failed to create alert');
    }
  };

  const filteredAndSortedAlerts = alerts
    .filter(alert => {
      switch (filterBy) {
        case "active":
          return alert.isActive;
        case "inactive":
          return !alert.isActive;
        case "reached":
          return alert.isTargetReached;
        default:
          return true;
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "price-low":
          return a.targetPrice - b.targetPrice;
        case "price-high":
          return b.targetPrice - a.targetPrice;
        default:
          return 0;
      }
    });

  const activeAlerts = alerts.filter(alert => alert.isActive).length;
  const reachedTargets = alerts.filter(alert => alert.isTargetReached && alert.isActive).length;

  if (isLoading || authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-medium text-gray-900 dark:text-white">Alerts</h2>
              {reachedTargets > 0 && (
                <div className="relative">
                  <BellRing className="text-green-600" size={20} />
                  <span className="absolute -top-1 -right-1 bg-green-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {reachedTargets}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-[#717182]">
              <span>{alerts.length} total alerts</span>
              <span>{activeAlerts} active</span>
              {reachedTargets > 0 && (
                <span className="text-green-600 font-medium">
                  {reachedTargets} target{reachedTargets === 1 ? '' : 's'} reached
                </span>
              )}
            </div>
          </div>

          <CreateAlertDialog products={products} onCreateAlert={handleCreateAlert} user={user} />
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#717182]" />
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="w-full sm:w-48 pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-[0.625rem] bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
            >
              <option value="all">All Alerts</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
              <option value="reached">Target Reached</option>
            </select>
          </div>

          <div className="relative">
            <ArrowUpDown className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#717182]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full sm:w-48 pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-[0.625rem] bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="price-low">Target Price (Low to High)</option>
              <option value="price-high">Target Price (High to Low)</option>
            </select>
          </div>
        </div>

        {/* Alerts Grid */}
        {filteredAndSortedAlerts.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="mx-auto text-[#717182] mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No alerts found</h3>
            <p className="text-[#717182] mb-4">
              {alerts.length === 0
                ? "Create your first price alert to get notified when products reach your target price."
                : "No alerts match your current filter criteria."
              }
            </p>

          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredAndSortedAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                {...alert}
                onToggleActive={handleToggleActive}
                onDelete={handleDeleteAlert}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 