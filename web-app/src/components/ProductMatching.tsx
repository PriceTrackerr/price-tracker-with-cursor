import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { 
  Link, 
  ExternalLink, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Star,
  X
} from 'lucide-react';

interface Product {
  id: string;
  title: string;
  price: number;
  platform: string;
  url: string;
  imageUrl: string;
  stockStatus?: string;
  discountInfo?: string;
}

interface ProductMatch {
  product: Product;
  similarity: number;
  confidence: 'high' | 'medium' | 'low';
  matchReason: string;
  priceDifference: number;
  priceDifferencePercent: number;
}

interface ProductMatchingProps {
  productId: string;
  onClose: () => void;
}

export default function ProductMatching({ productId, onClose }: ProductMatchingProps) {
  const [matches, setMatches] = useState<ProductMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetProduct, setTargetProduct] = useState<Product | null>(null);
  const { token } = useAuth();

  // Handle click outside to close modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (target.classList.contains('modal-overlay')) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  useEffect(() => {
    fetchMatches();
  }, [productId, token]);

  const fetchMatches = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/products/${productId}/matches`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTargetProduct(data.data.targetProduct);
          setMatches(data.data.matches);
        }
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceIcon = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'medium':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'low':
        return <Clock className="w-4 h-4 text-gray-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

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
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case 'out_of_stock':
        return <AlertCircle className="w-3 h-3 text-red-500" />;
      default:
        return <Clock className="w-3 h-3 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-overlay">
        <div className="bg-white rounded-lg p-6 max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Product Matching</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Finding similar products...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-overlay">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Product Matching</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {targetProduct && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Target Product</h4>
            <div className="flex items-center gap-3">
              <span className="text-lg">{getPlatformIcon(targetProduct.platform)}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-800">{targetProduct.title}</p>
                <p className="text-xs text-blue-600">{targetProduct.platform}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-blue-900">${targetProduct.price.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}

        {matches.length === 0 ? (
          <div className="text-center py-8">
            <Star className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No matches found</h3>
            <p className="mt-1 text-sm text-gray-500">
              No similar products found across other platforms.
            </p>
            <p className="text-xs mt-1">Try tracking more products to find matches</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Found {matches.length} similar products</h4>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span>High confidence</span>
                <AlertCircle className="w-3 h-3 text-yellow-500" />
                <span>Medium confidence</span>
                <Clock className="w-3 h-3 text-gray-400" />
                <span>Low confidence</span>
              </div>
            </div>

            {matches.map((match, index) => (
              <div key={match.product.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">{getPlatformIcon(match.product.platform)}</span>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {match.product.platform}
                      </span>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${getConfidenceColor(match.confidence)}`}>
                        {getConfidenceIcon(match.confidence)}
                        <span className="capitalize">{match.confidence} match</span>
                      </div>
                    </div>
                    
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                      {match.product.title}
                    </h3>
                    
                    <p className="text-xs text-gray-600 mb-2">
                      {match.matchReason} • {Math.round(match.similarity * 100)}% similarity
                    </p>

                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        {getStockStatusIcon(match.product.stockStatus)}
                        <span className="text-gray-500">
                          {match.product.stockStatus === 'in_stock' ? 'In Stock' : 
                           match.product.stockStatus === 'out_of_stock' ? 'Out of Stock' : 'Unknown'}
                        </span>
                      </div>
                      
                      {match.priceDifference > 0 && (
                        <div className={`flex items-center gap-1 ${
                          match.product.price > (targetProduct?.price || 0) ? 'text-red-600' : 'text-green-600'
                        }`}>
                          {match.product.price > (targetProduct?.price || 0) ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          <span>
                            ${match.priceDifference.toFixed(2)} ({match.priceDifferencePercent.toFixed(1)}%)
                          </span>
                        </div>
                      )}
                    </div>

                    {match.product.discountInfo && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-green-600" />
                          <span className="text-xs font-medium text-green-700">
                            {match.product.discountInfo}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end gap-2 ml-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        ${match.product.price.toFixed(2)}
                      </p>
                    </div>
                    
                    <a
                      href={match.product.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      View
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 