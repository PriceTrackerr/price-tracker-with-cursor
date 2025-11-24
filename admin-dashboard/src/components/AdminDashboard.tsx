import { useState } from "react";
import { 
  LayoutDashboard, 
  BarChart3, 
  Users, 
  Package, 
  CreditCard,
  Target,
  Bell,
  Settings,
  LogOut,
  Menu
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { DashboardOverview } from "./admin/DashboardOverview";
import { AnalyticsPage } from "./admin/AnalyticsPage";
import { UsersPage } from "./admin/UsersPage";
import { ProductsPage } from "./admin/ProductsPage";
import { SubscriptionPage } from "./admin/SubscriptionPage";
import { SettingsPage } from "./admin/SettingsPage";
import { useAuth } from "./AuthContext";
import AdvancedFeaturesPage from "./admin/AdvancedFeaturesPage";

type AdminPage = 'dashboard' | 'analytics' | 'users' | 'products' | 'subscription' | 'settings' | 'advanced';

const sidebarItems = [
  { id: 'dashboard' as AdminPage, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'analytics' as AdminPage, label: 'Analytics', icon: BarChart3 },
  { id: 'users' as AdminPage, label: 'Users', icon: Users },
  { id: 'products' as AdminPage, label: 'Products', icon: Package },
  { id: 'subscription' as AdminPage, label: 'Subscription', icon: CreditCard },
  { id: 'advanced' as AdminPage, label: 'Advanced Features', icon: Target },
];

export function AdminDashboard() {
  const { logout } = useAuth();
  const [currentPage, setCurrentPage] = useState<AdminPage>(() => {
    // Get the current page from URL or localStorage, default to dashboard
    const savedPage = localStorage.getItem('adminCurrentPage') as AdminPage;
    return savedPage && sidebarItems.some(item => item.id === savedPage) ? savedPage : 'dashboard';
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardOverview />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'users':
        return <UsersPage />;
      case 'products':
        return <ProductsPage onNavigateToPage={(page: AdminPage) => setCurrentPage(page)} />;
      case 'subscription':
        return <SubscriptionPage />;
      case 'settings':
        return <SettingsPage />;
      case 'advanced':
        return <AdvancedFeaturesPage />;
      default:
        return <DashboardOverview />;
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b" style={{ borderColor: '#E5E5E5' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#2563EB] rounded-lg flex items-center justify-center shadow-sm">
            <svg width="20" height="20" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="0" y="0" width="100" height="100" rx="20" fill="#2563EB"/>
              <path d="M25 70 C35 50, 65 50, 75 30" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="75" cy="30" r="6" fill="white"/>
            </svg>
          </div>
          <div>
            <h2 className="font-semibold text-sidebar-foreground">Price Tracker</h2>
            <p className="text-xs text-sidebar-foreground/70">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4">
        <nav className="space-y-2">
          {sidebarItems.map((item) => (
            <Button
              key={item.id}
              variant={currentPage === item.id ? "default" : "ghost"}
              className={`w-full justify-start gap-3 h-11 ${
                currentPage === item.id 
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
              onClick={() => {
                setCurrentPage(item.id);
                localStorage.setItem('adminCurrentPage', item.id);
                setSidebarOpen(false);
              }}
            >
              <item.icon size={18} />
              {item.label}
            </Button>
          ))}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-4 border-t space-y-2" style={{ borderColor: '#E5E5E5' }}>
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={() => {
            setCurrentPage('settings');
            localStorage.setItem('adminCurrentPage', 'settings');
            setSidebarOpen(false);
          }}
        >
          <Settings size={18} />
          Settings
        </Button>
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-3 text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={() => {
            logout();
            // Redirect to login page
            window.location.href = '/login';
          }}
        >
          <LogOut size={18} />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 bg-white border-r" style={{ borderColor: '#E5E5E5' }}>
        <SidebarContent />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-background border-b p-4 lg:p-6" style={{ borderColor: '#E5E5E5' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="lg:hidden">
                    <Menu size={20} />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0 bg-white">
                  <SidebarContent />
                </SheetContent>
              </Sheet>
              
              <div>
                <h1 className="text-xl font-semibold text-foreground capitalize">
                  {currentPage}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Manage your price tracking platform
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="relative">
                <Bell size={16} />
                <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  3
                </Badge>
              </Button>
              
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-primary-foreground">A</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}