import React, { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../components/AuthContext';
import ProductMatching from '../components/ProductMatching';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Trash2, 
  TrendingDown,
  TrendingUp,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Clock,
  Package,
  DollarSign,
  ShoppingCart,
  Star,
  Eye,
  EyeOff,
  X,
  Link,
  Users,
  Download,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface Product {
  id: string;
  url: string;
  title: string;
  price: number;
  currency: string;
  platform: 'amazon' | 'aliexpress' | 'ebay' | 'walmart' | 'shein';
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  stockStatus?: 'in_stock' | 'out_of_stock' | 'unknown';
  discountInfo?: string;
  priceHistory?: Array<{
    id: string;
    productId: string;
    price: number;
    currency: string;
    timestamp: string;
  }>;
  matchedProducts?: string[]; // Array of product IDs that match this product
  totalMatches?: number; // Total number of matches found
  priceDrop?: number;
  priceDropPercent?: number;
  previousPrice?: number;
  hasPriceDrop?: boolean;
}

interface FilterOptions {
  priceRange: { min: number; max: number };
  platforms: string[];
  stockStatuses: Record<string, number>;
  priceDropStats: {
    productsWithPriceDrops: number;
    maxPriceDrop: string;
    maxPriceDropPercent: number;
  };
  totalProducts: number;
}

interface FilterState {
  search: string;
  platform: string;
  minPrice: string;
  maxPrice: string;
  stockStatus: string;
  hasPriceDrop: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  viewMode: 'grid' | 'list' | 'compact';
}

interface PriceHistoryEntry {
  id: string;
  productId: string;
  price: number;
  currency: string;
  timestamp: string;
}

// Advanced Filter Component
function AdvancedFilters({ 
  filters, 
  filterOptions, 
  onFilterChange, 
  onClearFilters 
}: { 
  filters: FilterState; 
  filterOptions: FilterOptions | null;
  onFilterChange: (key: keyof FilterState, value: any) => void;
  onClearFilters: () => void;
}) {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      {/* Filter Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filters & Sorting</h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-900"
          >
            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span>{showFilters ? 'Hide' : 'Show'} Filters</span>
          </button>
          <button
            onClick={onClearFilters}
            className="text-sm text-red-600 hover:text-red-700"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      {filterOptions && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{filterOptions.totalProducts}</div>
            <div className="text-sm text-gray-600">Total Products</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{filterOptions.priceDropStats.productsWithPriceDrops}</div>
            <div className="text-sm text-gray-600">Price Drops</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">${filterOptions.priceRange.min.toFixed(0)} - ${filterOptions.priceRange.max.toFixed(0)}</div>
            <div className="text-sm text-gray-600">Price Range</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{filterOptions.platforms.length}</div>
            <div className="text-sm text-gray-600">Platforms</div>
          </div>
        </div>
      )}

      {showFilters && (
        <div className="space-y-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Products</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title, platform..."
                value={filters.search}
                onChange={(e) => onFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Platform Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
              <select
                value={filters.platform}
                onChange={(e) => onFilterChange('platform', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Platforms</option>
                {filterOptions?.platforms.map(platform => (
                  <option key={platform} value={platform}>
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Min Price</label>
              <input
                type="number"
                placeholder="Min"
                value={filters.minPrice}
                onChange={(e) => onFilterChange('minPrice', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Price</label>
              <input
                type="number"
                placeholder="Max"
                value={filters.maxPrice}
                onChange={(e) => onFilterChange('maxPrice', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Stock Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Stock Status</label>
              <select
                value={filters.stockStatus}
                onChange={(e) => onFilterChange('stockStatus', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="in_stock">In Stock</option>
                <option value="out_of_stock">Out of Stock</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Price Drop Filter */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="hasPriceDrop"
                checked={filters.hasPriceDrop}
                onChange={(e) => onFilterChange('hasPriceDrop', e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="hasPriceDrop" className="text-sm font-medium text-gray-700">
                Only Price Drops
              </label>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => onFilterChange('sortBy', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="createdAt">Date Added</option>
                <option value="price">Price</option>
                <option value="priceDrop">Price Drop</option>
                <option value="priceDropPercent">Price Drop %</option>
                <option value="title">Title</option>
                <option value="platform">Platform</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => onFilterChange('sortOrder', 'asc')}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg border ${
                    filters.sortOrder === 'asc' 
                      ? 'bg-blue-500 text-white border-blue-500' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <SortAsc className="w-4 h-4" />
                  <span>Asc</span>
                </button>
                <button
                  onClick={() => onFilterChange('sortOrder', 'desc')}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg border ${
                    filters.sortOrder === 'desc' 
                      ? 'bg-blue-500 text-white border-blue-500' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <SortDesc className="w-4 h-4" />
                  <span>Desc</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Product Price History Component
function ProductPriceHistory({ productId }: { productId: string }) {
  const [history, setHistory] = useState<PriceHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      try {
      const res = await fetch(`/api/products/${productId}/history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setHistory(data.data);
      }
      } catch (error) {
        console.error('Error fetching price history:', error);
      } finally {
      setLoading(false);
      }
    }
    fetchHistory();
  }, [productId, token]);

  if (loading) return <div className="text-center py-8">Loading price history...</div>;
  if (!history.length) return <div className="text-center py-8 text-gray-500">No price history available.</div>;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {history.map((entry) => (
          <div key={entry.id} className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">
                {new Date(entry.timestamp).toLocaleDateString()}
              </span>
              <span className="text-lg font-semibold text-gray-900">
                {entry.currency}{entry.price.toFixed(2)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Product Card Component matching Figma design
const ProductCard: React.FC<{
  product: Product; 
  onDelete: (id: string) => void;
  onViewHistory: (product: Product) => void;
  onViewMatches: (product: Product) => void;
  highlighted: boolean;
}> = ({ product, onDelete, onViewHistory, onViewMatches, highlighted }) => {
  const [showAllHistory, setShowAllHistory] = useState(false);
  const navigate = useNavigate();
  
  // Debug highlight prop
  useEffect(() => {
    if (highlighted) {
      // Removed debug log
    }
  }, [highlighted, product.id, product.title]);

  const getPriceChange = () => {
    // Use the new price drop data from backend if available
    if (product.hasPriceDrop && product.priceDrop && product.previousPrice) {
      return {
        change: -product.priceDrop, // Negative because it's a drop
        changePercent: -(product.priceDropPercent || 0),
        isPositive: false
      };
    }
    
    // Fallback to old calculation if new data not available
    if (!product.priceHistory || product.priceHistory.length < 2) return null;
    
    const sortedHistory = [...product.priceHistory].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    const latest = sortedHistory[sortedHistory.length - 1];
    const previous = sortedHistory[sortedHistory.length - 2];
    
    if (!latest || !previous) return null;
    
    const change = latest.price - previous.price;
    const changePercent = (change / previous.price) * 100;
    
    return {
      change,
      changePercent,
      isPositive: change > 0
    };
  };

  const priceChange = getPriceChange();
  const displayHistory = showAllHistory 
    ? product.priceHistory?.slice(-10) 
    : product.priceHistory?.slice(-3);

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'amazon':
        return '🛒';
      case 'aliexpress':
        return '📦';
      case 'ebay':
        return '🏪';
      case 'walmart':
        return '🛍️';
      case 'shein':
        return '👗';
      default:
        return '🛒';
    }
  };

  const getStockStatusIcon = (status?: string) => {
    switch (status) {
      case 'in_stock':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'out_of_stock':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStockStatusText = (status?: string) => {
    switch (status) {
      case 'in_stock':
        return 'In Stock';
      case 'out_of_stock':
        return 'Out of Stock';
      default:
        return 'Unknown';
    }
  };

  return (
    <div 
      id={`product-${product.id}`}
      className={`product-card bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 ${
        highlighted ? 'highlighted-product' : ''
      }`}
      onClick={() => navigate(`/products/${product.id}`)}
    >
      {/* Product Image - Responsive */}
      <div className="relative h-48 sm:h-56 md:h-64 bg-gray-100">
          <img
            src={product.imageUrl || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop'}
            alt={product.title || 'Product image'}
            loading="lazy"
            onError={(e) => {
              const el = e.target as HTMLImageElement;
              el.src = 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop';
            }}
          className="w-full h-full object-cover"
        />
        
        {/* Platform Badge */}
        <div className="absolute top-3 left-3">
          <div className="flex items-center gap-1 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full shadow-sm">
            <span className="text-sm">{getPlatformIcon(product.platform)}</span>
            <span className="text-xs font-medium text-gray-700 uppercase tracking-wide">
              {product.platform}
            </span>
          </div>
        </div>

        {/* Stock Status Badge */}
        <div className="absolute top-3 right-3">
          <div className="flex items-center gap-1 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full shadow-sm">
            {getStockStatusIcon(product.stockStatus)}
            <span className="text-xs font-medium text-gray-700">
              {getStockStatusText(product.stockStatus)}
              </span>
          </div>
        </div>

        {/* Matches Badge */}
        {product.totalMatches && product.totalMatches > 0 && (
          <div className="absolute bottom-3 left-3">
            <div className="flex items-center gap-1 px-2 py-1 bg-blue-500/90 backdrop-blur-sm rounded-full shadow-sm">
              <Users className="w-3 h-3 text-white" />
              <span className="text-xs font-medium text-white flex items-center gap-1">
                {`${product.totalMatches} match${product.totalMatches !== 1 ? 'es' : ''}`}
              </span>
            </div>
          </div>
        )}

        {/* Discount Badge */}
        {product.discountInfo && (
          <div className="absolute bottom-3 right-3">
            <div className="flex items-center gap-1 px-2 py-1 bg-green-500/90 backdrop-blur-sm rounded-full shadow-sm">
              <Star className="w-3 h-3 text-white" />
              <span className="text-xs font-medium text-white">
                {product.discountInfo}
              </span>
          </div>
          </div>
        )}

        {/* Price Drop Badge */}
        {product.hasPriceDrop && product.priceDrop && (
          <div className="absolute bottom-3 left-3">
            <div className="flex items-center gap-1 px-2 py-1 bg-red-500/90 backdrop-blur-sm rounded-full shadow-sm">
              <TrendingDown className="w-3 h-3 text-white" />
              <span className="text-xs font-medium text-white">
                -${product.priceDrop.toFixed(2)} ({product.priceDropPercent || 0}%)
              </span>
            </div>
          </div>
        )}
        </div>

      {/* Content */}
      <div className="p-3 md:p-4">
        {/* Title */}
        <h3 className="text-sm md:text-base font-semibold text-gray-900 line-clamp-2 leading-tight mb-2">
              {product.title}
            </h3>

        {/* Price Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-gray-500" />
            <span className="text-lg md:text-xl font-bold text-gray-900">
              {product.currency}{product.price.toFixed(2)}
                          </span>
            {priceChange && (
              <div className={`flex items-center gap-1 text-xs font-medium ${
                priceChange.isPositive ? 'text-red-600' : 'text-green-600'
              }`}>
                {priceChange.isPositive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {priceChange.isPositive ? '+' : ''}{priceChange.change.toFixed(2)} 
                ({priceChange.isPositive ? '+' : ''}{priceChange.changePercent.toFixed(1)}%)
                        </div>
            )}
                      </div>
        </div>

        {/* Price History */}
        {product.priceHistory && product.priceHistory.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-700">Price History</span>
              {product.priceHistory.length > 3 && (
                    <button 
                  onClick={() => setShowAllHistory(!showAllHistory)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  {showAllHistory ? (
                    <>
                      <EyeOff className="w-3 h-3 inline mr-1" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3 inline mr-1" />
                      Show More
                    </>
                  )}
                    </button>
                  )}
            </div>
            
            <div className="space-y-1">
              {displayHistory?.map((entry, index) => (
                <div key={entry.id} className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </span>
                  <span className="font-medium text-gray-900">
                    {entry.currency}{entry.price.toFixed(2)}
                        </span>
                      </div>
              ))}
                </div>
            </div>
        )}

                {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          {/* Buy Now button */}
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors text-center"
          >
              Buy Now
          </a>
            
          {/* Action buttons */}
          <div className="flex items-center justify-center gap-1">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/products/${product.id}`);
              }}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title="View Details"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onViewMatches(product);
              }}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              title="View Matches"
            >
              <Link className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onViewHistory(product);
              }}
              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                title="View Price History"
              >
              <TrendingUp className="w-4 h-4" />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(product.id);
                }}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                title="Delete Product"
              >
              <Trash2 className="w-4 h-4" />
            </button>
            </div>
          </div>
        </div>

    </div>
  );
};

