import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Users, Package, DollarSign, Activity } from 'lucide-react';

interface AnalyticsData {
  totalUsers: number;
  totalProducts: number;
  totalRevenue: number;
  activeAlerts: number;
  userGrowth: number;
  productGrowth: number;
  revenueGrowth: number;
  alertGrowth: number;
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData>({
    totalUsers: 0,
    totalProducts: 0,
    totalRevenue: 0,
    activeAlerts: 0,
    userGrowth: 0,
    productGrowth: 0,
    revenueGrowth: 0,
    alertGrowth: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data
    setData({
      totalUsers: 1247,
      totalProducts: 156,
      totalRevenue: 45230,
      activeAlerts: 8,
      userGrowth: 12.5,
      productGrowth: 8.3,
      revenueGrowth: 15.7,
      alertGrowth: -5.2
    });
        setLoading(false);
  }, []);

  const MetricCard = ({ title, value, growth, icon: Icon, color }: {
    title: string;
    value: string | number;
    growth: number;
    icon: React.ComponentType<any>;
    color: string;
  }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
          <div className="flex items-center gap-2">
            {growth > 0 ? (
              <TrendingUp className="w-4 h-4 text-green-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600" />
            )}
            <span className={`text-sm font-medium ${growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {growth > 0 ? '+' : ''}{growth}%
            </span>
            <span className="text-sm text-gray-500">from last month</span>
          </div>
        </div>
        <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600">View detailed analytics and reports</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Users"
          value={data.totalUsers.toLocaleString()}
          growth={data.userGrowth}
          icon={Users}
          color="bg-blue-500"
        />
        <MetricCard
          title="Total Products"
          value={data.totalProducts.toLocaleString()}
          growth={data.productGrowth}
          icon={Package}
          color="bg-green-500"
        />
        <MetricCard
          title="Total Revenue"
          value={`$${data.totalRevenue.toLocaleString()}`}
          growth={data.revenueGrowth}
          icon={DollarSign}
          color="bg-orange-500"
        />
        <MetricCard
          title="Active Alerts"
          value={data.activeAlerts}
          growth={data.alertGrowth}
          icon={Activity}
          color="bg-purple-500"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">User Growth</h3>
              <p className="text-sm text-gray-500">Monthly user registration trends</p>
            </div>
            <BarChart3 className="w-6 h-6 text-blue-600" />
          </div>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Chart placeholder</p>
              <p className="text-sm text-gray-400">Chart component would go here</p>
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Revenue Trends</h3>
              <p className="text-sm text-gray-500">Monthly revenue performance</p>
            </div>
            <TrendingUp className="w-6 h-6 text-green-600" />
          </div>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Chart placeholder</p>
              <p className="text-sm text-gray-400">Chart component would go here</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <p className="text-sm text-gray-500">Latest system activities and events</p>
        </div>
        <div className="divide-y divide-gray-200">
          {[
            { id: 1, action: 'New user registered', user: 'john.doe@example.com', time: '2 minutes ago', type: 'user' },
            { id: 2, action: 'Product price updated', product: 'iPhone 15 Pro', time: '5 minutes ago', type: 'product' },
            { id: 3, action: 'Price alert triggered', product: 'Samsung Galaxy S24', time: '10 minutes ago', type: 'alert' },
            { id: 4, action: 'New product tracked', product: 'MacBook Pro M3', time: '15 minutes ago', type: 'product' },
            { id: 5, action: 'User upgraded to premium', user: 'jane.smith@example.com', time: '1 hour ago', type: 'user' }
          ].map((activity) => (
            <div key={activity.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    activity.type === 'user' ? 'bg-blue-100' :
                    activity.type === 'product' ? 'bg-green-100' :
                    'bg-orange-100'
                  }`}>
                    {activity.type === 'user' && <Users className="w-4 h-4 text-blue-600" />}
                    {activity.type === 'product' && <Package className="w-4 h-4 text-green-600" />}
                    {activity.type === 'alert' && <Activity className="w-4 h-4 text-orange-600" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-sm text-gray-500">
                      {activity.user || activity.product}
                    </p>
                  </div>
                </div>
                <span className="text-sm text-gray-500">{activity.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Platform Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Distribution</h3>
          <div className="space-y-4">
            {[
              { platform: 'Amazon', count: 45, percentage: 28.8 },
              { platform: 'eBay', count: 32, percentage: 20.5 },
              { platform: 'Apple Store', count: 28, percentage: 17.9 },
              { platform: 'Walmart', count: 25, percentage: 16.0 },
              { platform: 'Others', count: 26, percentage: 16.7 }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    index === 0 ? 'bg-blue-500' :
                    index === 1 ? 'bg-green-500' :
                    index === 2 ? 'bg-orange-500' :
                    index === 3 ? 'bg-purple-500' :
                    'bg-gray-500'
                  }`} />
                  <span className="text-sm font-medium text-gray-900">{item.platform}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{item.count}</p>
                  <p className="text-xs text-gray-500">{item.percentage}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products</h3>
          <div className="space-y-4">
            {[
              { name: 'iPhone 15 Pro', platform: 'Amazon', price: 1199 },
              { name: 'Samsung Galaxy S24', platform: 'eBay', price: 1099 },
              { name: 'MacBook Pro M3', platform: 'Apple Store', price: 2499 },
              { name: 'Sony WH-1000XM5', platform: 'Amazon', price: 349 },
              { name: 'iPad Air', platform: 'Apple Store', price: 599 }
            ].map((product, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.platform}</p>
                </div>
                <span className="text-sm font-medium text-gray-900">${product.price}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Average Price</span>
              <span className="text-sm font-medium text-gray-900">$847</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Price Drop Rate</span>
              <span className="text-sm font-medium text-green-600">23%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active Users</span>
              <span className="text-sm font-medium text-gray-900">1,247</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Alerts</span>
              <span className="text-sm font-medium text-gray-900">8</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 