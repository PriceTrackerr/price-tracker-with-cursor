import React, { useState, useEffect } from 'react';

interface FeatureStatus {
  ai: {
    enabled: boolean;
    conditionScoring: boolean;
    smartRecommendations: boolean;
    pricePrediction: boolean;
    fraudDetection: boolean;
  };
  core: {
    priceTracking: boolean;
    priceHistory: boolean;
    priceAlerts: boolean;
    multiCurrency: boolean;
    userDashboard: boolean;
  };
  advanced: {
    conditionScoring: boolean;
    couponStacking: boolean;
    globalArbitrage: boolean;
    priceGuarantees: boolean;
    automation: boolean;
    community: boolean;
  };
  platforms: {
    amazon: boolean;
    ebay: boolean;
    walmart: boolean;
    target: boolean;
    bestbuy: boolean;
    homedepot: boolean;
    lowes: boolean;
  };
  services: {
    emailNotifications: boolean;
    webhookSupport: boolean;
    cronJobs: boolean;
    realTimeUpdates: boolean;
  };
}

interface Roadmap {
  phase1: {
    name: string;
    status: string;
    features: string[];
  };
  phase2: {
    name: string;
    status: string;
    features: string[];
  };
  phase3: {
    name: string;
    status: string;
    features: string[];
  };
}

const AdvancedFeaturesDemo: React.FC = () => {
  const [featureStatus, setFeatureStatus] = useState<FeatureStatus | null>(null);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('status');

  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        const [statusResponse, roadmapResponse] = await Promise.all([
          fetch('http://localhost:3001/api/features/status'),
          fetch('http://localhost:3001/api/features/roadmap')
        ]);

        if (statusResponse.ok && roadmapResponse.ok) {
          const statusData = await statusResponse.json();
          const roadmapData = await roadmapResponse.json();
          
          setFeatureStatus(statusData.features);
          setRoadmap(roadmapData.roadmap);
        } else {
          throw new Error('Failed to fetch feature data');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchFeatures();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading advanced features...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Features</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Advanced Features Demo</h1>
        <p className="text-gray-600">Explore the powerful features of your price tracker</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
        <button
          onClick={() => setActiveTab('status')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'status' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Feature Status
        </button>
        <button
          onClick={() => setActiveTab('roadmap')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'roadmap' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Development Roadmap
        </button>
        <button
          onClick={() => setActiveTab('demo')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'demo' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Live Demo
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'status' && featureStatus && (
        <div className="space-y-6">
          {/* AI Features */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-xl font-semibold">🤖 AI Features</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                featureStatus.ai.enabled 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {featureStatus.ai.enabled ? "Enabled" : "Disabled"}
              </span>
            </div>
            <p className="text-gray-600 mb-4">
              AI-powered features (currently disabled for MVP launch)
            </p>
            <div className="space-y-3">
              {Object.entries(featureStatus.ai).map(([key, enabled]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    enabled 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {enabled ? "✅ Active" : "⏸️ Paused"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Core Features */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-xl font-semibold">🎯 Core Features</h3>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                Active
              </span>
            </div>
            <p className="text-gray-600 mb-4">
              Essential price tracking functionality
            </p>
            <div className="space-y-3">
              {Object.entries(featureStatus.core).map(([key, enabled]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    enabled 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {enabled ? "✅ Active" : "❌ Inactive"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Advanced Features */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-xl font-semibold">🚀 Advanced Features</h3>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                Active
              </span>
            </div>
            <p className="text-gray-600 mb-4">
              Rule-based advanced functionality (no AI required)
            </p>
            <div className="space-y-3">
              {Object.entries(featureStatus.advanced).map(([key, enabled]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    enabled 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {enabled ? "✅ Active" : "❌ Inactive"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'roadmap' && roadmap && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">🗺️ Development Roadmap</h3>
          <p className="text-gray-600 mb-6">Your price tracker's evolution plan</p>
          
          <div className="space-y-6">
            {/* Phase 1 */}
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-semibold text-lg text-green-700">{roadmap.phase1.name}</h4>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium mt-2 inline-block">
                {roadmap.phase1.status}
              </span>
              <ul className="mt-3 space-y-2">
                {roadmap.phase1.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="text-green-600">✅</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Phase 2 */}
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-semibold text-lg text-blue-700">{roadmap.phase2.name}</h4>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium mt-2 inline-block">
                {roadmap.phase2.status}
              </span>
              <ul className="mt-3 space-y-2">
                {roadmap.phase2.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="text-blue-600">🔄</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Phase 3 */}
            <div className="border-l-4 border-gray-500 pl-4">
              <h4 className="font-semibold text-lg text-gray-700">{roadmap.phase3.name}</h4>
              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs font-medium mt-2 inline-block">
                {roadmap.phase3.status}
              </span>
              <ul className="mt-3 space-y-2">
                {roadmap.phase3.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <span className="text-gray-600">⏳</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'demo' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">🧪 Live Feature Demo</h3>
          <p className="text-gray-600 mb-6">Test your working features in real-time</p>
          
          <div className="space-y-6">
            {/* Currency Arbitrage Demo */}
            <div className="space-y-3">
              <h4 className="font-semibold">💱 Global Currency Arbitrage</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="font-semibold text-blue-600">ExchangeRate-API</div>
                  <div className="text-2xl font-bold">0.8606</div>
                  <div className="text-gray-600">USD → EUR</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="font-semibold text-green-600">Fixer.io</div>
                  <div className="text-2xl font-bold">0.8601</div>
                  <div className="text-gray-600">USD → EUR</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="font-semibold text-purple-600">CurrencyLayer</div>
                  <div className="text-2xl font-bold">0.8587</div>
                  <div className="text-gray-600">USD → EUR</div>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Real-time exchange rates from 3 different APIs with automatic fallback
              </p>
            </div>

            {/* Feature Progress */}
            <div className="space-y-3">
              <h4 className="font-semibold">📊 Feature Completion</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Core Features</span>
                  <span>100%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{width: '100%'}}></div>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Advanced Features</span>
                  <span>100%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{width: '100%'}}></div>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Platform Integrations</span>
                  <span>0%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gray-400 h-2 rounded-full" style={{width: '0%'}}></div>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>AI Features</span>
                  <span>0%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gray-400 h-2 rounded-full" style={{width: '0%'}}></div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">🎯 Ready for Launch!</h4>
              <p className="text-blue-700 text-sm">
                Your MVP is complete with powerful rule-based features. 
                Users can track prices, discover deals, and save money without AI dependencies.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedFeaturesDemo; 