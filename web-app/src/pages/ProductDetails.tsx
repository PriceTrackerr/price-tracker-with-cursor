import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ProductPriceHistory } from './Products';
import toast from 'react-hot-toast';
import { useAuth } from '../components/AuthContext';
import { useTranslation } from 'react-i18next';
import PriceDisplay from '../components/PriceDisplay';
import AdvancedAnalysis from '../components/AdvancedAnalysis';
import { getSupabaseClient } from '../lib/supabaseClient';

interface Product {
  id: string;
  title: string;
  price: number;
  currency: string;
  platform: string;
  imageUrl?: string;
  url: string;
  createdAt: string;
  totalMatches?: number;
  hasPriceDrop?: boolean;
  priceDrop?: number;
  priceDropPercent?: number;
  previousPrice?: number;
}

export default function ProductDetails() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { getAuthHeaders, token } = useAuth();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const selectedCurrency = user?.preferences?.currency || 'USD';
  const selectedLanguage = user?.preferences?.language || 'en';
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [alertPrice, setAlertPrice] = useState('');
  const [alertEmail, setAlertEmail] = useState('');
  const [creatingAlert, setCreatingAlert] = useState(false);
  const [prediction, setPrediction] = useState<{ recommendation: 'buy'|'wait'; confidence: number } | null>(null);
  const [alternatives, setAlternatives] = useState<Array<{ id: string; title: string; price: number; platform: string; url: string }>>([]);
  const [bundles, setBundles] = useState<Array<{ id: string; title: string; price: number; platform: string; url: string; estimatedAccessoryValue: number; priceDifference: number; netValue: number }>>([]);

  useEffect(() => {
    async function fetchProduct() {
      if (!productId) return;
      
      setLoading(true);
      try {
        // Try API first
        if (token) {
          try {
            const res = await fetch(`/api/products/${productId}`, {
              headers: getAuthHeaders(),
            });
            
            if (res.ok) {
              const data = await res.json();
              if (data.success && data.data) {
                setProduct(data.data);
                setLoading(false);
                return;
              }
            }
          } catch (apiError) {
            console.warn('API fetch failed, trying Supabase:', apiError);
          }
        }
        
        // Fallback to Supabase
        try {
          const supabase = getSupabaseClient();
          const { data: productData, error: supabaseError } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();
          
          if (supabaseError) {
            throw supabaseError;
          }
          
          if (productData) {
            setProduct({
              id: productData.id,
              title: productData.title,
              price: productData.price || 0,
              currency: productData.currency || 'USD',
              platform: productData.platform || 'unknown',
              imageUrl: productData.image_url || '',
              url: productData.url || '',
              createdAt: productData.created_at || new Date().toISOString(),
              totalMatches: productData.total_matches || 0,
              hasPriceDrop: false,
              priceDrop: 0,
              priceDropPercent: 0,
              previousPrice: productData.price || 0
            });
          } else {
            throw new Error('Product not found');
          }
        } catch (supabaseError: any) {
          console.error('Supabase fetch failed:', supabaseError);
          throw supabaseError;
        }
      } catch (error: any) {
        console.error('Error fetching product:', error);
        toast.error(error?.message || 'Failed to load product details');
      } finally {
        setLoading(false);
      }
    }
    
    fetchProduct();
  }, [productId, token, getAuthHeaders]);

  useEffect(() => {
    if (!productId || !token) return;
    
    // Fetch prediction, alternatives, and bundle info
    (async () => {
      try {
        const [predRes, altRes, bunRes] = await Promise.allSettled([
          fetch(`/api/products/${productId}/predict`, { headers: getAuthHeaders() }),
          fetch(`/api/products/${productId}/alternatives`, { headers: getAuthHeaders() }),
          fetch(`/api/products/${productId}/bundle`, { headers: getAuthHeaders() }),
        ]);
        
        // Handle prediction response
        if (predRes.status === 'fulfilled' && predRes.value.ok) {
          const pred = await predRes.value.json().catch(() => null);
          if (pred && pred.success && pred.data) {
            setPrediction({ recommendation: pred.data.recommendation, confidence: pred.data.confidence });
          }
        }
        
        // Handle alternatives response
        if (altRes.status === 'fulfilled' && altRes.value.ok) {
          const alts = await altRes.value.json().catch(() => null);
          if (alts && alts.success && alts.data?.alternatives) {
            setAlternatives(alts.data.alternatives.map((a: any) => ({ 
              id: a.product.id, 
              title: a.product.title, 
              price: a.product.price, 
              platform: a.product.platform, 
              url: a.product.url 
            })));
          }
        }
        
        // Handle bundles response
        if (bunRes.status === 'fulfilled' && bunRes.value.ok) {
          const buns = await bunRes.value.json().catch(() => null);
          if (buns && buns.success && buns.data?.bundles) {
            setBundles(buns.data.bundles.map((b: any) => ({ 
              id: b.product.id, 
              title: b.product.title, 
              price: b.product.price, 
              platform: b.product.platform, 
              url: b.product.url, 
              estimatedAccessoryValue: b.estimatedAccessoryValue, 
              priceDifference: b.priceDifference, 
              netValue: b.netValue 
            })));
          }
        }
      } catch (error) {
        console.error('Error fetching additional product data:', error);
      }
    })();
  }, [productId, token, getAuthHeaders]);

  useEffect(() => {
    if (i18n.language !== selectedLanguage) {
      i18n.changeLanguage(selectedLanguage);
    }
  }, [selectedLanguage, i18n]);

  const handleCreateAlert = async () => {
    if (!alertPrice || !product) {
      toast.error('Please enter a target price');
      return;
    }
    setCreatingAlert(true);
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          productId: product.id,
          targetPrice: parseFloat(alertPrice),
          email: alertEmail || user?.email,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Price alert created successfully!');
        setAlertPrice('');
        setAlertEmail('');
      } else {
        toast.error(data.message || 'Failed to create alert');
      }
    } catch (error) {
      console.error('Error creating alert:', error);
      toast.error('Failed to create alert');
    } finally {
      setCreatingAlert(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading product details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
        <p className="text-gray-600 mb-6">The product you're looking for could not be found.</p>
        <button 
          onClick={() => navigate(-1)} 
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Create a safe product object with fallbacks
  const safeProduct = {
    id: product.id,
    title: product.title,
    price: product.price || 0,
    currency: product.currency || '$',
    platform: product.platform || 'Unknown',
    imageUrl: product.imageUrl || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop',
    url: product.url,
    createdAt: product.createdAt || new Date().toISOString(),
    totalMatches: product.totalMatches || 0,
    hasPriceDrop: product.hasPriceDrop || false,
    priceDrop: product.priceDrop || 0,
    priceDropPercent: product.priceDropPercent || 0,
    previousPrice: product.previousPrice || product.price
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow relative">
      <button className="mb-4 text-blue-600 hover:underline" onClick={() => navigate(-1)}>
        ← {t('back')}
      </button>
      
      <div className="flex items-center space-x-6 mb-6">
        {safeProduct.imageUrl && (
          <img src={safeProduct.imageUrl} alt={safeProduct.title} className="h-24 w-24 rounded-lg object-cover" />
        )}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{safeProduct.title}</h2>
          <p className="text-gray-600 mb-1">{safeProduct.platform}</p>
          <p className="text-lg font-semibold">
            <PriceDisplay priceUSD={safeProduct.price} selectedCurrency={selectedCurrency} />
          </p>
          
          {/* Price Drop Information */}
          {safeProduct.hasPriceDrop && safeProduct.priceDrop && (
            <div className="mt-2 p-2 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                💰 Price dropped by ${safeProduct.priceDrop.toFixed(2)} ({safeProduct.priceDropPercent}%)
              </p>
              <p className="text-xs text-green-600">
                Previous: ${safeProduct.previousPrice?.toFixed(2)}
              </p>
            </div>
          )}
          
          {/* Matches Information */}
          {safeProduct.totalMatches && safeProduct.totalMatches > 0 && (
            <div className="mt-2 p-2 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                🔍 Found {safeProduct.totalMatches} matching product{safeProduct.totalMatches !== 1 ? 's' : ''} on other platforms
              </p>
            </div>
          )}
          
          <a href={safeProduct.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm">
            {t('viewOnSite')}
          </a>
        </div>
      </div>
      
      <div className="mb-6">
        <ProductPriceHistory productId={safeProduct.id} />
      </div>

      {/* Advanced Features Analysis */}
      <AdvancedAnalysis product={safeProduct} />

      {/* Price Recommendation */}
      {prediction && (
        <div className="mb-6 p-4 rounded border bg-gray-50">
          <h3 className="font-semibold mb-2">Recommendation</h3>
          <p className="text-sm">
            We suggest: <span className={prediction.recommendation === 'wait' ? 'text-orange-600 font-semibold' : 'text-green-600 font-semibold'}>
              {prediction.recommendation.toUpperCase()}
            </span> (confidence: {Math.round(prediction.confidence * 100)}%)
          </p>
        </div>
      )}

      {/* Smart Alternatives */}
      {alternatives.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Smart Alternatives</h3>
          <div className="space-y-2">
            {alternatives.map((alt) => (
              <div key={alt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-sm">{alt.title}</p>
                  <p className="text-xs text-gray-600">{alt.platform}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">${alt.price.toFixed(2)}</p>
                  <a 
                    href={alt.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    View
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bundle Recommendations */}
      {bundles.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Bundle Recommendations</h3>
          <div className="space-y-3">
            {bundles.map((bundle) => (
              <div key={bundle.id} className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{bundle.title}</h4>
                  <span className="text-sm text-blue-600">{bundle.platform}</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Price</p>
                    <p className="font-semibold">${bundle.price.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Accessory Value</p>
                    <p className="font-semibold">${bundle.estimatedAccessoryValue.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Net Value</p>
                    <p className="font-semibold text-green-600">${bundle.netValue.toFixed(2)}</p>
                  </div>
                </div>
                <a 
                  href={bundle.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-sm text-blue-600 hover:underline"
                >
                  View Bundle →
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Price Alert Section */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Set Price Alert</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Price (USD)
            </label>
            <input
              type="number"
              step="0.01"
              value={alertPrice}
              onChange={(e) => setAlertPrice(e.target.value)}
              placeholder={`${(safeProduct.price * 0.9).toFixed(2)}`}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email (optional)
            </label>
            <input
              type="email"
              value={alertEmail}
              onChange={(e) => setAlertEmail(e.target.value)}
              placeholder={user?.email || 'your@email.com'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleCreateAlert}
            disabled={creatingAlert || !alertPrice}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creatingAlert ? 'Creating Alert...' : 'Create Price Alert'}
          </button>
        </div>
      </div>
    </div>
  );
} 