import { useEffect, useState } from 'react';
import { Package, DollarSign, Bell, Users } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<any>;
  trend?: { value: string; isPositive: boolean };
  color: 'blue' | 'green' | 'orange' | 'purple';
}

const MetricCard = ({ title, value, subtitle, icon: Icon, trend, color }: MetricCardProps) => {
  const colorClasses = {
    blue: { bg: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-600', icon: 'text-blue-600' },
    green: { bg: 'bg-green-500', light: 'bg-green-50', text: 'text-green-600', icon: 'text-green-600' },
    orange: { bg: 'bg-orange-500', light: 'bg-orange-50', text: 'text-orange-600', icon: 'text-orange-600' },
    purple: { bg: 'bg-purple-500', light: 'bg-purple-50', text: 'text-purple-600', icon: 'text-purple-600' }
  };

  const colors = colorClasses[color];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mb-2">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.isPositive ? '+' : ''}{trend.value}
              </span>
              <span className="text-sm text-gray-500">from last month</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 ${colors.light} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${colors.icon}`} />
        </div>
      </div>
    </div>
  );
};

interface ProductTableProps {
  products: any[];
}

const ProductTable = ({ products }: ProductTableProps) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Recent Products</h3>
        <p className="text-sm text-gray-500">Latest tracked products and their status</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Platform</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No products tracked yet
                </td>
              </tr>
            ) : (
              products.map((product, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        src={product.image_url || product.imageUrl || 'https://via.placeholder.com/40'}
                        alt={product.title}
                        className="w-10 h-10 rounded-lg object-cover mr-3"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40'; }}
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900 max-w-xs truncate">{product.title}</div>
                        <div className="text-sm text-gray-500">{product.platform}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{product.platform}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${product.price || product.currentPrice || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${product.stock_status === 'in_stock' || product.status === 'active' ? 'bg-green-100 text-green-800' :
                        product.stock_status === 'out_of_stock' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                      }`}>
                      {product.stock_status === 'in_stock' ? 'Active' :
                        product.stock_status === 'out_of_stock' ? 'Out of Stock' :
                          product.status || 'Unknown'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <a
                      href={product.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalUsers: 0,
    totalValue: 0,
    activeAlerts: 0,
    userGrowth: 0,
    productGrowth: 0
  });
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');

      // Fetch analytics data
      const analyticsResponse = await axios.get(`${API_BASE}/users/admin/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (analyticsResponse.data.success) {
        const data = analyticsResponse.data.data;
        setStats({
          totalProducts: data.totalProducts || 0,
          totalUsers: data.totalUsers || 0,
          totalValue: data.avgPrice * data.totalProducts || 0,
          activeAlerts: data.activeAlerts || 0,
          userGrowth: data.userGrowth || 0,
          productGrowth: data.productGrowth || 0
        });
        setProducts(data.recentProducts || []);
      }
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-2">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back!</h1>
        <p className="text-gray-600">Here's what's happening with your tracked products today.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Products"
          value={stats.totalProducts}
          subtitle="Tracked products"
          icon={Package}
          trend={{ value: `${stats.productGrowth}%`, isPositive: stats.productGrowth >= 0 }}
          color="blue"
        />
        <MetricCard
          title="Total Users"
          value={stats.totalUsers}
          subtitle="Registered users"
          icon={Users}
          trend={{ value: `${stats.userGrowth}%`, isPositive: stats.userGrowth >= 0 }}
          color="green"
        />
        <MetricCard
          title="Total Value"
          value={`$${Math.round(stats.totalValue).toLocaleString()}`}
          subtitle="Combined product value"
          icon={DollarSign}
          color="orange"
        />
        <MetricCard
          title="Active Alerts"
          value={stats.activeAlerts}
          subtitle="Price monitoring"
          icon={Bell}
          color="purple"
        />
      </div>

      {/* Recent Products */}
      <ProductTable products={products} />
    </div>
  );
}