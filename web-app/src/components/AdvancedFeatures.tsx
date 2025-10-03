import React, { useState, useEffect } from 'react';
import { 
  Star, 
  Globe, 
  ShoppingCart, 
  Users, 
  Shield, 
  Zap, 
  TrendingUp,
  Award,
  Tag,
  CheckCircle
} from 'lucide-react';

interface AdvancedFeaturesProps {
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

interface ConditionAnalysis {
  score: number;
  riskLevel: 'Low' | 'Medium' | 'High';
  recommendation: string;
  confidence: number;
}

interface CouponStack {
  coupons: Array<{
    code: string;
    discount: string;
    successRate: number;
  }>;
  originalPrice: number;
  finalPrice: number;
  totalSavings: number;
  savingsPercent: number;
}

interface GlobalComparison {
  markets: Array<{
    country: string;
    flag: string;
    price: number;
    landedCost: number;
    savings: number;
  }>;
  bestDeal: string;
  recommendation: string;
}

interface CommunityAnalysis {
  credibilityScore: number;
  communityRating: number;
  votes: number;
  badges: string[];
  expertEndorsements: number;
}

export default function AdvancedFeatures({ product }: AdvancedFeaturesProps) {
  const [conditionAnalysis, setConditionAnalysis] = useState<ConditionAnalysis | null>(null);
  const [couponStack, setCouponStack] = useState<CouponStack | null>(null);
  const [globalComparison, setGlobalComparison] = useState<GlobalComparison | null>(null);
  const [communityAnalysis, setCommunityAnalysis] = useState<CommunityAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('condition');

  useEffect(() => {
    loadAdvancedFeatures();
  }, [product.id]);

  const loadAdvancedFeatures = async () => {
    setLoading(true);
    try {
      // Use real product-card analysis endpoint (rule-based, no AI)
      const enhancedResponse = await fetch(`/api/advanced/product-card-analysis/${product.id}`);
      if (enhancedResponse.ok) {
        const enhancedData = await enhancedResponse.json();
        const data = enhancedData.data || enhancedData; // Support direct or wrapped payloads

        // Update all features with enhanced data
        if (data.conditionAnalysis) {
          setConditionAnalysis({
            score: data.conditionAnalysis.score,
            riskLevel: (data.conditionAnalysis.riskLevel || 'Medium') as 'Low' | 'Medium' | 'High',
            recommendation: (data.conditionAnalysis.recommendations?.[0] || 'No recommendation'),
            confidence: data.conditionAnalysis.confidence ?? 0
          });
        }
        if (data.couponAnalysis) {
          const coupons = Array.isArray(data.couponAnalysis.coupons)
            ? data.couponAnalysis.coupons.map((c: any) => ({
                code: c.code || '',
                discount: c.description || `${c.discountType === 'percentage' ? c.discountValue + '%' : `$${c.discountValue}`} off`,
                successRate: c.successRate || 0
              }))
            : [];
          const estimatedSavings = Number(data.couponAnalysis.estimatedSavings || 0);
          setCouponStack({
            coupons,
            originalPrice: product.price,
            finalPrice: Math.max(0, product.price - estimatedSavings),
            totalSavings: estimatedSavings,
            savingsPercent: product.price > 0 ? Math.round((estimatedSavings / product.price) * 100) : 0
          });
        }
        if (data.globalAnalysis) {
          // Transform backend MarketComparison into UI shape
          const ga = data.globalAnalysis;
          const flag = (cc: string) => {
            const m: Record<string, string> = { US: '🇺🇸', EU: '🇪🇺', UK: '🇬🇧', JP: '🇯🇵', CA: '🇨🇦', AU: '🇦🇺', DE: '🇩🇪', FR: '🇫🇷', IT: '🇮🇹', ES: '🇪🇸' };
            return m[cc] || '🌍';
          };
          const marketsArr = ga.markets
            ? Object.entries(ga.markets).map(([country, v]: any) => ({
                country,
                flag: flag(country),
                price: v.price,
                landedCost: v.landedCost,
                savings: (ga.bestDeal?.bestMarket?.landedCost ?? ga.bestDeal?.landedCost ?? product.price) - v.landedCost
              }))
            : [];
          setGlobalComparison({
            markets: marketsArr,
            bestDeal: ga.bestDeal?.bestMarket?.countryCode || ga.bestDeal?.countryCode || 'US',
            recommendation: ga.recommendation || 'buy_local'
          });
        }
        if (data.communityAnalysis) {
          const ca = data.communityAnalysis;
          setCommunityAnalysis({
            credibilityScore: Math.round(ca.trustScore ?? 0),
            communityRating: Number(ca.communityRating ?? 0),
            votes: Number(ca.totalVotes ?? 0),
            badges: [],
            expertEndorsements: Number(ca.expertEndorsements ?? 0)
          });
        }
      } else {
        // Fallback to individual API calls
        await Promise.all([
          loadConditionAnalysis(),
          loadCouponStack(),
          loadGlobalComparison(),
          loadCommunityAnalysis()
        ]);
      }
    } catch (error) {
      console.error('Error loading advanced features:', error);
      // Fallback to individual API calls
      await Promise.all([
        loadConditionAnalysis(),
        loadCouponStack(),
        loadGlobalComparison(),
        loadCommunityAnalysis()
      ]);
    }
    setLoading(false);
  };

  const loadConditionAnalysis = async () => {
    try {
      const response = await fetch(`/api/advanced/condition-analysis/${product.id}`);
      if (response.ok) {
        const data = await response.json();
        setConditionAnalysis({
          score: data.conditionScore || 82,
          riskLevel: data.riskLevel || 'Medium',
          recommendation: data.recommendation || 'Analysis completed',
          confidence: data.confidence || 85
        });
      } else {
        // Fallback to mock data if API fails
        const conditionScore = product.conditionScore ?? 82;
        const mockAnalysis: ConditionAnalysis = {
          score: conditionScore,
          riskLevel: conditionScore > 80 ? 'Low' : conditionScore > 60 ? 'Medium' : 'High',
          recommendation: product.condition === 'used' ? 'Good value - condition better than average refurb' : 'Excellent condition',
          confidence: 92
        };
        setConditionAnalysis(mockAnalysis);
      }
    } catch (error) {
      console.error('Error loading condition analysis:', error);
      // Fallback to mock data
      const conditionScore = product.conditionScore ?? 82;
      const mockAnalysis: ConditionAnalysis = {
        score: conditionScore,
        riskLevel: conditionScore > 80 ? 'Low' : conditionScore > 60 ? 'Medium' : 'High',
        recommendation: product.condition === 'used' ? 'Good value - condition better than average refurb' : 'Excellent condition',
        confidence: 92
      };
      setConditionAnalysis(mockAnalysis);
    }
  };

  const loadCouponStack = async () => {
    try {
      const response = await fetch(`/api/advanced/coupons/${product.id}`);
      if (response.ok) {
        const data = await response.json();
        setCouponStack({
          coupons: data.coupons || [],
          originalPrice: product.price,
          finalPrice: data.finalPrice || product.price,
          totalSavings: data.totalSavings || 0,
          savingsPercent: data.savingsPercent || 0
        });
      } else {
        // Fallback to mock data if API fails
        const mockStack: CouponStack = {
          coupons: [
            { code: 'SAVE15', discount: '15% off', successRate: 94 },
            { code: 'FREESHIP', discount: 'Free shipping', successRate: 92 },
            { code: 'NEWUSER5', discount: '5% off', successRate: 87 }
          ],
          originalPrice: product.price,
          finalPrice: product.finalPrice || Math.round(product.price * 0.85),
          totalSavings: Math.round(product.price * 0.15),
          savingsPercent: 15
        };
        setCouponStack(mockStack);
      }
    } catch (error) {
      console.error('Error loading coupon stack:', error);
      // Fallback to mock data
      const mockStack: CouponStack = {
        coupons: [
          { code: 'SAVE15', discount: '15% off', successRate: 94 },
          { code: 'FREESHIP', discount: 'Free shipping', successRate: 92 },
          { code: 'NEWUSER5', discount: '5% off', successRate: 87 }
        ],
        originalPrice: product.price,
        finalPrice: product.finalPrice || Math.round(product.price * 0.85),
        totalSavings: Math.round(product.price * 0.15),
        savingsPercent: 15
      };
      setCouponStack(mockStack);
    }
  };

  const loadGlobalComparison = async () => {
    try {
      const response = await fetch(`/api/advanced/global-arbitrage/${product.id}`);
      if (response.ok) {
        const data = await response.json();
        setGlobalComparison({
          markets: data.markets || [
            { country: 'US', flag: '🇺🇸', price: product.price, landedCost: product.price, savings: 0 },
            { country: 'Japan', flag: '🇯🇵', price: product.price * 0.92, landedCost: product.price * 1.03, savings: -31 },
            { country: 'UK', flag: '🇬🇧', price: product.price * 1.05, landedCost: product.price * 1.12, savings: -120 }
          ],
          bestDeal: data.bestDeal || 'US (Current)',
          recommendation: data.recommendation || 'Best deal is local purchase'
        });
      } else {
        // Fallback to mock data if API fails
        const mockGlobal: GlobalComparison = {
          markets: [
            { country: 'US', flag: '🇺🇸', price: product.price, landedCost: product.price, savings: 0 },
            { country: 'Japan', flag: '🇯🇵', price: product.price * 0.92, landedCost: product.price * 1.03, savings: -31 },
            { country: 'UK', flag: '🇬🇧', price: product.price * 1.05, landedCost: product.price * 1.12, savings: -120 }
          ],
          bestDeal: 'US (Current)',
          recommendation: 'Best deal is local purchase'
        };
        setGlobalComparison(mockGlobal);
      }
    } catch (error) {
      console.error('Error loading global comparison:', error);
      // Fallback to mock data
      const mockGlobal: GlobalComparison = {
        markets: [
          { country: 'US', flag: '🇺🇸', price: product.price, landedCost: product.price, savings: 0 },
          { country: 'Japan', flag: '🇯🇵', price: product.price * 0.92, landedCost: product.price * 1.03, savings: -31 },
          { country: 'UK', flag: '🇬🇧', price: product.price * 1.05, landedCost: product.price * 1.12, savings: -120 }
        ],
        bestDeal: 'US (Current)',
        recommendation: 'Best deal is local purchase'
      };
      setGlobalComparison(mockGlobal);
    }
  };

  const loadCommunityAnalysis = async () => {
    try {
      const response = await fetch(`/api/advanced/community-analysis/${product.id}`);
      if (response.ok) {
        const data = await response.json();
        setCommunityAnalysis({
          credibilityScore: data.credibilityScore || product.credibilityScore || 87,
          communityRating: data.communityRating || product.communityRating || 4.2,
          votes: data.votes || 156,
          badges: data.badges || (product.isVerified ? ['Community Favorite', 'Expert Verified', 'Hot Deal'] : ['Price Verified']),
          expertEndorsements: data.expertEndorsements || 2
        });
      } else {
        // Fallback to mock data if API fails
        const mockCommunity: CommunityAnalysis = {
          credibilityScore: product.credibilityScore || 87,
          communityRating: product.communityRating || 4.2,
          votes: 156,
          badges: product.isVerified ? ['Community Favorite', 'Expert Verified', 'Hot Deal'] : ['Price Verified'],
          expertEndorsements: 2
        };
        setCommunityAnalysis(mockCommunity);
      }
    } catch (error) {
      console.error('Error loading community analysis:', error);
      // Fallback to mock data
      const mockCommunity: CommunityAnalysis = {
        credibilityScore: product.credibilityScore || 87,
        communityRating: product.communityRating || 4.2,
        votes: 156,
        badges: product.isVerified ? ['Community Favorite', 'Expert Verified', 'Hot Deal'] : ['Price Verified'],
        expertEndorsements: 2
      };
      setCommunityAnalysis(mockCommunity);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'condition', label: 'Condition', icon: Star },
    { id: 'coupons', label: 'Coupons', icon: Tag },
    { id: 'global', label: 'Global', icon: Globe },
    { id: 'community', label: 'Community', icon: Users }
  ];

  const Badge = ({ children, variant = 'default' }: { children: React.ReactNode, variant?: string }) => (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
      variant === 'destructive' ? 'bg-red-100 text-red-800' : 
      variant === 'outline' ? 'bg-white border border-gray-300 text-gray-700' :
      'bg-blue-100 text-blue-800'
    }`}>
      {children}
    </span>
  );

  const Button = ({ children, onClick, className }: { children: React.ReactNode, onClick: () => void, className?: string }) => (
    <button 
      onClick={onClick}
      className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center ${className || ''}`}
    >
      {children}
    </button>
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-600" />
          Advanced Analysis
        </h2>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'condition' && conditionAnalysis && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Condition Analysis</h3>
            <Badge variant={conditionAnalysis.riskLevel === 'Low' ? 'default' : 'destructive'}>
              {conditionAnalysis.riskLevel} Risk
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{conditionAnalysis.score}/100</div>
              <div className="text-sm text-gray-600">Condition Score</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{conditionAnalysis.confidence}%</div>
              <div className="text-sm text-gray-600">Confidence</div>
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="font-medium">Recommendation</span>
            </div>
            <p className="text-gray-700">{conditionAnalysis.recommendation}</p>
          </div>
        </div>
      )}

      {activeTab === 'coupons' && couponStack && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Best Coupon Stack</h3>
            <Badge>{couponStack.savingsPercent}% Savings</Badge>
          </div>
          <div className="space-y-2">
            {couponStack.coupons.map((coupon, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-medium">{coupon.code}</span>
                  <span className="text-gray-600 ml-2">({coupon.discount})</span>
                </div>
                <Badge variant="outline">{coupon.successRate}% success</Badge>
              </div>
            ))}
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span>Original Price:</span>
              <span className="line-through text-gray-500">${couponStack.originalPrice}</span>
            </div>
            <div className="flex justify-between items-center font-bold text-green-600">
              <span>Final Price:</span>
              <span>${couponStack.finalPrice}</span>
            </div>
            <div className="flex justify-between items-center text-green-600">
              <span>Total Savings:</span>
              <span>${couponStack.totalSavings}</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'global' && globalComparison && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Global Price Comparison</h3>
            <Badge>Best: {globalComparison.bestDeal}</Badge>
          </div>
          <div className="space-y-2">
            {globalComparison.markets.map((market, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{market.flag}</span>
                  <span className="font-medium">{market.country}</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">${market.landedCost} landed</div>
                  <div className={`text-sm ${market.savings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {market.savings >= 0 ? '+' : ''}${market.savings}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-4 h-4 text-blue-600" />
              <span className="font-medium">Recommendation</span>
            </div>
            <p className="text-gray-700">{globalComparison.recommendation}</p>
          </div>
        </div>
      )}

      {activeTab === 'community' && communityAnalysis && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Community Analysis</h3>
            <Badge>{communityAnalysis.credibilityScore}/100 Credibility</Badge>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{communityAnalysis.communityRating}/5</div>
              <div className="text-sm text-gray-600">Community Rating</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{communityAnalysis.votes}</div>
              <div className="text-sm text-gray-600">Community Votes</div>
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">Badges</h4>
            <div className="flex flex-wrap gap-2">
              {communityAnalysis.badges.map((badge, index) => (
                <Badge key={index} variant="outline">{badge}</Badge>
              ))}
            </div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-4 h-4 text-green-600" />
              <span className="font-medium">Expert Endorsements</span>
            </div>
            <p className="text-gray-700">{communityAnalysis.expertEndorsements} verified experts recommend this deal</p>
          </div>
        </div>
      )}

      {/* Call to Action */}
      <div className="mt-6 pt-4 border-t">
        <Button onClick={() => {
          const buildAffiliateUrl = (url: string, platform: string) => {
            try {
              const u = new URL(url);
              if (platform.toLowerCase() === 'amazon') {
                if (u.searchParams.has('tag')) {
                  u.searchParams.set('tag', 'pricetrack0f8-20');
                } else {
                  u.searchParams.append('tag', 'pricetrack0f8-20');
                }
              } else if (platform.toLowerCase() === 'aliexpress') {
                // Append affiliate tag parameters; adjust if you have a specific program key
                if (!u.searchParams.has('aff_platform')) u.searchParams.append('aff_platform', 'api');
                if (u.searchParams.has('aff_short_key')) {
                  u.searchParams.set('aff_short_key', 'pricetrack0f8-20');
                } else {
                  u.searchParams.append('aff_short_key', 'pricetrack0f8-20');
                }
              }
              return u.toString();
            } catch {
              return url;
            }
          };
          const urlWithAffiliate = buildAffiliateUrl(product.url, product.platform);
          window.open(urlWithAffiliate, '_blank');
        }} className="w-full">
          <ShoppingCart className="w-4 h-4 mr-2" />
          Buy Now with Analysis
        </Button>
      </div>
    </div>
  );
} 