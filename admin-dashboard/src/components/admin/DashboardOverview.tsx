import { useState, useEffect } from "react";
import { TrendingUp, Users, Package, DollarSign, Activity, AlertTriangle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Button } from "../ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useAuth } from "../AuthContext";

interface DashboardData {
  totalUsers: number;
  totalProducts: number;
  monthlyRevenue: number;
  totalAlerts: number;
  alertsTriggeredToday: number;
  userGrowth: number;
  productGrowth: number;
  revenueGrowth: number;
  productCategories: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  recentAlerts: Array<{
    id: string;
    product: string;
    user: string;
    target: number;
    current: number;
    status: 'reached' | 'pending';
  }>;
}

export function DashboardOverview() {
  const { token } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalUsers: 0,
    totalProducts: 0,
    monthlyRevenue: 0,
    totalAlerts: 0,
    alertsTriggeredToday: 0,
    userGrowth: 0,
    productGrowth: 0,
    revenueGrowth: 0,
    productCategories: [],
    recentAlerts: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchDashboardData();
    } else {
      console.log('No auth token, using mock data');
      setLoading(false);
    }
  }, [token]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel with error handling
      const fetchWithErrorHandling = async (url: string) => {
        try {
          const headers: HeadersInit = {};
          if (adminToken) {
            headers['Authorization'] = `Bearer ${adminToken}`;
          }
          
          const response = await fetch(url, { headers });
          if (!response.ok) {
            console.warn(`Failed to fetch ${url}: ${response.status}`);
            return { success: false, data: [] };
          }
          return await response.json();
        } catch (error) {
          console.warn(`Error fetching ${url}:`, error);
          return { success: false, data: [] };
        }
      };

      // First, try to login as admin if we don't have a token
      let adminToken = token;
      if (!adminToken) {
        try {
          const loginResponse = await fetch('/api/users/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: 'realpricetracker94@gmail.com',
              password: 'admin123' // You'll need to update this with the correct password
            }),
          });
          
          if (loginResponse.ok) {
            const loginData = await loginResponse.json();
            if (loginData.success && loginData.data?.token) {
              adminToken = loginData.data.token;
              console.log('Admin login successful');
            }
          }
        } catch (error) {
          console.warn('Admin login failed:', error);
        }
      }

      const [users, products, alerts] = await Promise.all([
        fetchWithErrorHandling('/api/users'),
        fetchWithErrorHandling('/api/products/all'),
        fetchWithErrorHandling('/api/alerts')
      ]);

      // Since /api/payments doesn't have a GET endpoint, we'll use mock data
      const payments = { success: true, data: [] };

      // Debug: Log the responses
      console.log('API Responses:', { users, products, alerts, payments });
      console.log('Users data:', users.users || users.data);
      console.log('Products data:', products.data);
      console.log('Alerts data:', alerts.data);

      // Calculate metrics with better error handling
      const totalUsers = users.success ? (users.users?.length || users.data?.length || 0) : 0;
      const totalProducts = products.success ? (products.data?.length || 0) : 0;
      
      // Get total active alerts count
      const getTotalActiveAlerts = (alertsData: any[]) => {
        if (!alertsData) return 0;
        
        // Count all active alerts from all users
        const activeAlerts = alertsData.filter((alert: any) => alert.isActive === true);
        
        return activeAlerts.length;
      };
      
      const totalAlerts = alerts.success ? getTotalActiveAlerts(alerts.data || []) : 0;

      console.log('Total Users:', totalUsers);
      console.log('Total Products:', totalProducts);
      console.log('Total Alerts:', totalAlerts);

      // Calculate product categories for chart
      const getProductCategories = (productsData: any[]) => {
        if (!productsData || productsData.length === 0) {
          return [{ name: 'No Products', value: 100, color: '#e5e7eb' }];
        }

        // Group products by category based on title analysis
        const categoryCounts: { [key: string]: number } = {};
        productsData.forEach((product: any) => {
          const title = (product.title || '').toLowerCase();
          let category = 'Other';

          // Categorize based on keywords in title
          if (title.includes('phone') || title.includes('iphone') || title.includes('samsung') || title.includes('mobile')) {
            category = 'Mobile Phones';
          } else if (title.includes('laptop') || title.includes('macbook') || title.includes('computer') || title.includes('pc')) {
            category = 'Computers';
          } else if (title.includes('headphone') || title.includes('earphone') || title.includes('airpod') || title.includes('speaker')) {
            category = 'Audio';
          } else if (title.includes('shirt') || title.includes('dress') || title.includes('pant') || title.includes('jacket') || title.includes('fashion')) {
            category = 'Fashion';
          } else if (title.includes('book') || title.includes('novel') || title.includes('textbook')) {
            category = 'Books';
          } else if (title.includes('bike') || title.includes('bicycle') || title.includes('electric')) {
            category = 'Transportation';
          } else if (title.includes('kitchen') || title.includes('cook') || title.includes('food')) {
            category = 'Kitchen & Food';
          } else if (title.includes('toy') || title.includes('game') || title.includes('play')) {
            category = 'Toys & Games';
          } else if (title.includes('beauty') || title.includes('cosmetic') || title.includes('makeup')) {
            category = 'Beauty';
          } else if (title.includes('sport') || title.includes('fitness') || title.includes('gym')) {
            category = 'Sports & Fitness';
          } else if (title.includes('home') || title.includes('furniture') || title.includes('decor')) {
            category = 'Home & Garden';
          } else if (title.includes('electronic') || title.includes('gadget') || title.includes('device')) {
            category = 'Electronics';
          }

          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });

        // Convert to chart data
        const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#ff6b6b', '#4ecdc4', '#ff9f43', '#54a0ff', '#5f27cd'];
        const chartData = Object.entries(categoryCounts).map(([category, count], index) => ({
          name: category,
          value: count,
          color: colors[index % colors.length]
        }));

        return chartData;
      };

      const productCategories = getProductCategories(products.data || []);
      
      // Calculate real growth metrics
      const calculateGrowthMetrics = (usersData: any[], productsData: any[]) => {
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        
        // Calculate user growth
        const lastMonthUsers = usersData.filter((user: any) => {
          const userDate = new Date(user.createdAt);
          return userDate < now && userDate >= lastMonth;
        }).length;
        
        const currentMonthUsers = usersData.filter((user: any) => {
          const userDate = new Date(user.createdAt);
          return userDate >= lastMonth;
        }).length;
        
        const userGrowth = lastMonthUsers > 0 ? Math.round(((currentMonthUsers - lastMonthUsers) / lastMonthUsers) * 100) : 0;
        
        // Calculate product growth
        const lastMonthProducts = productsData.filter((product: any) => {
          const productDate = new Date(product.createdAt);
          return productDate < now && productDate >= lastMonth;
        }).length;
        
        const currentMonthProducts = productsData.filter((product: any) => {
          const productDate = new Date(product.createdAt);
          return productDate >= lastMonth;
        }).length;
        
        const productGrowth = lastMonthProducts > 0 ? Math.round(((currentMonthProducts - lastMonthProducts) / lastMonthProducts) * 100) : 0;
        
        return { userGrowth, productGrowth };
      };
      
      const { userGrowth, productGrowth } = calculateGrowthMetrics(users.users || [], products.data || []);
      
      // Calculate monthly revenue from payments (or use mock data)
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyPayments = payments.success ? 
        (payments.data || []).filter((payment: any) => {
          if (!payment.createdAt) return false;
          const paymentDate = new Date(payment.createdAt);
          return paymentDate.getMonth() === currentMonth && 
                 paymentDate.getFullYear() === currentYear &&
                 payment.status === 'completed';
        }) : [];
      
      // Revenue is 0 until monetization starts
      const monthlyRevenue = 0; // No revenue yet - will be calculated when payments are implemented

      // Calculate alerts triggered today
      const today = new Date();
      const todayAlerts = alerts.success ? 
        (alerts.data || []).filter((alert: any) => {
          if (!alert.createdAt) return false;
          const alertDate = new Date(alert.createdAt);
          return alertDate.toDateString() === today.toDateString();
        }) : [];
      
      const alertsTriggeredToday = todayAlerts.length;

      // Get recent alerts (last 5)
      const recentAlerts = alerts.success ? 
        (alerts.data || []).slice(0, 5).map((alert: any) => ({
          id: alert.id || Math.random().toString(),
          product: alert.productName || alert.product || 'Unknown Product',
          user: alert.userEmail || alert.user || 'Unknown User',
          target: alert.targetPrice || alert.target || 0,
          current: alert.currentPrice || alert.current || 0,
          status: (alert.currentPrice || alert.current || 0) <= (alert.targetPrice || alert.target || 0) ? 'reached' : 'pending'
        })) : [];

      // If all APIs failed or backend is not running, use mock data for testing
      const useMockData = !users.success && !products.success && !alerts.success;
      
      if (useMockData) {
        console.log('Using mock data for testing');
        setDashboardData({
          totalUsers: 1250,
          totalProducts: 3420,
          monthlyRevenue: 0,
          totalAlerts: 890,
          alertsTriggeredToday: 45,
          userGrowth: userGrowth,
          productGrowth: productGrowth,
          revenueGrowth: 0,
          productCategories: [
            { name: 'Electronics', value: 45, color: '#8884d8' },
            { name: 'Fashion', value: 25, color: '#82ca9d' },
            { name: 'Home & Garden', value: 15, color: '#ffc658' },
            { name: 'Sports', value: 10, color: '#ff7c7c' },
            { name: 'Books', value: 5, color: '#8dd1e1' }
          ],
          recentAlerts: [
            {
              id: '1',
              product: 'iPhone 15 Pro',
              user: 'john@example.com',
              target: 999,
              current: 950,
              status: 'reached'
            },
            {
              id: '2',
              product: 'MacBook Pro',
              user: 'sarah@example.com',
              target: 2000,
              current: 2100,
              status: 'pending'
            },
            {
              id: '3',
              product: 'AirPods Pro',
              user: 'mike@example.com',
              target: 200,
              current: 180,
              status: 'reached'
            }
          ]
        });
      } else {
        setDashboardData({
          totalUsers,
          totalProducts,
          monthlyRevenue,
          totalAlerts,
          alertsTriggeredToday,
          userGrowth: userGrowth,
          productGrowth: productGrowth,
          revenueGrowth: 0, // No revenue growth since no revenue yet
          productCategories,
          recentAlerts
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="p-6 space-y-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard Overview</h1>
        <Button 
          onClick={fetchDashboardData} 
          disabled={loading}
          variant="outline" 
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Debug Info - Remove this after testing */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <h3 className="text-sm font-semibold text-yellow-800 mb-2">Debug Info:</h3>
        <div className="text-xs text-yellow-700 space-y-1">
          <p>Total Users: {dashboardData.totalUsers}</p>
          <p>Total Products: {dashboardData.totalProducts}</p>
          <p>Total Alerts: {dashboardData.totalAlerts}</p>
          <p>Monthly Revenue: ${dashboardData.monthlyRevenue}</p>
          <p>Alerts Today: {dashboardData.alertsTriggeredToday}</p>
          <p>Recent Alerts Count: {dashboardData.recentAlerts.length}</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0" style={{ backgroundColor: '#EDF4FE' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-semibold" style={{ color: '#1447E6' }}>Total Users</p>
                <p className="text-4xl font-bold" style={{ color: '#1447E6' }}>
                  {loading ? '...' : dashboardData.totalUsers.toLocaleString()}
                </p>
                <p className="text-sm flex items-center gap-1" style={{ color: '#1447E6' }}>
                  <TrendingUp size={14} />
                  +{dashboardData.userGrowth}% from last month
                </p>
              </div>
              <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#1447E6' }}>
                <Users className="w-7 h-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0" style={{ backgroundColor: '#EDFDF2' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-semibold" style={{ color: '#008236' }}>Tracked Products</p>
                <p className="text-4xl font-bold" style={{ color: '#008236' }}>
                  {loading ? '...' : dashboardData.totalProducts.toLocaleString()}
                </p>
                <p className="text-sm flex items-center gap-1" style={{ color: '#008236' }}>
                  <TrendingUp size={14} />
                  +{dashboardData.productGrowth}% from last month
                </p>
              </div>
              <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#008236' }}>
                <Package className="w-7 h-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0" style={{ backgroundColor: '#F9F4FF' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-semibold" style={{ color: '#8200DB' }}>Monthly Revenue</p>
                <p className="text-4xl font-bold" style={{ color: '#8200DB' }}>
                  {loading ? '...' : `$${dashboardData.monthlyRevenue.toLocaleString()}`}
                </p>
                <p className="text-sm flex items-center gap-1" style={{ color: '#8200DB' }}>
                  <TrendingUp size={14} />
                  +{dashboardData.revenueGrowth}% from last month
                </p>
              </div>
              <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#8200DB' }}>
                <DollarSign className="w-7 h-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0" style={{ backgroundColor: '#FFF6EA' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-semibold" style={{ color: '#CA3500' }}>Active Alerts</p>
                <p className="text-4xl font-bold" style={{ color: '#CA3500' }}>
                  {loading ? '...' : dashboardData.totalAlerts.toLocaleString()}
                </p>
                <p className="text-sm flex items-center gap-1" style={{ color: '#CA3500' }}>
                  <Activity size={14} />
                  {dashboardData.alertsTriggeredToday} triggered today
                </p>
              </div>
              <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#CA3500' }}>
                <AlertTriangle className="w-7 h-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp size={20} />
                Revenue & User Growth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package size={20} />
                Product Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 flex items-center justify-center">
                <p className="text-muted-foreground">Loading...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp size={20} />
              Revenue & User Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[
                  { month: 'Jan', revenue: 0, users: 0 },
                  { month: 'Feb', revenue: 0, users: 0 },
                  { month: 'Mar', revenue: 0, users: 0 },
                  { month: 'Apr', revenue: 0, users: 0 },
                  { month: 'May', revenue: 0, users: 0 },
                  { month: 'Jun', revenue: 0, users: dashboardData.totalUsers },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="users" 
                    stroke="hsl(var(--chart-2))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--chart-2))', strokeWidth: 2, r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Product Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package size={20} />
              Product Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dashboardData.productCategories}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }: any) => `${name}: ${value}`}
                  >
                    {dashboardData.productCategories.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      )}

      {/* Recent Alerts & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Alerts */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle size={20} />
              Recent Price Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">Loading alerts...</p>
                </div>
              ) : dashboardData.recentAlerts.length === 0 ? (
                <div className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">No recent alerts</p>
                </div>
              ) : (
                dashboardData.recentAlerts.map((alert: any) => (
                  <div key={alert.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium">{alert.product}</h4>
                      <p className="text-sm text-muted-foreground">{alert.user}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Target: ${alert.target}</span>
                        <Badge variant={alert.status === 'reached' ? 'default' : 'secondary'}>
                          {alert.status === 'reached' ? 'Reached' : 'Pending'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Current: ${alert.current}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity size={20} />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>API Uptime</span>
                <span className="font-medium">99.9%</span>
              </div>
              <Progress value={99.9} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Database Health</span>
                <span className="font-medium">98.5%</span>
              </div>
              <Progress value={98.5} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Price Sync Rate</span>
                <span className="font-medium">96.2%</span>
              </div>
              <Progress value={96.2} className="h-2" />
            </div>

            <div className="pt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Server Load</span>
                <Badge variant="secondary">Normal</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Queue Status</span>
                <Badge variant="default">Healthy</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}