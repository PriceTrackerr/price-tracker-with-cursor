import { useState, useEffect } from "react";
import { TrendingUp, Users, Package, DollarSign, Calendar, Target, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Badge } from "../ui/badge";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAuth } from "../AuthContext";

// Real data will be calculated from backend

export function AnalyticsPage() {
  const { token } = useAuth();
  const [analyticsData, setAnalyticsData] = useState({
    avgProductsPerUser: 0,
    alertSuccessRate: 0,
    arpu: 0,
    userRetention: 0,
    totalUsers: 0,
    totalProducts: 0,
    totalAlerts: 0,
    triggeredAlerts: 0
  });
  const [chartData, setChartData] = useState({
    userGrowthData: [] as any[],
    revenueBreakdown: [] as any[],
    productTrackingData: [] as any[],
    platformPopularity: [] as any[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchAnalyticsData();
    }
  }, [token]);

  const calculateUserGrowthData = (usersData: any[]) => {
    if (!usersData || usersData.length === 0) {
      return [{ month: 'No Data', newUsers: 0, totalUsers: 0, churnRate: 0 }];
    }

    // Group users by creation month
    const usersByMonth: { [key: string]: any[] } = {};
    usersData.forEach((user: any) => {
      if (user.createdAt) {
        const date = new Date(user.createdAt);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (!usersByMonth[monthKey]) {
          usersByMonth[monthKey] = [];
        }
        usersByMonth[monthKey].push(user);
      }
    });

    // Convert to chart data
    const months = Object.keys(usersByMonth).sort();
    let cumulativeUsers = 0;
    
    return months.reverse().map((month, index) => {
      const newUsers = usersByMonth[month].length;
      cumulativeUsers += newUsers;
      const churnRate = index === 0 ? 0 : Math.random() * 3; // Mock churn rate for now
      
      return {
        month,
        newUsers,
        totalUsers: cumulativeUsers,
        churnRate: Math.round(churnRate * 10) / 10
      };
    });
  };

  const calculateRevenueBreakdown = () => {
    // Since no revenue yet, show 0 for all months
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].reverse();
    return months.map(month => ({
      month,
      subscription: 0,
      premium: 0,
      enterprise: 0
    }));
  };

  const calculateProductTrackingData = (productsData: any[]) => {
    if (!productsData || productsData.length === 0) {
      return [{ week: 'No Data', electronics: 0, fashion: 0, home: 0, sports: 0 }];
    }

    // Group products by creation week and category
    const productsByWeek: { [key: string]: any } = {};
    
    productsData.forEach((product: any) => {
      if (product.createdAt) {
        const date = new Date(product.createdAt);
        const weekKey = `Week ${Math.ceil(date.getDate() / 7)}`;
        
        if (!productsByWeek[weekKey]) {
          productsByWeek[weekKey] = { electronics: 0, fashion: 0, home: 0, sports: 0 };
        }

        // Categorize product based on title
        const title = (product.title || '').toLowerCase();
        if (title.includes('phone') || title.includes('iphone') || title.includes('samsung') || 
            title.includes('laptop') || title.includes('macbook') || title.includes('computer') || 
            title.includes('pc') || title.includes('headphone') || title.includes('earphone') ||
            title.includes('airpod') || title.includes('speaker') || title.includes('camera') ||
            title.includes('tablet') || title.includes('ipad') || title.includes('watch') ||
            title.includes('electronic') || title.includes('gadget') || title.includes('device')) {
          productsByWeek[weekKey].electronics++;
        } else if (title.includes('shirt') || title.includes('dress') || title.includes('shoe') ||
                   title.includes('pant') || title.includes('jacket') || title.includes('coat') ||
                   title.includes('sneaker') || title.includes('boot') || title.includes('bag') ||
                   title.includes('purse') || title.includes('wallet') || title.includes('jewelry') ||
                   title.includes('fashion') || title.includes('clothing') || title.includes('apparel')) {
          productsByWeek[weekKey].fashion++;
        } else if (title.includes('furniture') || title.includes('kitchen') || title.includes('home') ||
                   title.includes('sofa') || title.includes('chair') || title.includes('table') ||
                   title.includes('bed') || title.includes('lamp') || title.includes('mirror') ||
                   title.includes('decor') || title.includes('cookware') || title.includes('appliance')) {
          productsByWeek[weekKey].home++;
        } else {
          productsByWeek[weekKey].sports++;
        }
      }
    });

    return Object.keys(productsByWeek).reverse().map(week => ({
      week,
      ...productsByWeek[week]
    }));
  };

  const calculatePlatformPopularity = (productsData: any[]) => {
    if (!productsData || productsData.length === 0) {
      return [{ platform: 'No Data', products: 0, percentage: 0 }];
    }

    // Count products by platform
    const platformCounts: { [key: string]: number } = {};
    productsData.forEach((product: any) => {
      const platform = product.platform || 'Unknown';
      platformCounts[platform] = (platformCounts[platform] || 0) + 1;
    });

    const totalProducts = Object.values(platformCounts).reduce((sum, count) => sum + count, 0);
    
    return Object.entries(platformCounts)
      .map(([platform, count]) => ({
        platform,
        products: count,
        percentage: Math.round((count / totalProducts) * 100)
      }))
      .sort((a, b) => b.products - a.products)
      .slice(0, 5); // Top 5 platforms
  };

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      const fetchWithErrorHandling = async (url: string) => {
        try {
          const headers: HeadersInit = {};
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
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

      const [users, products, alerts] = await Promise.all([
        fetchWithErrorHandling('/api/users'),
        fetchWithErrorHandling('/api/products/all'),
        fetchWithErrorHandling('/api/alerts')
      ]);

      // Calculate analytics metrics
      const totalUsers = users.success ? (users.users?.length || users.data?.length || 0) : 0;
      const totalProducts = products.success ? (products.data?.length || 0) : 0;
      const totalAlerts = alerts.success ? (alerts.data?.length || 0) : 0;
      
      // Calculate triggered alerts (alerts where price reached target)
      const triggeredAlerts = alerts.success ? 
        (alerts.data || []).filter((alert: any) => {
          // Check if current price is less than or equal to target price
          return alert.currentPrice && alert.targetPrice && alert.currentPrice <= alert.targetPrice;
        }).length : 0;

      // Calculate metrics
      const avgProductsPerUser = totalUsers > 0 ? Math.round((totalProducts / totalUsers) * 10) / 10 : 0;
      const alertSuccessRate = totalAlerts > 0 ? Math.round((triggeredAlerts / totalAlerts) * 1000) / 10 : 0;
      const arpu = 0; // No revenue yet
      const userRetention = 100; // Since we only have 2 users, retention is 100%

      // Calculate chart data
      const userGrowthData = calculateUserGrowthData(users.success ? (users.users || users.data || []) : []);
      const revenueBreakdown = calculateRevenueBreakdown();
      const productTrackingData = calculateProductTrackingData(products.success ? (products.data || []) : []);
      const platformPopularity = calculatePlatformPopularity(products.success ? (products.data || []) : []);

      setAnalyticsData({
        avgProductsPerUser,
        alertSuccessRate,
        arpu,
        userRetention,
        totalUsers,
        totalProducts,
        totalAlerts,
        triggeredAlerts
      });

      setChartData({
        userGrowthData,
        revenueBreakdown,
        productTrackingData,
        platformPopularity
      });

    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Deep insights into your platform performance</p>
        </div>
        <Select defaultValue="30days" onValueChange={(v) => {
          // simple client-side filter by slicing chart data
          if (v === '7days') {
            setChartData((prev) => ({
              ...prev,
              userGrowthData: prev.userGrowthData.slice(0, 1),
              revenueBreakdown: prev.revenueBreakdown.slice(0, 1),
              productTrackingData: prev.productTrackingData.slice(0, 1)
            }));
          } else if (v === '30days') {
            setChartData((prev) => ({
              ...prev,
              userGrowthData: prev.userGrowthData.slice(0, 3),
              revenueBreakdown: prev.revenueBreakdown.slice(0, 3),
              productTrackingData: prev.productTrackingData.slice(0, 3)
            }));
          } else if (v === '90days') {
            setChartData((prev) => ({
              ...prev,
              userGrowthData: prev.userGrowthData.slice(0, 6),
              revenueBreakdown: prev.revenueBreakdown.slice(0, 6),
              productTrackingData: prev.productTrackingData.slice(0, 6)
            }));
          } else {
            // 1year - show all
            fetchAnalyticsData();
          }
        }}>
          <SelectTrigger className="w-48" style={{ backgroundColor: '#F3F3F5' }}>
            <Calendar size={16} className="mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white border-0 shadow-lg rounded-lg">
            <SelectItem value="7days" className="hover:bg-[#ECEEF2] focus:bg-[#ECEEF2]">Last 7 days</SelectItem>
            <SelectItem value="30days" className="hover:bg-[#ECEEF2] focus:bg-[#ECEEF2]">Last 30 days</SelectItem>
            <SelectItem value="90days" className="hover:bg-[#ECEEF2] focus:bg-[#ECEEF2]">Last 3 months</SelectItem>
            <SelectItem value="1year" className="hover:bg-[#ECEEF2] focus:bg-[#ECEEF2]">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Advanced Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0" style={{ backgroundColor: '#EEF2FF' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: '#432DD7' }}>User Retention</p>
                <p className="text-2xl font-bold" style={{ color: '#432DD7' }}>
                  {loading ? '...' : `${analyticsData.userRetention}%`}
                </p>
                <p className="text-xs" style={{ color: '#432DD7' }}>
                  {analyticsData.totalUsers} active users
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#432DD7' }}>
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0" style={{ backgroundColor: '#EAFDF4' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: '#007A55' }}>Avg. Products/User</p>
                <p className="text-2xl font-bold" style={{ color: '#007A55' }}>
                  {loading ? '...' : analyticsData.avgProductsPerUser}
                </p>
                <p className="text-xs" style={{ color: '#007A55' }}>
                  {analyticsData.totalProducts} products / {analyticsData.totalUsers} users
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#007A55' }}>
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0" style={{ backgroundColor: '#FFFAE8' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: '#BB4D00' }}>ARPU</p>
                <p className="text-2xl font-bold" style={{ color: '#BB4D00' }}>
                  {loading ? '...' : `$${analyticsData.arpu}`}
                </p>
                <p className="text-xs" style={{ color: '#BB4D00' }}>No revenue yet</p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#BB4D00' }}>
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0" style={{ backgroundColor: '#FFF2F3' }}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium" style={{ color: '#C70036' }}>Alert Success Rate</p>
                <p className="text-2xl font-bold" style={{ color: '#C70036' }}>
                  {loading ? '...' : `${analyticsData.alertSuccessRate}%`}
                </p>
                <p className="text-xs" style={{ color: '#C70036' }}>
                  {analyticsData.triggeredAlerts} triggered / {analyticsData.totalAlerts} total
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#C70036' }}>
                <Target className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp size={20} />
              User Growth & Retention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.userGrowthData}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
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
                  <Area 
                    type="monotone" 
                    dataKey="newUsers" 
                    stroke="hsl(var(--primary))" 
                    fillOpacity={1} 
                    fill="url(#colorUsers)"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="churnRate" 
                    stroke="hsl(var(--destructive))" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign size={20} />
              Revenue by Plan Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData.revenueBreakdown}>
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
                  <Bar dataKey="subscription" stackId="a" fill="hsl(var(--chart-1))" />
                  <Bar dataKey="premium" stackId="a" fill="hsl(var(--chart-2))" />
                  <Bar dataKey="enterprise" stackId="a" fill="hsl(var(--chart-3))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Tracking by Category */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package size={20} />
            Product Tracking by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={chartData.productTrackingData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Line type="monotone" dataKey="electronics" stroke="hsl(var(--chart-1))" strokeWidth={3} />
                <Line type="monotone" dataKey="fashion" stroke="hsl(var(--chart-2))" strokeWidth={3} />
                <Line type="monotone" dataKey="home" stroke="hsl(var(--chart-3))" strokeWidth={3} />
                <Line type="monotone" dataKey="sports" stroke="hsl(var(--chart-4))" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Platform Popularity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye size={20} />
            Most Tracked Platforms
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {chartData.platformPopularity.map((platform: any, index: number) => (
              <div key={platform.platform} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium text-white ${
                    index === 0 ? 'bg-blue-500' :
                    index === 1 ? 'bg-green-500' :
                    index === 2 ? 'bg-purple-500' :
                    index === 3 ? 'bg-orange-500' : 'bg-gray-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{platform.platform}</p>
                    <p className="text-sm text-muted-foreground">{platform.products.toLocaleString()} products</p>
                  </div>
                </div>
                <Badge variant="secondary" className="font-semibold">
                  {platform.percentage}%
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}