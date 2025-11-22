import { useState } from "react";
import { 
  Bell, 
  Search, 
  User, 
  ChevronDown
} from "lucide-react";

interface DashboardHeaderProps {
  activeTab: string;
}

export function DashboardHeader({ activeTab }: DashboardHeaderProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const getPageTitle = (tab: string) => {
    switch (tab) {
      case "dashboard":
        return "Dashboard";
      case "products":
        return "Products";
      case "users":
        return "Users";
      case "analytics":
        return "Analytics";
      case "alerts":
        return "Alerts";
      case "settings":
        return "Settings";
      default:
        return "Dashboard";
    }
  };

  const mockNotifications = [
    {
      id: 1,
      title: "Price Drop Alert",
      message: "Wireless Headphones dropped to $79.99",
      time: "2 minutes ago",
      unread: true
    },
    {
      id: 2,
      title: "Back in Stock",
      message: "Smart Watch is now available on Amazon",
      time: "1 hour ago",
      unread: true
    },
    {
      id: 3,
      title: "Weekly Summary",
      message: "You saved $127 this week across 8 products",
      time: "1 day ago",
      unread: false
    }
  ];

  const unreadCount = mockNotifications.filter(n => n.unread).length;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#E5E5E5] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left side - Page title and breadcrumb */}
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{getPageTitle(activeTab)}</h1>
            <p className="text-sm text-gray-500">
              {activeTab === "dashboard" && "Overview of your tracked products"}
              {activeTab === "products" && "Manage and track all your products"}
              {activeTab === "users" && "Manage user accounts and permissions"}
              {activeTab === "analytics" && "View detailed analytics and reports"}
              {activeTab === "alerts" && "Stay notified about price changes"}
              {activeTab === "settings" && "Manage your account and preferences"}
            </p>
          </div>
        </div>

        {/* Right side - Search, Notifications, User menu */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Search products..."
              className="w-64 pl-10 pr-4 py-2 border border-[#E5E5E5] rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
            />
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
            >
              <Bell className="h-5 w-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
            
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-[#F3F3F5] z-50">
                <div className="p-4 border-b border-[#F3F3F5]">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {mockNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-[#F3F3F5] hover:bg-gray-50 cursor-pointer transition-colors ${
                        notification.unread ? "bg-blue-50/50" : ""
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        {notification.unread && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm">
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {notification.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 border-t border-[#F3F3F5]">
                  <button className="w-full text-blue-600 hover:text-blue-700 text-sm py-2">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative">
            <button className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
} 