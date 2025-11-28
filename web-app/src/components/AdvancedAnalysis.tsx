import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface AdvancedAnalysisProps {
  product: {
    id: string;
    title: string;
    price: number;
    condition?: string;
    conditionScore?: number;
    platform: string;
    url: string;
    credibilityScore?: number;
    communityRating?: number;
    finalPrice?: number;
    isVerified?: boolean;
  };
}

// Helper function to safely format numbers
const safeToFixed = (value: any, decimals: number = 2): string => {
  try {
    const num = Number(value);
    if (typeof num !== 'number' || isNaN(num) || !isFinite(num)) {
      return '0.00';
    }
    return num.toFixed(decimals);
  } catch {
    return '0.00';
  }
};

export default function AdvancedAnalysis({ product }: AdvancedAnalysisProps) {
  const { getAuthHeaders, token, user } = useAuth();
  const [activeTab, setActiveTab] = useState('condition');
  const [loading, setLoading] = useState(true);

  // Coupon State
  const [coupons, setCoupons] = useState<Array<{ code: string; description: string; discount?: string; successRate?: number; source: string }>>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [couponError, setCouponError] = useState('');

  const [aiRecommendation, setAiRecommendation] = useState<{
    verdict: string;
    confidence: number;
    reason: string;
    loading: boolean;
  } | null>(null);

  // Safety check - ensure product has required fields
  if (!product || !product.id) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-4">
        <p className="text-gray-600 text-sm">Product data unavailable</p>
      </div>
    );
  }
  const safePrice = typeof product.price === 'number' && !isNaN(product.price) ? product.price : 0;
  const [features, setFeatures] = useState({
    conditionScore: product.conditionScore || 82,
    couponSavings: Math.round(safePrice * 0.15),
    finalPrice: product.finalPrice || Math.round(safePrice * 0.85),
    credibilityScore: product.credibilityScore || 87,
    communityRating: product.communityRating || 4.2,
    globalSavings: 0,
    couponStack: [] as Array<{ code: string; discount: string; successRate: number }>,
    globalMarkets: [] as Array<{ country: string; flag: string; price: number; landedCost: number; savings: number }>,
    bestDeal: 'US',
    recommendation: 'buy_local',
    priceHistory: [] as Array<{ price: number; timestamp: string }>,
    redditSentiment: 'neutral' as 'positive' | 'neutral' | 'negative'
  });

  useEffect(() => {
    async function loadAnalysisData() {
      if (!product.id || !token) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Load price history
        const historyResponse = await fetch(`/api/products/${product.id}/history`, {
          headers: getAuthHeaders(),
        });
        let priceHistory: Array<{ price: number; timestamp: string }> = [];
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          if (historyData.success && Array.isArray(historyData.data)) {
            priceHistory = historyData.data
              .slice(-30)
              .map((h: any) => ({
                price: h.price || 0,
                timestamp: h.timestamp || h.created_at || ''
              }));
          }
        }

        // Load advanced analysis
        const response = await fetch(`/api/advanced/product-card-analysis/${product.id}`, {
          headers: getAuthHeaders(),
        });

        let couponStack: Array<{ code: string; discount: string; successRate: number }> = [];
        let globalMarkets: Array<{ country: string; flag: string; price: number; landedCost: number; savings: number }> = [];
        let redditSentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
        let conditionScore = features.conditionScore;
        let credibilityScore = features.credibilityScore;
        let communityRating = features.communityRating;

        if (response.ok) {
          const data = await response.json();
          const analysis = data.data || data;

          if (analysis.conditionAnalysis) {
            conditionScore = analysis.conditionAnalysis.score || conditionScore;
          }

          if (analysis.couponAnalysis) {
            couponStack = Array.isArray(analysis.couponAnalysis.coupons)
              ? analysis.couponAnalysis.coupons.map((c: any) => ({
                code: c.code || '',
                discount: c.description || `${c.discountType === 'percentage' ? c.discountValue + '%' : `$${c.discountValue}`} off`,
                successRate: c.successRate || 0
              }))
              : [];
            const estimatedSavings = Number(analysis.couponAnalysis.estimatedSavings || 0);
            const currentPrice = typeof product.price === 'number' && !isNaN(product.price) ? product.price : 0;
            setFeatures(prev => ({
              ...prev,
              couponSavings: estimatedSavings,
              finalPrice: Math.max(0, currentPrice - estimatedSavings),
              couponStack
            }));
          }

          if (analysis.globalAnalysis) {
            const ga = analysis.globalAnalysis;
            const flag = (cc: string) => {
              const m: Record<string, string> = { US: '🇺🇸', EU: '🇪🇺', UK: '🇬🇧', JP: '🇯🇵', CA: '🇨🇦', AU: '🇦🇺', DE: '🇩🇪', FR: '🇫🇷', IT: '🇮🇹', ES: '🇪🇸' };
              return m[cc] || '🌍';
            };
            const basePrice = typeof product.price === 'number' && !isNaN(product.price) ? product.price : 0;
            globalMarkets = ga.markets
              ? Object.entries(ga.markets).map(([country, v]: any) => {
                const marketLandedCost = typeof v?.landedCost === 'number' && !isNaN(v.landedCost) ? v.landedCost : basePrice;
                const bestDealCost = typeof (ga.bestDeal?.bestMarket?.landedCost ?? ga.bestDeal?.landedCost) === 'number' && !isNaN(ga.bestDeal?.bestMarket?.landedCost ?? ga.bestDeal?.landedCost)
                  ? (ga.bestDeal?.bestMarket?.landedCost ?? ga.bestDeal?.landedCost)
                  : basePrice;
                return {
                  country,
                  flag: flag(country),
                  price: typeof v?.price === 'number' && !isNaN(v.price) ? v.price : basePrice,
                  landedCost: marketLandedCost,
                  savings: bestDealCost - marketLandedCost
                };
              })
              : [];
            setFeatures(prev => ({
              ...prev,
              globalMarkets: Array.isArray(globalMarkets) ? globalMarkets : [],
              bestDeal: ga.bestDeal?.bestMarket?.countryCode || ga.bestDeal?.countryCode || 'US',
              recommendation: ga.recommendation || 'buy_local'
            }));
          }

          if (analysis.communityAnalysis) {
            const ca = analysis.communityAnalysis;
            // Determine Reddit sentiment from community rating
            redditSentiment =
              (ca.communityRating || 0) >= 4 ? 'positive' :
                (ca.communityRating || 0) >= 3 ? 'neutral' : 'negative';
            credibilityScore = Math.round(ca.trustScore ?? credibilityScore);
            communityRating = Number(ca.communityRating ?? communityRating);

            setFeatures(prev => ({
              ...prev,
              credibilityScore,
              communityRating,
              redditSentiment
            }));
          }
        }

        // Update all features at once - ensure arrays are always arrays
        const updatedFeatures = {
          ...features,
          priceHistory: Array.isArray(priceHistory) ? priceHistory : [],
          couponStack: Array.isArray(couponStack) ? couponStack : [],
          globalMarkets: Array.isArray(globalMarkets) ? globalMarkets : [],
          redditSentiment,
          conditionScore: typeof conditionScore === 'number' && !isNaN(conditionScore) ? conditionScore : features.conditionScore,
          credibilityScore: typeof credibilityScore === 'number' && !isNaN(credibilityScore) ? credibilityScore : features.credibilityScore,
          communityRating: typeof communityRating === 'number' && !isNaN(communityRating) ? communityRating : features.communityRating
        };
        setFeatures(updatedFeatures);

        // Load AI recommendation with all collected data
        await loadAIRecommendation(priceHistory, updatedFeatures);
      } catch (error) {
        console.error('Error loading advanced analysis:', error);
      } finally {
        setLoading(false);
      }
    }

    async function loadAIRecommendation(
      priceHistory: Array<{ price: number; timestamp: string }>,
      currentFeatures: typeof features
    ) {
      if (!product.id || !token) return;

      // Only load AI recommendation for Pro users
      if (user?.subscription?.tier !== 'pro') return;

      setAiRecommendation({ verdict: '', confidence: 0, reason: '', loading: true });

      try {
        const currentPrice = typeof product.price === 'number' && !isNaN(product.price) ? product.price : 0;
        const lowestPrice = priceHistory.length > 0
          ? Math.min(...priceHistory.map(h => (typeof h?.price === 'number' && !isNaN(h.price) ? h.price : 0)).filter(p => p > 0), currentPrice)
          : currentPrice;

        const globalCheapest = currentFeatures.globalMarkets && currentFeatures.globalMarkets.length > 0
          ? (() => {
            try {
              const costs = currentFeatures.globalMarkets
                .map(m => {
                  if (m && typeof m.landedCost === 'number' && !isNaN(m.landedCost) && isFinite(m.landedCost)) {
                    return m.landedCost;
                  }
                  return currentPrice;
                })
                .filter(p => typeof p === 'number' && !isNaN(p) && isFinite(p) && p > 0);
              return costs.length > 0 ? Math.min(...costs, currentPrice) : currentPrice;
            } catch {
              return currentPrice;
            }
          })()
          : currentPrice;

        const hasCoupon = currentFeatures.couponStack && currentFeatures.couponStack.length > 0;

        const recommendationResponse = await fetch('/api/ai/recommendation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            productId: product.id,
            title: product.title || 'Product',
            currentPrice: product.price || 0,
            priceHistory: priceHistory || [],
            lowestPrice: lowestPrice || 0,
            globalCheapest: globalCheapest || 0,
            hasCoupon: hasCoupon || false,
            redditSentiment: currentFeatures.redditSentiment || 'neutral'
          }),
        });

        if (recommendationResponse.ok) {
          const recData = await recommendationResponse.json();
          if (recData.success && recData.data) {
            setAiRecommendation({
              verdict: recData.data.verdict || 'WAIT',
              confidence: recData.data.confidence || 75,
              reason: recData.data.reason || 'Analysis completed.',
              loading: false
            });
          } else {
            setAiRecommendation({
              verdict: 'WAIT',
              confidence: 70,
              reason: 'AI thinking… try again',
              loading: false
            });
          }
        } else {
          setAiRecommendation({
            verdict: 'WAIT',
            confidence: 70,
            reason: 'AI thinking… try again',
            loading: false
          });
        }
      } catch (error) {
        console.error('Error loading AI recommendation:', error);
        setAiRecommendation({
          verdict: 'WAIT',
          confidence: 70,
          reason: 'AI thinking… try again',
          loading: false
        });
      }
    }

    loadAnalysisData();
  }, [product.id, product.title, product.price, token, getAuthHeaders]);

  // Fetch coupons when tab is active
  useEffect(() => {
    if (activeTab === 'coupons' && coupons.length === 0 && !loadingCoupons) {
      fetchCoupons();
    }
  }, [activeTab]);

  const fetchCoupons = async () => {
    setLoadingCoupons(true);
    setCouponError('');
    try {
      const res = await fetch(`/api/coupons/find?query=${encodeURIComponent(product.title)}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setCoupons(data.data);
      } else {
        setCoupons([]);
      }
    } catch (err) {
      console.error('Error fetching coupons:', err);
      setCouponError('Failed to load coupons');
    } finally {
      setLoadingCoupons(false);
    }
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard!');
  };

  const handleApply = (code: string) => {
    // Try to send message to extension
    try {
      // Method 1: Chrome Runtime (if in extension context)
      if (window.chrome && window.chrome.runtime && window.chrome.runtime.sendMessage) {
        window.chrome.runtime.sendMessage({ type: 'APPLY_COUPON', code }, (response) => {
          if (window.chrome.runtime.lastError) {
            console.log('Extension message failed, trying postMessage');
            // Fallback to postMessage
            window.postMessage({ type: 'APPLY_COUPON_FROM_WEB', code }, '*');
          } else {
            toast.success('Applying coupon...');
          }
        });
      } else {
        // Method 2: postMessage (for web app to content script)
        window.postMessage({ type: 'APPLY_COUPON_FROM_WEB', code }, '*');
        toast.success('Applying coupon...');
      }
    } catch (e) {
      console.error('Failed to apply coupon:', e);
      toast.error('Could not apply coupon automatically');
    }
  };

  const tabs = [
    { id: 'condition', label: '🧠 Condition', color: 'blue' },
    { id: 'coupons', label: '🎟️ Coupons', color: 'green' },
    { id: 'global', label: '🌍 Global', color: 'purple' },
    { id: 'community', label: '👥 Community', color: 'orange' }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskLevel = (score: number) => {
    if (score >= 80) return { level: 'Low', color: 'bg-green-100 text-green-800' };
    if (score >= 60) return { level: 'Medium', color: 'bg-yellow-100 text-yellow-800' };
    return { level: 'High', color: 'bg-red-100 text-red-800' };
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-4">
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
            <p className="text-gray-600 text-sm">Loading analysis...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">⚡</span>
        <h3 className="text-lg font-semibold text-gray-900">Advanced Analysis</h3>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-4 bg-gray-100 p-1 rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.id
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[200px]">
        {activeTab === 'condition' && (
          <div className="space-y-4">
            {/* AI Recommendation Card - At the TOP */}
            {(user?.subscription?.tier === 'pro') ? (
              aiRecommendation && (
                <div className={`relative overflow-hidden rounded-xl p-6 shadow-lg ${aiRecommendation.verdict === 'STRONG BUY' || aiRecommendation.verdict === 'BUY'
                  ? 'bg-gradient-to-br from-green-900 via-green-800 to-emerald-900'
                  : aiRecommendation.verdict === 'WAIT'
                    ? 'bg-gradient-to-br from-yellow-900 via-yellow-800 to-amber-900'
                    : 'bg-gradient-to-br from-red-900 via-red-800 to-rose-900'
                  }`}>
                  {aiRecommendation.loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-white mb-3"></div>
                        <p className="text-white/90 text-sm font-medium">AI thinking…</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">🤖</span>
                        <span className="font-bold text-white text-lg">AI Recommendation</span>
                      </div>
                      <div className="mb-3">
                        <span className={`text-2xl font-bold ${aiRecommendation.verdict === 'STRONG BUY' || aiRecommendation.verdict === 'BUY'
                          ? 'text-green-300'
                          : aiRecommendation.verdict === 'WAIT'
                            ? 'text-yellow-300'
                            : 'text-red-300'
                          }`}>
                          {aiRecommendation.confidence}% Confidence: {aiRecommendation.verdict}
                        </span>
                      </div>
                      <p className="text-white/90 text-sm mb-4 leading-relaxed">
                        {aiRecommendation.reason || 'AI thinking… try again'}
                      </p>
                      <a
                        href={product.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-5 py-2.5 rounded-lg hover:bg-white/30 transition-all font-medium text-sm border border-white/30"
                      >
                        <span>🛒</span>
                        Buy Now with AI Analysis
                      </a>
                    </>
                  )}
                </div>
              )
            ) : (
              <div className="relative overflow-hidden rounded-xl p-6 shadow-lg bg-gradient-to-br from-gray-900 via-gray-800 to-slate-900">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">🔒</span>
                  <span className="font-bold text-white text-lg">AI Analysis</span>
                </div>
                <p className="text-white/90 text-sm mb-4 leading-relaxed">
                  Unlock AI-powered price predictions, buy/wait recommendations, and sentiment analysis with Pro.
                </p>
                <a
                  href="/subscription"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-amber-600 text-white px-5 py-2.5 rounded-lg hover:from-yellow-400 hover:to-amber-500 transition-all font-medium text-sm shadow-lg"
                >
                  <span>⭐</span>
                  Upgrade to Pro
                </a>
              </div>
            )}

            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-100">
              <div className="text-4xl mb-3">🧠</div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Condition Analysis Coming Soon</h4>
              <p className="text-gray-600 max-w-md mx-auto">
                We're building an AI-powered system to analyze product condition from images and descriptions.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'coupons' && (
          <div className="space-y-4">
            {loadingCoupons ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-2"></div>
                <p className="text-gray-600">Finding best coupons...</p>
              </div>
            ) : couponError ? (
              <div className="text-center py-8 text-red-600">
                <p>{couponError}</p>
                <button onClick={fetchCoupons} className="mt-2 text-sm underline">Try Again</button>
              </div>
            ) : coupons.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-100">
                <div className="text-4xl mb-3">🎟️</div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">No Coupons Found</h4>
                <p className="text-gray-600 max-w-md mx-auto">
                  We couldn't find any active coupons for this product right now.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">Available Coupons ({coupons.length})</h4>
                  <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded">
                    Up to {coupons[0].discount || '15%'} Off
                  </span>
                </div>
                {coupons.map((coupon, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border border-green-100 bg-green-50/30 rounded-lg hover:bg-green-50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-green-700 text-lg">{coupon.code}</span>
                        {coupon.successRate && (
                          <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                            {coupon.successRate}% Success
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5">{coupon.description}</p>
                      <p className="text-xs text-gray-400 mt-1">Source: {coupon.source}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopy(coupon.code)}
                        className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded hover:bg-gray-50"
                      >
                        Copy
                      </button>
                      <button
                        onClick={() => handleApply(coupon.code)}
                        className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 shadow-sm"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'global' && (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-100">
            <div className="text-4xl mb-3">🌍</div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Global Comparison Coming Soon</h4>
            <p className="text-gray-600 max-w-md mx-auto">
              Compare prices across international markets to find the absolute lowest price worldwide.
            </p>
          </div>
        )}

        {activeTab === 'community' && (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-100">
            <div className="text-4xl mb-3">👥</div>
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Community Features Coming Soon</h4>
            <p className="text-gray-600 max-w-md mx-auto">
              Join the discussion, share deals, and get verified advice from our expert community.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}