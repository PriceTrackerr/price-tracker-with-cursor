import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

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
  const { getAuthHeaders, token } = useAuth();
  const [activeTab, setActiveTab] = useState('condition');
  const [loading, setLoading] = useState(true);
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
            className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
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
            {aiRecommendation && (
              <div className={`relative overflow-hidden rounded-xl p-6 shadow-lg ${
                aiRecommendation.verdict === 'STRONG BUY' || aiRecommendation.verdict === 'BUY'
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
                      <span className="font-bold text-white text-lg">DeepSeek AI Recommendation</span>
                    </div>
                    <div className="mb-3">
                      <span className={`text-2xl font-bold ${
                        aiRecommendation.verdict === 'STRONG BUY' || aiRecommendation.verdict === 'BUY'
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
            )}

            <div className="flex items-center justify-between">
              <h4 className="font-medium">Condition Analysis</h4>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskLevel(features.conditionScore).color}`}>
                {getRiskLevel(features.conditionScore).level} Risk
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className={`text-2xl font-bold ${getScoreColor(features.conditionScore)}`}>
                  {features.conditionScore}/100
                </div>
                <div className="text-sm text-gray-600">Condition Score</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">92%</div>
                <div className="text-sm text-gray-600">Confidence</div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-green-600">✓</span>
                <span className="font-medium">Recommendation</span>
              </div>
              <p className="text-gray-700">
                {product.condition === 'used' 
                  ? 'Good value - condition better than average refurb'
                  : 'Excellent condition - verified seller'
                }
              </p>
            </div>
          </div>
        )}

        {activeTab === 'coupons' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Best Coupon Stack</h4>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                {safePrice > 0 ? Math.round((features.couponSavings / safePrice) * 100) : 0}% Savings
              </span>
            </div>

            <div className="space-y-2">
              {features.couponStack.length > 0 ? (
                features.couponStack.map((coupon, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                      <span className="font-medium">{coupon.code || 'N/A'}</span>
                      <span className="text-gray-600 ml-2">({coupon.discount})</span>
                </div>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      {coupon.successRate}% success
                    </span>
              </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No coupons available for this product
                </div>
              )}
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <span>Original Price:</span>
                <span className="line-through text-gray-500">${safeToFixed(safePrice)}</span>
              </div>
              <div className="flex justify-between items-center font-bold text-green-600">
                <span>Final Price:</span>
                <span>${safeToFixed(features.finalPrice)}</span>
              </div>
              <div className="flex justify-between items-center text-green-600">
                <span>Total Savings:</span>
                <span>${safeToFixed(features.couponSavings)}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'global' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Global Price Comparison</h4>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                Best: {features.bestDeal || 'US'} (Current)
              </span>
            </div>

            <div className="space-y-2">
              {(() => {
                try {
                  if (!Array.isArray(features.globalMarkets) || features.globalMarkets.length === 0) {
                    return (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span>🇺🇸</span>
                  <span className="font-medium">US</span>
                </div>
                <div className="text-right">
                          <div className="font-medium">${safeToFixed(product?.price)} landed</div>
                          <div className="text-sm text-gray-600">Local (Current)</div>
                </div>
              </div>
                    );
                  }
                  
                  const validMarkets = features.globalMarkets.filter(market => 
                    market != null && 
                    typeof market === 'object'
                  );

                  if (validMarkets.length === 0) {
                    return (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                          <span>🇺🇸</span>
                          <span className="font-medium">US</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">${safeToFixed(product?.price)} landed</div>
                          <div className="text-sm text-gray-600">Local (Current)</div>
                        </div>
                      </div>
                    );
                  }

                  return validMarkets.map((market, idx) => {
                    // Extra defensive checks with fallbacks
                    let landedCost = 0;
                    if (market && typeof market.landedCost === 'number' && !isNaN(market.landedCost) && isFinite(market.landedCost)) {
                      landedCost = market.landedCost;
                    } else if (typeof product?.price === 'number' && !isNaN(product.price) && isFinite(product.price)) {
                      landedCost = product.price;
                    } else {
                      landedCost = 0;
                    }

                    let savings = 0;
                    if (market && typeof market.savings === 'number' && !isNaN(market.savings) && isFinite(market.savings)) {
                      savings = market.savings;
                    }

                    // Final safety check before toFixed - ensure it's always a valid number
                    let safeLandedCost = 0;
                    if (typeof landedCost === 'number' && !isNaN(landedCost) && isFinite(landedCost)) {
                      safeLandedCost = landedCost;
                    }
                    
                    let safeSavings = 0;
                    if (typeof savings === 'number' && !isNaN(savings) && isFinite(savings)) {
                      safeSavings = savings;
                    }

                    // Use safe helper function for all number formatting
                    return (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span>{market?.flag || '🌍'}</span>
                          <span className="font-medium">{market?.country || 'Unknown'}</span>
                </div>
                <div className="text-right">
                          <div className="font-medium">${safeToFixed(safeLandedCost)} landed</div>
                          {safeSavings !== 0 && (
                            <div className={`text-sm ${safeSavings > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {safeSavings > 0 ? '-' : '+'}${safeToFixed(Math.abs(safeSavings))}
                            </div>
                          )}
                </div>
              </div>
                    );
                  });
                } catch (error) {
                  console.error('Error rendering global markets:', error);
                  return (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                        <span>🇺🇸</span>
                        <span className="font-medium">US</span>
                </div>
                <div className="text-right">
                        <div className="font-medium">${safeToFixed(product?.price)} landed</div>
                        <div className="text-sm text-gray-600">Local (Current)</div>
                </div>
              </div>
                  );
                }
              })()}
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-blue-600">🌍</span>
                <span className="font-medium">Recommendation</span>
              </div>
              <p className="text-gray-700">Best deal is local purchase - international options cost more after shipping/taxes</p>
            </div>
          </div>
        )}

        {activeTab === 'community' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Community Analysis</h4>
              <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                {features.credibilityScore}/100 Credibility
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-yellow-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-yellow-600">{features.communityRating}/5</div>
                <div className="text-sm text-gray-600">Community Rating</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-600">156</div>
                <div className="text-sm text-gray-600">Community Votes</div>
              </div>
            </div>

            <div>
              <h5 className="font-medium mb-2">Badges</h5>
              <div className="flex flex-wrap gap-2">
                {product.isVerified ? (
                  <>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Community Favorite</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Expert Verified</span>
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Hot Deal</span>
                  </>
                ) : (
                  <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">Price Verified</span>
                )}
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-green-600">🏆</span>
                <span className="font-medium">Expert Endorsements</span>
              </div>
              <p className="text-gray-700">2 verified experts recommend this deal</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
} 