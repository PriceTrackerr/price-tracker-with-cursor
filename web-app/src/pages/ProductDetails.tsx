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

interface Coupon {
  code: string;
  description: string;
  discount?: string;
  source: 'Honey' | 'CouponFollow' | 'Reddit' | 'Slickdeals' | 'Verified';
  link?: string;
  successRate?: number;
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
  const [prediction, setPrediction] = useState<{ recommendation: 'buy' | 'wait'; confidence: number } | null>(null);
  const [alternatives, setAlternatives] = useState<Array<{ id: string; title: string; price: number; platform: string; url: string }>>([]);
  const [bundles, setBundles] = useState<Array<{ id: string; title: string; price: number; platform: string; url: string; estimatedAccessoryValue: number; priceDifference: number; netValue: number }>>([]);

  // Tab state
  const [activeTab, setActiveTab] = useState<'ai' | 'coupons' | 'global' | 'community'>('ai');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);

  // Global landed cost state
  const [globalData, setGlobalData] = useState<any>(null);
  const [loadingGlobal, setLoadingGlobal] = useState(false);

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
              id: a.product?.id || '',
              title: a.product?.title || '',
              price: typeof a.product?.price === 'number' && !isNaN(a.product.price) ? a.product.price : 0,
              platform: a.product?.platform || '',
              url: a.product?.url || ''
            })));
          }
        }

        // Handle bundles response
        if (bunRes.status === 'fulfilled' && bunRes.value.ok) {
          const buns = await bunRes.value.json().catch(() => null);
          if (buns && buns.success && buns.data?.bundles) {
            setBundles(buns.data.bundles.map((b: any) => ({
              id: b.product?.id || '',
              title: b.product?.title || '',
              price: typeof b.product?.price === 'number' && !isNaN(b.product.price) ? b.product.price : 0,
              platform: b.product?.platform || '',
              url: b.product?.url || '',
              estimatedAccessoryValue: typeof b.estimatedAccessoryValue === 'number' && !isNaN(b.estimatedAccessoryValue) ? b.estimatedAccessoryValue : 0,
              priceDifference: typeof b.priceDifference === 'number' && !isNaN(b.priceDifference) ? b.priceDifference : 0,
              netValue: typeof b.netValue === 'number' && !isNaN(b.netValue) ? b.netValue : 0
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

  // Fetch coupons for product
  const fetchCoupons = async () => {
    if (!productId) return;

    setLoadingCoupons(true);
    try {
      const res = await fetch(`/api/coupons/${productId}`, {
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setCoupons(data.data);
        }
      } else {
        console.warn('Failed to fetch coupons');
        setCoupons([]);
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
      setCoupons([]);
    } finally {
      setLoadingCoupons(false);
    }
  };

  // Fetch global landed costs
  const fetchGlobalData = async () => {
    if (!productId) return;

    setLoadingGlobal(true);
    try {
      const res = await fetch(`/api/global/landed-cost?productId=${productId}`, {
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          setGlobalData(data.data);
        }
      } else {
        console.warn('Failed to fetch global data');
        setGlobalData(null);
      }
    } catch (error) {
      console.error('Error fetching global data:', error);
      setGlobalData(null);
    } finally {
      setLoadingGlobal(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mb-4"></div>
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
    <div className="max-w-5xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-lg shadow relative">
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
                💰 Price dropped by ${(safeProduct.priceDrop || 0).toFixed(2)} ({safeProduct.priceDropPercent || 0}%)
              </p>
              <p className="text-xs text-green-600">
                Previous: ${((safeProduct.previousPrice || 0)).toFixed(2)}
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

      {/* Tabbed Interface */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('ai')}
            className={`${activeTab === 'ai'
              ? 'border-slate-800 text-slate-800 dark:text-slate-200'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            AI Analysis
          </button>
          <button
            onClick={() => {
              setActiveTab('coupons');
              if (coupons.length === 0 && !loadingCoupons) {
                fetchCoupons();
              }
            }}
            className={`${activeTab === 'coupons'
              ? 'border-slate-800 text-slate-800 dark:text-slate-200'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Coupons
          </button>
          <button
            onClick={() => {
              setActiveTab('global');
              if (!globalData && !loadingGlobal) {
                fetchGlobalData();
              }
            }}
            className={`${activeTab === 'global'
              ? 'border-slate-800 text-slate-800 dark:text-slate-200'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Global
          </button>
          <button
            onClick={() => setActiveTab('community')}
            className={`${activeTab === 'community'
              ? 'border-slate-800 text-slate-800 dark:text-slate-200'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Community
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mb-6">
        {/* AI Analysis Tab */}
        {activeTab === 'ai' && (
          <AdvancedAnalysis product={safeProduct} />
        )}

        {/* Coupons Tab */}
        {activeTab === 'coupons' && (
          <div className="space-y-4">
            {loadingCoupons ? (
              <div className="flex items-center justify-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">Finding coupons...</span>
              </div>
            ) : coupons.length > 0 ? (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Found {coupons.length} valid coupon code{coupons.length !== 1 ? 's' : ''}
                </p>
                <div className="grid gap-4">
                  {coupons.map((coupon, index) => (
                    <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <code className="px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded font-mono text-sm font-semibold">
                              {coupon.code}
                            </code>
                            <span className={`px-2 py-0.5 rounded text-xs ${coupon.source === 'Verified'
                              ? 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                              }`}>
                              {coupon.source}
                            </span>
                            {coupon.discount && (
                              <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs font-medium">
                                {coupon.discount}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{coupon.description}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(coupon.code);
                              toast.success(
                                `Code copied: ${coupon.code}`);
                            }}
                            className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 text-sm font-medium whitespace-nowrap"
                          >
                            Copy
                          </button>
                          <button
                            onClick={() => {
                              // Copy code to clipboard
                              navigator.clipboard.writeText(coupon.code);
                              // Open ORIGINAL product URL (not coupon link!)
                              window.open(safeProduct.url, '_blank');
                              // Show toast
                              toast.success(`Code copied! Opening ${safeProduct.platform}...`);
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium whitespace-nowrap"
                          >
                            Apply →
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400 mb-2 font-medium">No active coupon codes found right now</p>
                <p className="text-sm text-gray-500 dark:text-gray-500">Try checking the product page directly or come back later</p>
              </div>
            )}
          </div>
        )}

        {/* Global Tab */}
        {activeTab === 'global' && (
          <div className="space-y-4">
            {loadingGlobal ? (
              <div className="flex items-center justify-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">Calculating global prices...</span>
              </div>
            ) : globalData && globalData.countries && Array.isArray(globalData.countries) ? (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Compare landed costs across 6 countries (includes shipping, VAT, and import tariffs)
                </p>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {globalData.countries.map((country: any, index: number) => {
                    try {
                      const isCheapest = country.countryCode === globalData.cheapest;
                      return (
                        <div
                          key={country.countryCode || index}
                          className={`p-4 rounded-lg border-2 ${isCheapest
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                            }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-3xl">{country.flag || '🌍'}</span>
                              <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">{country.country || 'Unknown'}</h3>
                                {isCheapest && (
                                  <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded font-medium">
                                    Cheapest!
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Local Price:</span>
                              <span className="font-medium">{country.currencySymbol || '$'}{(country.localPrice || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Shipping:</span>
                              {country.isOriginCountry ? (
                                <span className="text-xs text-green-600 dark:text-green-400 font-medium italic">Usually free with Prime</span>
                              ) : (
                                <span>+${country.shipping || 0}</span>
                              )}
                            </div>
                            {country.deliveryDays && (
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Delivery:</span>
                                <span className="text-xs text-gray-500">{country.deliveryDays} days</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">VAT ({country.isOriginCountry ? 0 : country.vatRate || 0}%):</span>
                              <span>+{country.currencySymbol || '$'}{(country.vatAmount || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">Tariff ({country.isOriginCountry ? 0 : country.tariffRate || 0}%):</span>
                              <span>+{country.currencySymbol || '$'}{(country.tariffAmount || 0).toLocaleString()}</span>
                            </div>
                            <div className="pt-2 border-t border-gray-300 dark:border-gray-600 flex justify-between font-bold">
                              <span className="text-gray-900 dark:text-white">Total:</span>
                              <span className="text-lg text-blue-600 dark:text-blue-400">
                                {country.currencySymbol || '$'}{(country.total || 0).toLocaleString()}
                              </span>
                            </div>
                          </div>

                          {/* Savings/Status badge */}
                          {country.isOriginCountry ? (
                            <div className="my-2 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg text-center border border-blue-100 dark:border-blue-800">
                              <span className="text-blue-700 dark:text-blue-300 font-medium text-xs">
                                ✨ You’re in the cheapest region
                              </span>
                            </div>
                          ) : country.savingsVsTracked && country.savingsVsTracked < -5 && (
                            <div className="my-2 bg-yellow-100 dark:bg-yellow-900/30 px-3 py-1.5 rounded-lg text-center">
                              <span className="text-yellow-800 dark:text-yellow-200 font-semibold text-sm">
                                💰 Save ${Math.abs(country.savingsVsTracked).toFixed(2)}!
                              </span>
                            </div>
                          )}

                          {/* Smart Buy button */}
                          {country.canBuyHere && country.realStoreUrl ? (
                            <button
                              onClick={() => window.open(country.realStoreUrl, '_blank')}
                              className="mt-3 w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium transition-colors"
                            >
                              🛒 Buy on {country.storeName} {country.countryCode}
                            </button>
                          ) : (
                            <div className="mt-3 text-center text-sm text-gray-500 dark:text-gray-400 italic py-2 bg-gray-100 dark:bg-gray-800 rounded-md">
                              Estimate only - {(globalData as any).trackedStore || 'Store'} not available in {country.country}
                            </div>
                          )}
                        </div>
                      );
                    } catch (error) {
                      console.error('Error rendering country card:', error);
                      return null;
                    }
                  }).filter(Boolean)}
                </div>

                {/* ASIN Availability Disclaimer */}
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                    <strong>ℹ️ Note:</strong> Amazon uses different product codes (ASINs) per country. Some products may not be available in all regions.
                    Links open the same ASIN in each country's store - if unavailable, you'll see an error page.
                    Prices and shipping estimates are still accurate for comparison.
                  </p>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center italic">
                  * Shipping & taxes shown for international buyers. US users see base price. Estimates from ExchangeRate.host and API Ninja.
                </p>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400 mb-2 font-medium">Unable to load global pricing</p>
                <p className="text-sm text-gray-500 dark:text-gray-500">Response: {JSON.stringify(globalData || {}).substring(0, 100)}</p>
                <button
                  onClick={() => fetchGlobalData()}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        )}

        {/* Community Tab */}
        {activeTab === 'community' && (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">Coming Soon</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Community reviews and discussions</p>
          </div>
        )}
      </div>

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
            {alternatives.filter(alt => alt != null).map((alt) => {
              const safePrice = typeof alt?.price === 'number' && !isNaN(alt.price) ? alt.price : 0;
              return (
                <div key={alt?.id || Math.random()} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{alt?.title || 'Unknown'}</p>
                    <p className="text-xs text-gray-600">{alt?.platform || 'Unknown'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">${safePrice.toFixed(2)}</p>
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
              );
            })}
          </div>
        </div>
      )}

      {/* Bundle Recommendations */}
      {bundles.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Bundle Recommendations</h3>
          <div className="space-y-3">
            {bundles.filter(bundle => bundle != null && bundle.title && bundle.title !== 'Unknown').map((bundle) => {
              const safePrice = typeof bundle?.price === 'number' && !isNaN(bundle.price) ? bundle.price : 0;
              const safeAccessoryValue = typeof bundle?.estimatedAccessoryValue === 'number' && !isNaN(bundle.estimatedAccessoryValue) ? bundle.estimatedAccessoryValue : 0;
              const safeNetValue = typeof bundle?.netValue === 'number' && !isNaN(bundle.netValue) ? bundle.netValue : 0;
              return (
                <div key={bundle?.id || Math.random()} className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{bundle?.title || 'Unknown'}</h4>
                    <span className="text-sm text-blue-600">{bundle?.platform || 'Unknown'}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Price</p>
                      <p className="font-semibold">${safePrice.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Accessory Value</p>
                      <p className="font-semibold">${safeAccessoryValue.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Net Value</p>
                      <p className="font-semibold text-green-600">${safeNetValue.toFixed(2)}</p>
                    </div>
                  </div>
                  <a
                    href={bundle?.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 text-sm text-blue-600 hover:underline"
                  >
                    View Bundle →
                  </a>
                </div>
              );
            })}
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
              placeholder={`${((safeProduct.price || 0) * 0.9).toFixed(2)}`}
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