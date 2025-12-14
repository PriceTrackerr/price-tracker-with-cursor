import React, { ReactNode, useState, useCallback, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Package,
  Bell,
  Settings,
  TrendingDown,
  Menu,
  X,
  User as UserIcon,
  Sun,
  Moon,
  LogOut,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Home,
  History,
  CreditCard
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { useTheme } from './ThemeContext';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

interface LayoutProps {
  children: ReactNode;
}

const navigation = [
  { id: 'dashboard', labelKey: 'dashboard', icon: Home, href: '/dashboard' },
  { id: 'products', labelKey: 'products', icon: Package, href: '/products' },
  { id: 'history', labelKey: 'priceHistory', icon: History, href: '/history' },
  { id: 'alerts', labelKey: 'alerts', icon: Bell, href: '/alerts' },
  { id: 'subscription', labelKey: 'subscription', icon: CreditCard, href: '/subscription' },
  { id: 'settings', labelKey: 'settings', icon: Settings, href: '/settings' },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout, token } = useAuth();

  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [priceDropNotifiedIds, setPriceDropNotifiedIds] = useState<string[]>([]);
  const [notifPopupOpen, setNotifPopupOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const notifPopupRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Fetch notifications only when token is available
  useEffect(() => {
    if (token) {
      fetchNotifications();
    }
  }, [token]);

  // Fetch search suggestions
  useEffect(() => {
    if (searchTerm.length >= 2) {
      const timeoutId = setTimeout(() => {
        fetchSearchSuggestions();
      }, 300); // Debounce search
      return () => clearTimeout(timeoutId);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }
  }, [searchTerm]);

  const fetchSearchSuggestions = async () => {
    try {
      const response = await fetch(`/api/products/search?q=${encodeURIComponent(searchTerm)}&limit=5`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setSearchSuggestions(data.data.results);
        setShowSuggestions(true);
      } else {
        setSearchSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Error fetching search suggestions:', error);
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      console.log('Fetching notifications...');
      console.log('Token for notifications:', token ? 'Present' : 'Missing');

      const res = await fetch('/api/notifications', {
        headers: { ...((token) ? { Authorization: `Bearer ${token}` } : {}) },
      });
      const data = await res.json();
      console.log('Notifications response:', data);
      console.log('Notifications data:', data.data);
      if (data.success) {
        setNotifications(data.data);
        console.log(`Loaded ${data.data.length} notifications`);
      } else {
        console.error('Notifications API failed:', data);
      }
    } catch (e) {
      console.error('Error fetching notifications:', e);
    }
  };

  // Listen for price drop highlights in the URL and show notification
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const highlightParam = params.get('highlight');
    if (window.location.pathname === '/history' && highlightParam) {
      const ids = highlightParam.split(',');
      // Only notify for unseen price drops
      const unseen = ids.filter(id => !priceDropNotifiedIds.includes(id));
      if (unseen.length > 0) {
        setNotifications((prev: any[]) => [
          ...prev,
          ...unseen.map(id => ({
            id: `price-drop-${id}`,
            type: 'price_drop',
            productId: id,
            message: 'Price dropped for a tracked product',
            isRead: false,
            timestamp: new Date().toISOString(),
          }))
        ]);
        setPriceDropNotifiedIds(prev => [...prev, ...unseen]);
      }
    }
  }, [window.location.search, window.location.pathname]);

  // Listen for price drop marked as seen events from other components
  useEffect(() => {
    const handlePriceDropMarkedAsSeen = (event: CustomEvent) => {
      const { productId } = event.detail;
      if (productId) {
        // Mark notification as read locally
        setNotifications(prev =>
          prev.map(n =>
            (n.type === 'price_drop' && n.productId === productId)
              ? { ...n, isRead: true }
              : n
          )
        );

        // Add to notified/seen list so it doesn't reappear
        setPriceDropNotifiedIds(prev => {
          if (!prev.includes(productId)) {
            return [...prev, productId];
          }
          return prev;
        });

        // Also try to fetch fresh notifications to sync with server
        if (token) {
          fetchNotifications();
        }
      }
    };

    window.addEventListener('priceDropMarkedAsSeen', handlePriceDropMarkedAsSeen as EventListener);

    return () => {
      window.removeEventListener('priceDropMarkedAsSeen', handlePriceDropMarkedAsSeen as EventListener);
    };
  }, [token]);

  // Show all unread notifications, not just price drop ones
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Mark notifications as read when popup is opened
  useEffect(() => {
    if (notifPopupOpen && unreadCount > 0) {
      markAllNotificationsRead();
    }
    // Remove price drop notifications and dashboard highlights after seen
    if (window.location.pathname === '/history' && window.location.search.includes('highlight')) {
      // Remove price drop notifications
      setNotifications((prev: any[]) => prev.map(n => n.type === 'price_drop' ? { ...n, isRead: true } : n));
      // Remove price drop from dashboard card by clearing localStorage (if used)
      localStorage.setItem('seenPriceDropIds', JSON.stringify([]));
    }
  }, [notifPopupOpen, unreadCount]);

  const markAllNotificationsRead = async () => {
    try {
      await fetch('/api/notifications/mark-read', {
        method: 'POST',
        headers: { ...((token) ? { Authorization: `Bearer ${token}` } : {}) },
      });
      // Update local state
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (e) { }
  };

  // Add clear notifications handler
  const handleClearNotifications = async () => {
    try {
      // Mark all price drop notifications as seen
      const priceDropNotifications = notifications.filter(n => n.type === 'price_drop');
      for (const notification of priceDropNotifications) {
        if (notification.productId) {
          await fetch('/api/users/mark-price-drop-seen', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ productId: notification.productId })
          });
        }
      }

      // Clear all notifications
      await fetch('/api/notifications/clear', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setNotifications([]);
      setNotifPopupOpen(false);
      toast.success('All notifications cleared');
    } catch (error) {
      console.error('Error clearing notifications:', error);
      toast.error('Failed to clear notifications');
    }
  };

  // Close profile menu on click outside
  React.useEffect(() => {
    if (!profileMenuOpen) return;
    function handleClick(e: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [profileMenuOpen]);

  // Close notification popup on click outside
  React.useEffect(() => {
    if (!notifPopupOpen) return;
    function handleClick(e: MouseEvent) {
      if (notifPopupRef.current && !notifPopupRef.current.contains(e.target as Node)) {
        setNotifPopupOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [notifPopupOpen]);

  // Close search suggestions on click outside
  React.useEffect(() => {
    if (!showSuggestions) return;
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showSuggestions]);

  // Profile menu handlers
  const handleAccountClick = () => {
    console.log('Account button clicked');
    setProfileMenuOpen(false);
    navigate('/settings');
  };
  const handleLogoutClick = useCallback(() => {
    console.log('Logout button clicked');
    setProfileMenuOpen(false);
    setTimeout(() => {
      logout();
      navigate('/');
    }, 0);
  }, [logout, navigate]);

  // Dark mode toggle state from context
  const { darkMode, toggleDarkMode } = useTheme();

  // Local state handling removed - now handled globally by ThemeContext

  const handleDarkModeToggle = () => {
    toggleDarkMode();
  };

  // Helper to get avatar URL
  const getAvatarUrl = (email: string) => {
    // Use DiceBear Avatars API (initials style)
    return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(email)}`;
  };

  // Helper to get user photo URL if available (for Google login in future)
  const getUserPhotoURL = (user: any) => user && (user.photoURL || user.photoUrl);

  // Helper to open profile menu and close notification popup
  const handleProfileMenuToggle = () => {
    console.log('Profile menu button clicked');
    setNotifPopupOpen(false);
    setProfileMenuOpen((v) => !v);
  };
  // Helper to open notification popup and close profile menu
  const handleNotifPopupToggle = () => {
    setProfileMenuOpen(false);
    setNotifPopupOpen((v) => !v);
  };

  // Remove price drop from dashboard card after seen (when visiting /history with highlight)
  useEffect(() => {
    if (window.location.pathname === '/history' && window.location.search.includes('highlight')) {
      setTimeout(() => {
        localStorage.setItem('seenPriceDropIds', JSON.stringify([]));
      }, 1000);
    }
  }, [window.location.pathname, window.location.search]);

  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case "/dashboard":
        return t('dashboard');
      case "/products":
        return t('products');
      case "/history":
        return t('priceHistory');
      case "/alerts":
        return t('alerts');
      case "/settings":
        return t('settings');
      case "/subscription":
        return t('subscription') || 'Subscription';
      default:
        return t('dashboard');
    }
  };

  const getPageDescription = (pathname: string) => {
    switch (pathname) {
      case "/dashboard":
        return t('trackProductsDesc');
      case "/products":
        return t('trackProductsDesc');
      case "/history":
        return t('priceHistoryDesc');
      case "/alerts":
        return t('notificationsDesc');
      case "/settings":
        return t('preferences');
      case "/subscription":
        return t('subscription') || 'Manage your subscription';
      default:
        return t('trackProductsDesc');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
    toast.success('Logged out successfully');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar (Desktop) */}
      <aside className={`fixed left-4 top-4 bottom-4 bg-white dark:bg-gray-900 rounded-2xl border-2 border-slate-300 dark:border-slate-700 shadow-lg transition-all duration-300 z-50 hidden md:flex flex-col ${sidebarCollapsed ? "w-16" : "w-64"}`}>
        {/* Header with Logo */}
        <div className={`${sidebarCollapsed ? 'p-3' : 'p-5'} border-b border-gray-100 dark:border-gray-800`}>
          {!sidebarCollapsed ? (
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-500/20">
                  <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M25 70 C35 50, 65 50, 75 30" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="75" cy="30" r="6" fill="white" />
                  </svg>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">Price Tracker</span>
              </Link>
              <button
                onClick={() => setSidebarCollapsed(true)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Link to="/" className="hover:opacity-80 transition-opacity">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M25 70 C35 50, 65 50, 75 30" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="75" cy="30" r="6" fill="white" />
                  </svg>
                </div>
              </Link>
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                title="Expand sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className={`flex-1 overflow-y-auto ${sidebarCollapsed ? 'p-2' : 'p-4'}`}>
          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;

              return (
                <Link
                  key={item.id}
                  to={item.href}
                  className={`w-full flex items-center rounded-xl transition-all duration-200 ${isActive
                    ? "bg-slate-900 text-white"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                    } ${sidebarCollapsed ? "justify-center h-11 px-2" : "gap-3 h-11 px-4"}`}
                  title={sidebarCollapsed ? t(item.labelKey) : undefined}
                >
                  <Icon className={`${sidebarCollapsed ? "w-5 h-5" : "w-5 h-5"}`} />
                  {!sidebarCollapsed && <span className="font-medium">{t(item.labelKey)}</span>}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Bottom Section - Settings, Logout, User Profile */}
        <div className={`border-t border-gray-100 dark:border-gray-800 ${sidebarCollapsed ? 'p-2' : 'p-4'}`}>
          {/* Settings */}
          <Link
            to="/settings"
            className={`w-full flex items-center rounded-xl transition-all duration-200 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 ${sidebarCollapsed ? "justify-center h-11 px-2 mb-1" : "gap-3 h-11 px-4 mb-1"}`}
            title={sidebarCollapsed ? t('settings') : undefined}
          >
            <Settings className="w-5 h-5" />
            {!sidebarCollapsed && <span className="font-medium">{t('settings')}</span>}
          </Link>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center rounded-xl transition-all duration-200 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 ${sidebarCollapsed ? "justify-center h-11 px-2" : "gap-3 h-11 px-4"}`}
            title={sidebarCollapsed ? t('logout') : undefined}
          >
            <LogOut className="w-5 h-5" />
            {!sidebarCollapsed && <span className="font-medium">{t('logout')}</span>}
          </button>

          {/* User Profile */}
          {!sidebarCollapsed ? (
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <Link to="/subscription" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || user?.email || 'User'}`}
                  alt="User avatar"
                  className="w-10 h-10 rounded-full bg-gray-100"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {user?.username || 'User name'}
                    </p>
                    <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${user?.subscription?.tier === 'pro'
                      ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}>
                      {user?.subscription?.tier === 'pro' ? 'PRO' : 'FREE'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user?.email || 'user@gmail.com'}
                  </p>
                </div>
              </Link>
            </div>
          ) : (
            <div className="mt-2 flex justify-center">
              <Link to="/settings">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || user?.email || 'User'}`}
                  alt="User avatar"
                  className="w-9 h-9 rounded-full bg-gray-100"
                />
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* Sidebar (Mobile Drawer) */}
      {
        mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setMobileMenuOpen(false)} />
            <aside className="relative h-full w-64 bg-white dark:bg-gray-900 shadow-xl">
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M25 70 C35 50, 65 50, 75 30" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="75" cy="30" r="6" fill="white" />
                      </svg>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">Price Tracker</span>
                  </Link>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg" aria-label="Close menu">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <nav className="flex-1 p-4">
                  <div className="space-y-1">
                    {navigation.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.href;
                      return (
                        <Link
                          key={item.id}
                          to={item.href}
                          className={`w-full flex items-center gap-3 h-11 px-4 rounded-xl transition-all duration-200 ${isActive
                            ? "bg-blue-500 text-white"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                            }`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Icon className="w-5 h-5" />
                          <span className="font-medium">{t(item.labelKey)}</span>
                        </Link>
                      );
                    })}
                  </div>
                </nav>
                {/* Bottom Section */}
                <div className="border-t border-gray-100 dark:border-gray-800 p-4">
                  <Link
                    to="/settings"
                    className="w-full flex items-center gap-3 h-11 px-4 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 mb-1"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Settings className="w-5 h-5" />
                    <span className="font-medium">{t('settings')}</span>
                  </Link>
                  <button
                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                    className="w-full flex items-center gap-3 h-11 px-4 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">{t('logout')}</span>
                  </button>
                  {/* User Profile */}
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <Link to="/settings" className="flex items-center gap-3" onClick={() => setMobileMenuOpen(false)}>
                      <img
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || user?.email || 'User'}`}
                        alt="User avatar"
                        className="w-10 h-10 rounded-full bg-gray-100"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {user?.username || 'User name'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {user?.email || 'user@gmail.com'}
                        </p>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )
      }

      {/* Main Content Area */}
      <div className={`transition-all duration-300 min-h-screen ${sidebarCollapsed ? "md:ml-24" : "md:ml-[280px]"
        } ml-0 md:mr-4 flex flex-col gap-4 py-4`}>
        {/* Top Header */}
        <header className="sticky top-4 z-40 bg-white dark:bg-gray-900 rounded-2xl border-2 border-slate-300 dark:border-slate-700 shadow-lg">
          <div className="flex h-16 items-center justify-between px-6">
            {/* Left side - Page title and breadcrumb */}
            <div className="flex items-center space-x-4">
              {/* Mobile menu button */}
              <button
                className="md:hidden p-2 -ml-2 mr-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{getPageTitle(location.pathname)}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">{getPageDescription(location.pathname)}</p>
              </div>
            </div>

            {/* Right side - Search, Notifications, User menu */}
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div ref={searchRef} className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-64 pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400 ${searchTerm.length >= 2 ? 'border-slate-300 bg-blue-50 dark:bg-blue-900/20 dark:border-slate-600' : 'border-gray-200 dark:border-gray-600'
                    }`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (searchTerm.trim()) {
                        navigate('/products', { state: { searchTerm: searchTerm.trim() } });
                        setShowSuggestions(false);
                        setSearchTerm('');
                      }
                    }
                  }}
                  onFocus={() => {
                    if (searchSuggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                />

                {/* Search Suggestions Dropdown */}
                {showSuggestions && searchSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                    <div className="p-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                      Found {searchSuggestions.length} results
                    </div>
                    {searchSuggestions.map((product) => (
                      <button
                        key={product.id}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0 flex items-center gap-3"
                        onClick={() => {
                          navigate('/products', { state: { searchTerm: product.title } });
                          setShowSuggestions(false);
                          setSearchTerm('');
                        }}
                      >
                        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center flex-shrink-0">
                          <Package className="w-4 h-4 text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {product.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {product.platform} • ${product.price}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Search Status Indicator */}
                {searchTerm.length >= 2 && !showSuggestions && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-blue-50 border border-slate-300 rounded-lg p-2 text-xs text-blue-600">
                    Searching for "{searchTerm}"...
                  </div>
                )}
              </div>

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={handleNotifPopupToggle}
                  className="relative p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Bell className="h-5 w-5 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Popup */}
                {notifPopupOpen && (
                  <div ref={notifPopupRef} className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                        {unreadCount > 0 && (
                          <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded-full">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">No notifications</div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${!notification.isRead ? "bg-blue-50/50 dark:bg-blue-900/20" : ""
                              }`}
                            onClick={() => {
                              // Mark notification as read
                              setNotifications(prev =>
                                prev.map(n =>
                                  n.id === notification.id ? { ...n, isRead: true } : n
                                )
                              );

                              // Navigate to price history with the specific product highlighted
                              if (notification.productId) {
                                navigate(`/history?highlight=${notification.productId}&selectedProduct=${notification.productId}`);
                              }

                              // Close the popup
                              setNotifPopupOpen(false);
                            }}
                          >
                            <div className="flex items-start space-x-3">
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 dark:text-white text-sm">
                                  {notification.productTitle || 'Product Update'}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                  {notification.type === 'price_drop'
                                    ? `Price dropped by $${notification.priceDrop?.toFixed(2) || 0}`
                                    : notification.message || 'Price update available'
                                  }
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                                  {new Date(notification.timestamp).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setNotifPopupOpen(false);
                            navigate('/notifications');
                          }}
                          className="flex-1 text-blue-600 hover:text-blue-700 text-sm py-2"
                        >
                          View all notifications
                        </button>
                        {notifications.length > 0 && (
                          <button
                            onClick={handleClearNotifications}
                            className="px-3 py-2 text-red-600 hover:text-red-700 text-sm border border-red-200 hover:bg-red-50 rounded"
                          >
                            Clear all
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* User menu */}
              {user ? (
                <div className="relative">
                  <button
                    onClick={handleProfileMenuToggle}
                    className="flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-white" />
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </button>

                  {/* Profile Menu Popup */}
                  {profileMenuOpen && (
                    <div ref={profileMenuRef} className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex flex-col space-y-1">
                          <p className="font-medium text-gray-900 dark:text-white">{user.username || user.email}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                        </div>
                      </div>
                      <div className="py-2">
                        <button
                          onClick={handleAccountClick}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center text-gray-700 dark:text-gray-200"
                        >
                          <UserIcon className="w-4 h-4 mr-2" />
                          Profile
                        </button>
                        <button
                          onClick={() => navigate('/settings')}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center text-gray-700 dark:text-gray-200"
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          Settings
                        </button>
                      </div>
                      <div className="border-t border-gray-200 dark:border-gray-700 py-2">
                        <button
                          onClick={handleLogoutClick}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center text-red-600 dark:text-red-400"
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex space-x-2">
                  <Link
                    to="/auth"
                    className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/auth"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>


    </div >
  );
} 