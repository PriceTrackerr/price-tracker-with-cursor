import { useState } from "react";
import { cn } from "../utils/cn";
import { 
  Package, 
  Bell, 
  Settings, 
  Menu,
  X,
  TrendingDown,
  Home,
  Users,
  PieChart
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function DashboardSidebar({ activeTab, onTabChange, onCollapsedChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleToggleCollapse = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    onCollapsedChange?.(newCollapsed);
  };

  const navigation = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: PieChart },
    { id: 'alerts', label: 'Alerts', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-full bg-white border-r transition-all duration-300 z-50",
      { borderColor: '#E5E5E5' },
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b" style={{ borderColor: '#E5E5E5' }}>
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl text-gray-900">Admin</span>
              </div>
            )}
            <button
              onClick={handleToggleCollapse}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <button
                  key={item.id}
                  className={cn(
                    "w-full flex items-center gap-3 h-12 px-3 rounded-lg transition-all duration-200 text-left",
                    isActive 
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25" 
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
                    isCollapsed && "justify-center px-2"
                  )}
                  onClick={() => onTabChange(item.id)}
                >
                  <Icon className={cn("w-5 h-5", isCollapsed ? "mx-0" : "mr-0")} />
                  {!isCollapsed && <span className="font-medium">{item.label}</span>}
                </button>
              );
            })}
          </div>
        </nav>

        {/* User Section */}
        {!isCollapsed && (
          <div className="p-4 border-t" style={{ borderColor: '#E5E5E5' }}>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-gray-50 to-blue-50">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">A</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">Admin</p>
                <p className="text-xs text-gray-500 truncate">Administrator</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
} 