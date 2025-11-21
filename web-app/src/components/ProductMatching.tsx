import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  X,
  Zap,
  Target,
  Award
} from 'lucide-react';

interface Product {
  id: string;
  title: string;
  price: number;
  platform: string;
  url: string;
  imageUrl: string;
  currency?: string;
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
  savings?: string;
}

interface ProductMatchingProps {
  productId: string;
  sourceProduct?: Product | null;
  onClose: () => void;
  onMatchCountUpdate?: (productId: string, count: number) => void;
}

export default function ProductMatching({ productId, sourceProduct, onClose, onMatchCountUpdate }: ProductMatchingProps) {
  const [matches, setMatches] = useState<ProductMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [targetProduct, setTargetProduct] = useState<Product | null>(sourceProduct || null);
  const [bestMatch, setBestMatch] = useState<{ product: Product; confidence: number; priceDifference: number } | null>(null);
  const [algorithm, setAlgorithm] = useState<string>('');
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
    if (sourceProduct) {
      setTargetProduct(sourceProduct);
    }
  }, [sourceProduct]);

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    console.log(`🔍 Fetching matches for product ID: ${productId}`);
    
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(`/api/product-matching/global-product-matches?tracked_id=${productId}`, {
        headers
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('✅ Match API Response:', data);
          const payload = data.data || {};
          const matchCount = typeof payload.matchCount === 'number' ? payload.matchCount : (Array.isArray(payload.matches) ? payload.matches.length : 0);
          const matchReason = payload.cached ? 'Cached global match' : 'Serper global match';
          const algorithmLabel = payload.cached ? 'global-cache' : 'global-serper';

          if (!sourceProduct && payload.sourceTitle) {
            setTargetProduct(prev => prev || {
              id: productId,
              title: payload.sourceTitle,
              price: 0,
              platform: '',
              url: '',
              imageUrl: '',
              currency: 'USD'
            });
          }

          const normalizedMatches: ProductMatch[] = (payload.matches || []).map((match: any, index: number) => {
            const price = Number(match.price || 0);
            const targetPrice = sourceProduct?.price || 0;
            const priceDifference = Math.abs(targetPrice - price);
            const priceDifferencePercent = targetPrice ? ((targetPrice - price) / targetPrice) * 100 : 0;

            return {
              product: {
                id: match.id || `${payload.productKey || productId}-${index}`,
                title: match.title || 'Matched product',
                price,
                currency: match.currency || 'USD',
                platform: match.platform || 'other',
                url: match.url || '',
                imageUrl: match.imageUrl || '',
                stockStatus: 'unknown'
              },
              similarity: 0.7,
              confidence: 'medium',
              matchReason,
              priceDifference,
              priceDifferencePercent,
              savings: targetPrice && price < targetPrice ? `$${(targetPrice - price).toFixed(2)} cheaper` : undefined
            };
          });

          setMatches(normalizedMatches);
          setAlgorithm(algorithmLabel);
          setBestMatch(normalizedMatches.length ? {
            product: normalizedMatches[0].product,
            confidence: normalizedMatches[0].similarity,
            priceDifference: normalizedMatches[0].priceDifference
          } : null);

          if (typeof matchCount === 'number') {
            onMatchCountUpdate?.(productId, matchCount);
          }
        } else {
          console.error('Failed to fetch matches:', data.error);
          setError(data.error || 'Failed to find matches. Please try again.');
          setMatches([]);
        }
      } else {
        const errorText = response.statusText || 'Failed to connect to server';
        console.error('Failed to fetch matches:', errorText);
        setError(`Failed to find matches: ${errorText}`);
        setMatches([]);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      console.error('Error fetching matches:', error);
      setError(`Failed to find matches: ${errorMessage}`);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, [token, productId, sourceProduct, onMatchCountUpdate]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const getConfidenceIcon = useCallback((confidence: string) => {
    switch (confidence) {
      case 'high':
        return <Award className="w-4 h-4 text-green-500" />;
      case 'medium':
        return <Target className="w-4 h-4 text-yellow-500" />;
      case 'low':
        return <Clock className="w-4 h-4 text-gray-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  }, []);

  const getConfidenceColor = useCallback((confidence: string) => {
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
  }, []);

  const getConfidenceText = useCallback((confidence: string, similarity: number) => {
    const percentage = Math.round(similarity * 100);
    switch (confidence) {
      case 'high':
        return `${percentage}% Match`;
      case 'medium':
        return `${percentage}% Similar`;
      case 'low':
        return `${percentage}% Related`;
      default:
        return `${percentage}% Match`;
    }
  }, []);

  const getPlatformIcon = useCallback((platform: string) => {
    switch (platform.toLowerCase()) {
      case 'amazon':
        return '🛒';
      case 'aliexpress':
        return '📦';
      case 'ebay':
        return '🏪';
      case 'walmart':
        return '🛍️';
      case 'target':
        return '🎯';
      case 'bestbuy':
        return '💻';
      case 'shein':
        return '👗';
      default:
        return '🛒';
    }
  }, []);

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

  const getSavingsIcon = useCallback((priceDifference: number, targetPrice: number) => {
    const savings = priceDifference / targetPrice * 100;
    if (savings > 50) return <Zap className="w-4 h-4 text-green-500" />;
    if (savings > 20) return <TrendingDown className="w-4 h-4 text-green-400" />;
    return <TrendingUp className="w-4 h-4 text-red-400" />;
  }, []);

  // Memoize sorted matches to prevent unnecessary re-renders
  const sortedMatches = useMemo(() => {
    return [...matches].sort((a, b) => {
      // Sort by confidence first, then by similarity
      const confidenceOrder = { high: 3, medium: 2, low: 1 };
      const aConf = confidenceOrder[a.confidence as keyof typeof confidenceOrder] || 0;
      const bConf = confidenceOrder[b.confidence as keyof typeof confidenceOrder] || 0;
      
      if (aConf !== bConf) return bConf - aConf;
      return b.similarity - a.similarity;
    });
  }, [matches]);

  if (loading || error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-overlay">
        <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {error ? 'Error Finding Matches' : 'Finding Product Matches'}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="text-center py-8">
            {error ? (
              <>
                <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Failed to find matches</h3>
                <p className="mt-1 text-sm text-gray-500">{error}</p>
                <button
                  onClick={() => {
                    setError(null);
                    fetchMatches();
                  }}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </>
            ) : (
              <>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Finding similar products across platforms...</p>
                <p className="mt-1 text-xs text-gray-500">This may take a few seconds</p>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-overlay">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-900">Product Matches</h3>
            {algorithm === 'global-serper' && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Live Serper
              </span>
            )}
            {algorithm === 'global-cache' && (
              <span className="bg-green-100 text-green-700 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Cached Result
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {targetProduct && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Source Product
            </h4>
            <div className="flex items-center gap-3">
              <span className="text-lg">{getPlatformIcon(targetProduct.platform)}</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-800">{targetProduct.title}</p>
                <p className="text-xs text-blue-600 capitalize">{targetProduct.platform}</p>
              </div>
              <div className="text-right">
                  {typeof targetProduct.price === 'number' && (
                    <p className="text-lg font-bold text-blue-900">${targetProduct.price.toFixed(2)}</p>
                  )}
                {targetProduct.currency && (
                  <p className="text-xs text-blue-600">{targetProduct.currency}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {bestMatch && (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <h4 className="font-medium text-green-900 mb-2 flex items-center gap-2">
              <Award className="w-4 h-4" />
              Best Match Found
            </h4>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-lg">{getPlatformIcon(bestMatch.product?.platform)}</span>
                <div>
                  <p className="text-sm font-medium text-green-800 capitalize">{bestMatch.product?.platform}</p>
                  <p className="text-xs text-green-600">{(bestMatch.confidence * 100).toFixed(1)}% confidence match</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-900">${bestMatch.product?.price.toFixed(2)}</p>
                <p className="text-xs text-green-600">Save ${bestMatch.priceDifference.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}

        {matches.length === 0 ? (
          <div className="text-center py-8">
            <Star className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No strong matches found yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try widening the search across supported platforms.
            </p>
            <div className="mt-4 text-xs text-gray-400 space-y-1">
              <p>💡 To improve matching:</p>
              <p>• Track more products from different platforms</p>
              <p>• Ensure product titles include brand and model</p>
              <p>• Try products with common names (iPhone, AirPods, etc.)</p>
            </div>
            <button
              onClick={() => {
                setError(null);
                fetchMatches();
              }}
              className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              Refresh Matches
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Found {matches.length} similar products across platforms</h4>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Award className="w-3 h-3 text-green-500" />
                  <span>High confidence</span>
                  <Target className="w-3 h-3 text-yellow-500" />
                  <span>Medium confidence</span>
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span>Low confidence</span>
                </div>
                <button
                  onClick={() => {
                    setError(null);
                    fetchMatches();
                  }}
                  className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-md hover:bg-blue-700 transition-colors flex items-center gap-1"
                >
                  <Zap className="w-3 h-3" />
                  Refresh
                </button>
              </div>
            </div>

            <div className="grid gap-4">
              {sortedMatches.map((match, index) => (
                <div key={match.product.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 hover:border-blue-300">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{getPlatformIcon(match.product.platform)}</span>
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          {match.product.platform}
                        </span>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${getConfidenceColor(match.confidence)}`}>
                          {getConfidenceIcon(match.confidence)}
                          <span>{getConfidenceText(match.confidence, match.similarity)}</span>
                        </div>
                        {match.confidence === 'high' && match.priceDifference > (targetProduct?.price || 0) * 0.2 && (
                          <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full">
                            Great Deal
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">
                        {match.product.title}
                      </h3>
                      
                      <p className="text-xs text-gray-600 mb-2">
                        {match.matchReason}
                      </p>

                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1">
                          {getStockStatusIcon(match.product.stockStatus)}
                          <span className="text-gray-500">
                            {match.product.stockStatus === 'in_stock' ? 'In Stock' : 
                             match.product.stockStatus === 'out_of_stock' ? 'Out of Stock' : 'Stock Unknown'}
                          </span>
                        </div>
                        
                        {targetProduct && (
                          <div className="flex items-center gap-1">
                            {getSavingsIcon(match.priceDifference, targetProduct.price || 1)}
                            <span className={`font-medium ${
                              match.product.price < targetProduct.price ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {match.savings || `${match.priceDifferencePercent.toFixed(1)}% difference`}
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
                        {targetProduct && match.product.price < targetProduct.price && (
                          <p className="text-xs text-green-600 font-medium">
                            Save ${(targetProduct.price - match.product.price).toFixed(2)}
                          </p>
                        )}
                      </div>
                      
                      <a
                        href={match.product.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors font-medium"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View Deal
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-center">
              <p className="text-xs text-gray-500">
                Powered by enhanced product matching algorithm • {sortedMatches.length} results across {new Set(sortedMatches.map(m => m.product.platform)).size} platforms
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 