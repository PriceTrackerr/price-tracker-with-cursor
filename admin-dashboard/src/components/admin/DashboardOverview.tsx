import { useEffect, useState } from 'react';
import { apiUrl } from '../../utils/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { useAuth } from '../AuthContext';
import { 
  Users, 
  Package, 
  AlertTriangle, 
  DollarSign,
  Activity,
  BarChart3,
  Calendar
} from 'lucide-react';

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
    productName: string;
    targetPrice: number;
    currentPrice: number;
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
        fetchWithErrorHandling(apiUrl('/api/users')),
        fetchWithErrorHandling(apiUrl('/api/products/all')),
        fetchWithErrorHandling(apiUrl('/api/alerts'))
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

        const platformCounts: { [key: string]: number } = {};
        productsData.forEach((product: any) => {
          const platform = product.platform || 'Unknown';
          platformCounts[platform] = (platformCounts[platform] || 0) + 1;
        });
        
        const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
        let colorIndex = 0;
        
        return Object.entries(platformCounts).map(([platform, count]) => ({
          name: platform,
          value: Math.round((count / productsData.length) * 100),
          color: colors[colorIndex++ % colors.length]
        }));
      };

      // Calculate recent alerts
      const getRecentAlerts = (alertsData: any[]) => {
        if (!alertsData || alertsData.length === 0) {
          return [];
        }
        
        return alertsData
          .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)
          .map((alert: any) => ({
            id: alert.id,
            productName: alert.productName || 'Unknown Product',
            targetPrice: alert.targetPrice || 0,
            currentPrice: alert.currentPrice || 0,
            status: (alert.currentPrice <= alert.targetPrice ? 'reached' : 'pending') as 'reached' | 'pending'
          }));
      };

      // Calculate growth rates (mock data for now)
      const userGrowth = totalUsers > 0 ? Math.round((totalUsers / 10) * 100) : 0;
      const productGrowth = totalProducts > 0 ? Math.round((totalProducts / 20) * 100) : 0;
      const revenueGrowth = 0; // No revenue yet

        setDashboardData({
          totalUsers,
          totalProducts,
        monthlyRevenue: 0, // No revenue yet
          totalAlerts,
        alertsTriggeredToday: Math.floor(Math.random() * 5), // Mock data
        userGrowth,
        productGrowth,
        revenueGrowth,
        productCategories: getProductCategories(products.data || []),
        recentAlerts: getRecentAlerts(alerts.data || [])
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
  return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{dashboardData.userGrowth}%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{dashboardData.productGrowth}%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalAlerts}</div>
            <p className="text-xs text-muted-foreground">
              {dashboardData.alertsTriggeredToday} triggered today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${dashboardData.monthlyRevenue}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{dashboardData.revenueGrowth}%</span> from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Product Distribution by Platform</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="space-y-2">
              {dashboardData.productCategories.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-sm font-medium">{category.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{category.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dashboardData.recentAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{alert.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      Target: ${alert.targetPrice} | Current: ${alert.currentPrice}
                    </p>
                    </div>
                        <Badge variant={alert.status === 'reached' ? 'default' : 'secondary'}>
                          {alert.status === 'reached' ? 'Reached' : 'Pending'}
                        </Badge>
                      </div>
              ))}
              {dashboardData.recentAlerts.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent alerts
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
        <Card>
          <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              <Activity className="mr-2 h-4 w-4" />
              View Analytics
            </Button>
            <Button variant="outline" size="sm">
              <BarChart3 className="mr-2 h-4 w-4" />
              Export Data
            </Button>
            <Button variant="outline" size="sm">
              <Calendar className="mr-2 h-4 w-4" />
              Schedule Report
            </Button>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}