export default function Products() {
  const { user, token } = useAuth();

  // Show loading state while auth is initializing
  if (token === undefined) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your products...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Please log in to view your products</h3>
            <p className="mt-1 text-sm text-gray-500">
              You need to be authenticated to access your tracked products.
            </p>
          </div>
        </div>
      </div>
    );
  }
  const location = useLocation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProductForHistory, setSelectedProductForHistory] = useState<Product | null>(null);
  const [selectedProductForMatches, setSelectedProductForMatches] = useState<Product | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);
  const [highlightedProductId, setHighlightedProductId] = useState<string | null>(null);

  const handleViewMatches = async (product: Product) => {
    setMatchLoading(true);
    try {
      const response = await fetch(`/api/products/${product.id}/matches`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Update product's match count and set it for viewing
          const updatedProduct = {
            ...product,
            totalMatches: data.data.matches.length
          };
          setSelectedProductForMatches(updatedProduct);
          
          // Update the product in the products list
          setProducts(prevProducts => 
            prevProducts.map(p => 
              p.id === product.id ? updatedProduct : p
            )
          );
        } else {
          console.error('Failed to fetch matches:', data.error);
          setSelectedProductForMatches(product);
        }
      } else {
        console.error('Failed to fetch matches:', response.statusText);
        setSelectedProductForMatches(product);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
      setSelectedProductForMatches(product);
    } finally {
      setMatchLoading(false);
    }
  };
  
  // Advanced filtering state
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    platform: '',
    minPrice: '',
    maxPrice: '',
    stockStatus: '',
    hasPriceDrop: false,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    viewMode: 'grid'
  });

  // Debug highlightedProductId state
  useEffect(() => {
    // Removed debug log
  }, [highlightedProductId]);

  // Debug products state
  useEffect(() => {
    // Removed debug log
  }, [products]);

  // Add CSS for hover and highlight effects
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .product-card {
        transition: all 1.2s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      .product-card:hover {
        transform: scale(1.02) translateY(-4px);
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      }
      
      .highlighted-product {
        border: 4px solid #3b82f6 !important;
        box-shadow: 0 0 30px rgba(59, 130, 246, 0.8) !important;
        transform: scale(1.15) translateY(-20px) !important;
        z-index: 100 !important;
        position: relative;
        animation: highlightPopout 1.5s ease-in-out;
      }
      
      @keyframes highlightPopout {
        0% {
          transform: scale(1) translateY(0);
          box-shadow: 0 0 0 rgba(59, 130, 246, 0);
        }
        50% {
          transform: scale(1.2) translateY(-25px);
          box-shadow: 0 0 40px rgba(59, 130, 246, 0.9);
        }
        100% {
          transform: scale(1.15) translateY(-20px);
          box-shadow: 0 0 30px rgba(59, 130, 246, 0.8);
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Handle URL parameters for product highlighting
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('highlight');
    
    if (productId) {
      
      // Wait for products to load, then scroll and highlight
      const checkAndHighlight = () => {
        const productElement = document.getElementById(`product-${productId}`);
        
        if (productElement && products.length > 0) {
          
          // Remove the parameter from URL after we found the element
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('highlight');
          window.history.replaceState({}, '', newUrl.toString());
          
          // Scroll to element
          productElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center'
          });
          
          // Wait for scroll to complete, then add highlight
          setTimeout(() => {
            // Set the highlighted product ID to trigger the animation
            setHighlightedProductId(productId);
            
            // Remove highlight after 1.5 seconds
            setTimeout(() => {
              setHighlightedProductId(null);
            }, 1500);
          }, 500); // Wait 500ms for scroll to complete
        } else {
          // Retry after a short delay
          setTimeout(checkAndHighlight, 100);
        }
      };
      
      // Start checking
      checkAndHighlight();
    } else {
      // Removed debug log
    }
  }, [products]); // Add products as dependency

  // Get search term from navigation state and handle popup parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const popup = urlParams.get('popup');
    
    if (popup === 'true') {
      setShowAddModal(true);
      // Remove the parameter from URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('popup');
      window.history.replaceState({}, '', newUrl.toString());
    }
    
    // Handle search term from navigation state
    if (location.state?.searchTerm) {
      // Removed debug log
      handleFilterChange('search', location.state.searchTerm);
      // Clear the state to prevent re-applying on refresh
      window.history.replaceState({}, '', location.pathname);
    }
  }, [location]);

  const fetchProducts = useCallback(async (currentFilters?: FilterState) => {
    if (!token) return;

    try {
      const filterToUse = currentFilters || filters;
      // Build query parameters from filters
      const params = new URLSearchParams();
      if (filterToUse.search) params.append('search', filterToUse.search);
      if (filterToUse.platform) params.append('platform', filterToUse.platform);
      if (filterToUse.minPrice) params.append('minPrice', filterToUse.minPrice);
      if (filterToUse.maxPrice) params.append('maxPrice', filterToUse.maxPrice);
      if (filterToUse.stockStatus) params.append('stockStatus', filterToUse.stockStatus);
      if (filterToUse.hasPriceDrop) params.append('hasPriceDrop', 'true');
      if (filterToUse.sortBy) params.append('sortBy', filterToUse.sortBy);
      if (filterToUse.sortOrder) params.append('sortOrder', filterToUse.sortOrder);

      const response = await fetch(`/api/products?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch filter options
  const fetchFilterOptions = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await fetch('/api/products/filters', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setFilterOptions(data.data);
      }
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      const fetchAllProducts = async () => {
        try {
          const response = await fetch('/api/products', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();
          if (data.success) {
            setProducts(data.data);
          }
        } catch (error) {
          console.error('Error fetching products:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchAllProducts();
      fetchFilterOptions();
    }
  }, [token]);

  // Fetch match counts for all products
  const fetchMatchCounts = useCallback(async () => {
    if (!token || products.length === 0) return;

    try {
      const promises = products.map(async (product) => {
        try {
          const response = await fetch(`/api/products/${product.id}/match-count`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();
          return { productId: product.id, count: data.success ? data.data : 0 };
        } catch (error) {
          console.warn(`Failed to fetch match count for product ${product.id}:`, error);
          return { productId: product.id, count: 0 };
        }
      });

      const results = await Promise.all(promises);
      
      // Update products with match counts
      setProducts(prevProducts => 
        prevProducts.map(product => {
          const result = results.find(r => r.productId === product.id);
          return result ? { ...product, totalMatches: result.count } : product;
        })
      );
    } catch (error) {
      console.error('Error fetching match counts:', error);
    }
  }, [token, products]);

  // Fetch match counts after products are loaded
  useEffect(() => {
    if (products.length > 0) {
      fetchMatchCounts();
    }
  }, [products.length, fetchMatchCounts]);

  // Fetch products when filters change (but not on initial load)
  useEffect(() => {
    if (token && !loading) {
      const filterToUse = filters;
      // Build query parameters from filters
      const params = new URLSearchParams();
      if (filterToUse.search) params.append('search', filterToUse.search);
      if (filterToUse.platform) params.append('platform', filterToUse.platform);
      if (filterToUse.minPrice) params.append('minPrice', filterToUse.minPrice);
      if (filterToUse.maxPrice) params.append('maxPrice', filterToUse.maxPrice);
      if (filterToUse.stockStatus) params.append('stockStatus', filterToUse.stockStatus);
      if (filterToUse.hasPriceDrop) params.append('hasPriceDrop', 'true');
      if (filterToUse.sortBy) params.append('sortBy', filterToUse.sortBy);
      if (filterToUse.sortOrder) params.append('sortOrder', filterToUse.sortOrder);

      const fetchFilteredProducts = async () => {
        try {
          const response = await fetch(`/api/products?${params.toString()}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await response.json();
          if (data.success) {
            setProducts(data.data);
          }
        } catch (error) {
          console.error('Error fetching products:', error);
        }
      };
      fetchFilteredProducts();
    }
  }, [filters, token, loading]);

  // Filter handlers
  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      platform: '',
      minPrice: '',
      maxPrice: '',
      stockStatus: '',
      hasPriceDrop: false,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      viewMode: 'grid'
    });
  };

  const addProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const productData = {
      title: formData.get('title') as string,
      price: parseFloat(formData.get('price') as string),
      currency: (formData.get('currency') as string) || 'USD', // Default to USD if missing
      platform: formData.get('platform') as string,
      url: formData.get('url') as string,
      imageUrl: formData.get('imageUrl') as string,
    };

    try {
      const response = await fetch('/api/products/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(productData)
      });

      const data = await response.json();
      if (data.success) {
        // Treat both new and already-tracked as success
        const msg: string = (data.message || '').toLowerCase();
        if (msg.includes('already')) {
          toast.success('Already tracked — opening details.');
        } else {
          toast.success('Product tracked successfully');
        }
        setShowAddModal(false);
        fetchProducts();
        (e.target as HTMLFormElement).reset();
      } else {
        console.error('Failed to add product:', data.message);
        toast.error(data.message || 'Failed to track product');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Failed to track product');
    }
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  // Handle Enter key for delete confirmation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showDeleteModal && e.key === 'Enter') {
        confirmDelete();
      }
    };

    if (showDeleteModal) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showDeleteModal]);

  const deleteProduct = async (id: string) => {
    setProductToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;

    try {
      const response = await fetch(`/api/products/${productToDelete}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();
      if (data.success) {
        console.log('Product deleted successfully!');
        setProducts(products.filter(p => p.id !== productToDelete));
      } else {
        console.error('Failed to delete product:', data.message);
      }
    } catch (error) {
      console.error('Error deleting product:', error);
    } finally {
      setShowDeleteModal(false);
      setProductToDelete(null);
    }
  };

  const handleSort = (value: string) => {
    handleFilterChange('sortBy', value);
  };

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const response = await fetch(`/api/products/export/${format}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `products.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  // Filter products based on search term and date filter
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(filters.search.toLowerCase()) ||
                         product.platform.toLowerCase().includes(filters.search.toLowerCase());
    
    if (!matchesSearch) return false;
    
    // Apply date filter
    const productDate = new Date(product.createdAt);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    switch (filters.stockStatus) {
      case 'in_stock':
        return productDate >= today;
      case 'out_of_stock':
        return productDate >= weekAgo;
      case 'unknown':
        return productDate >= monthAgo;
      default:
        return true;
    }
  });

  // Debug logging
  useEffect(() => {
    // Removed debug log
  }, [filters.search, products, filteredProducts]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header Skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-48"></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 bg-gray-200 rounded w-32"></div>
              <div className="h-10 bg-gray-200 rounded w-40"></div>
            </div>
          </div>
          
          {/* Products Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200/50 p-4">
                <div className="animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900">Products</h2>
              <p className="text-sm md:text-base text-gray-600 mt-1">{filteredProducts.length} tracked products</p>
            </div>
            
            {/* Mobile: Stack controls vertically, Desktop: Horizontal */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={() => handleExport('csv')}
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <Download className="-ml-1 mr-2 h-4 w-4" />
                Export CSV
              </button>

              <select
                value={filters.sortBy}
                onChange={(e) => handleSort(e.target.value)}
                className="w-full sm:w-48 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500 focus:outline-none appearance-none bg-white"
              >
                <option value="createdAt">Date Added</option>
                <option value="price">Price</option>
                <option value="priceDrop">Price Drop</option>
                <option value="priceDropPercent">Price Drop %</option>
                <option value="title">Title</option>
                <option value="platform">Platform</option>
              </select>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search products..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-blue-500 focus:outline-none bg-white text-sm"
            />
          </div>
        </div>

        {/* Advanced Filters */}
        <AdvancedFilters
          filters={filters}
          filterOptions={filterOptions}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />

        {/* Search Bar */}
        {filters.search && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-blue-800">Search Results:</span>
                <span className="text-sm text-blue-600">"{filters.search}"</span>
                <span className="text-sm text-blue-600">({filteredProducts.length} products)</span>
              </div>
              <button 
                onClick={() => handleFilterChange('search', '')}
                className="text-blue-600 hover:text-blue-800"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onDelete={deleteProduct}
              onViewHistory={setSelectedProductForHistory}
              onViewMatches={handleViewMatches}
              highlighted={product.id === highlightedProductId}

            />
          ))}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filters.search ? 'Try adjusting your search terms.' : 'Get started by adding your first product.'}
            </p>
            {!filters.search && (
              <div className="mt-6">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="-ml-1 mr-2 h-5 w-5" />
                  Add Product
                </button>
              </div>
            )}
          </div>
        )}


      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add New Product</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={addProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Title</label>
                <input
                  type="text"
                  name="title"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                <input
                  type="number"
                  name="price"
                  step="0.01"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                <select
                  name="currency"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="CAD">CAD</option>
                  <option value="AUD">AUD</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                <select
                  name="platform"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="amazon">Amazon</option>
                  <option value="aliexpress">AliExpress</option>
                  <option value="walmart">Walmart</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product URL</label>
                <input
                  type="url"
                  name="url"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (optional)</label>
                <input
                  type="url"
                  name="imageUrl"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Product
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Product Price History Modal */}
      {selectedProductForHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Price History for "{selectedProductForHistory.title}"</h3>
              <button onClick={() => setSelectedProductForHistory(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <ProductPriceHistory productId={selectedProductForHistory.id} />
          </div>
        </div>
      )}

      {/* Product Matching Modal */}
      {selectedProductForMatches && (
        <ProductMatching
          productId={selectedProductForMatches.id}
          onClose={() => setSelectedProductForMatches(null)}
        />
      )}

              {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Delete Product</h3>
                <button 
                  onClick={() => {
                    setShowDeleteModal(false);
                    setProductToDelete(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this product? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setProductToDelete(null);
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
          </div>
        </div>
      )}

      {/* Add Product Button */}
      <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-40">
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white p-3 md:p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          title="Add Product"
        >
          <Plus className="h-5 w-5 md:h-6 md:w-6" />
        </button>
      </div>
    </div>
  );
}

export { ProductPriceHistory }; 