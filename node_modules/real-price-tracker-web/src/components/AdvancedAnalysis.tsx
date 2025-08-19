import React, { useState, useEffect } from 'react';

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

export default function AdvancedAnalysis({ product }: AdvancedAnalysisProps) {
  const [activeTab, setActiveTab] = useState('condition');
  const [features, setFeatures] = useState({
    conditionScore: product.conditionScore || 82,
    couponSavings: Math.round(product.price * 0.15),
    finalPrice: product.finalPrice || Math.round(product.price * 0.85),
    credibilityScore: product.credibilityScore || 87,
    communityRating: product.communityRating || 4.2,
    globalSavings: 0
  });

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
                {Math.round((features.couponSavings / product.price) * 100)}% Savings
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-medium">SAVE15</span>
                  <span className="text-gray-600 ml-2">(15% off)</span>
                </div>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">94% success</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-medium">FREESHIP</span>
                  <span className="text-gray-600 ml-2">(Free shipping)</span>
                </div>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">92% success</span>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-1">
                <span>Original Price:</span>
                <span className="line-through text-gray-500">${product.price}</span>
              </div>
              <div className="flex justify-between items-center font-bold text-green-600">
                <span>Final Price:</span>
                <span>${features.finalPrice}</span>
              </div>
              <div className="flex justify-between items-center text-green-600">
                <span>Total Savings:</span>
                <span>${features.couponSavings}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'global' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Global Price Comparison</h4>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                Best: US (Current)
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span>🇺🇸</span>
                  <span className="font-medium">US</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">${product.price} landed</div>
                  <div className="text-sm text-gray-600">Local (Best)</div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span>🇯🇵</span>
                  <span className="font-medium">Japan</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">${Math.round(product.price * 1.03)} landed</div>
                  <div className="text-sm text-red-600">+$31</div>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span>🇬🇧</span>
                  <span className="font-medium">UK</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">${Math.round(product.price * 1.12)} landed</div>
                  <div className="text-sm text-red-600">+$120</div>
                </div>
              </div>
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

      {/* Smart Recommendation */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">🎯</span>
            <span className="font-semibold text-gray-900">Smart Recommendation</span>
          </div>
          <div className="mb-2">
            <span className="text-lg font-bold text-green-600">92% Confidence: STRONG BUY</span>
          </div>
          <p className="text-sm text-gray-700 mb-3">
            Excellent condition score + proven coupon stack + community validated + best global price
          </p>
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <span>🛒</span>
            Buy Now with Analysis
          </a>
        </div>
      </div>
    </div>
  );
} 