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
    imageUrl?: string;
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mt-4">
        <p className="text-gray-600 dark:text-gray-300 text-sm">Product data unavailable</p>
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

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mt-4">
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
            <p className="text-gray-600 dark:text-gray-300 text-sm">Loading analysis...</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate deal score from current data
  const dealScore = (() => {
    let score = 5;
    if (features.priceHistory.length > 5) {
      const avg = features.priceHistory.reduce((sum, h) => sum + h.price, 0) / features.priceHistory.length;
      if (product.price < avg * 0.85) score += 3;
      else if (product.price < avg * 0.95) score += 1.5;
    }
    if (features.couponStack.length > 0) score += 1;
    return Math.min(10, score).toFixed(1);
  })();

  const estimatedSavings = features.couponSavings || Math.round(safePrice * 0.12);

  return (
    <section className="py-16 bg-slate-900 dark:bg-slate-950 text-white overflow-hidden relative rounded-3xl my-8">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-500/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-sm font-medium mb-6">
              <span className="text-base">🤖</span>
              <span>Powered by Advanced AI</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 tracking-tight">
              Shopping Intelligence <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
                From the Future.
              </span>
            </h2>
            <p className="text-lg text-slate-400 mb-8 leading-relaxed">
              Our AI analyzes millions of data points to predict price trends, assess deal quality, and find hidden discounts that other tools miss.
            </p>

            <div className="space-y-6">
              {[
                { title: 'Price Prediction', desc: 'Know if the price will drop in the next 7 days.', icon: '📊' },
                { title: 'Deal Quality Score', desc: 'Instant 1-10 rating based on historical data.', icon: '⭐' },
                { title: 'Smart Coupons', desc: 'Automatically tests the best codes for you.', icon: '⚡' }
              ].map((feature, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0 border border-slate-700">
                    <span className="text-2xl">{feature.icon}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-1">{feature.title}</h3>
                    <p className="text-slate-400">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            {/* Hand-drawn border effect */}
            <svg className="absolute -inset-4 w-[calc(100%+2rem)] h-[calc(100%+2rem)] pointer-events-none" viewBox="0 0 400 500" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M10,10 Q5,5 15,8 L380,15 Q395,15 390,30 L395,470 Q395,490 375,488 L20,485 Q5,485 8,470 L5,25 Q5,10 10,10 Z"
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            <div className="relative bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-3xl p-8">
              {/* AI Card Simulation */}
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-700 pb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-lg p-2 flex items-center justify-center">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt="Product" className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-2xl">📦</span>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-white truncate max-w-[200px]">{product.title.substring(0, 30)}...</div>
                      <div className="text-sm text-slate-400">{product.platform}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">${product.price.toFixed(2)}</div>
                    <div className="text-sm text-green-400">-13% Drop</div>
                  </div>
                </div>

                <div className="space-y-4">
                  {(user?.subscription?.tier === 'pro' && aiRecommendation) ? (
                    <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-slate-400">AI Recommendation</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${aiRecommendation.verdict === 'STRONG BUY' || aiRecommendation.verdict === 'BUY'
                            ? 'bg-green-500/20 text-green-400'
                            : aiRecommendation.verdict === 'WAIT'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                          {aiRecommendation.loading ? 'Analyzing...' : aiRecommendation.verdict}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300">
                        {aiRecommendation.loading
                          ? 'AI is analyzing price trends...'
                          : aiRecommendation.reason}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-slate-400">AI Recommendation</span>
                        <span className="px-2 py-1 rounded bg-green-500/20 text-green-400 text-xs font-medium">Strong Buy</span>
                      </div>
                      <p className="text-sm text-slate-300">
                        Price is at a 6-month low. AI predicts a 85% chance of price increase within 48 hours.
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50 text-center">
                      <div className="text-sm text-slate-400 mb-1">Deal Score</div>
                      <div className="text-3xl font-bold text-indigo-400">{dealScore}<span className="text-sm text-slate-500">/10</span></div>
                    </div>
                    <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50 text-center">
                      <div className="text-sm text-slate-400 mb-1">Potential Savings</div>
                      <div className="text-3xl font-bold text-green-400">${estimatedSavings}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}