import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface User {
  id: string;
  email: string;
  username?: string;
  notificationSettings?: {
    priceDrops: boolean;
    newProducts: boolean;
    weeklySummary: boolean;
  };
  privacySettings?: {
    shareData: boolean;
    analytics: boolean;
  };
  preferences?: {
    currency: string;
    language: string;
  };
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  reconnecting: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  getAuthHeaders: () => { Authorization: string } | {};
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  reconnecting: false,
  login: async () => false,
  signup: async () => false,
  logout: () => {},
  getAuthHeaders: () => ({}),
});

// Reconnecting Indicator Component
export function ReconnectingIndicator({ reconnecting }: { reconnecting: boolean }) {
  if (!reconnecting) return null;
  
  return (
    <div className="fixed top-4 right-4 z-50 bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
      <Wifi className="w-4 h-4 animate-pulse" />
      <span className="text-sm font-medium">Reconnecting...</span>
    </div>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reconnecting, setReconnecting] = useState(false);

  const fetchUser = useCallback(async (t: string, retryCount = 0) => {
    // Set reconnecting state if this is a retry
    if (retryCount > 0) {
      setReconnecting(true);
    }
    
    try {
      const res = await fetch('https://price-tracker-with-cursor-web-app-s.vercel.app/api/users/me', {
        headers: { Authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      if (data.success) {
        const userData = {
          id: data.user.id,
          email: data.user.email,
          username: data.user.username,
          notificationSettings: data.user.notificationSettings,
          privacySettings: data.user.privacySettings,
          preferences: data.user.preferences,
        };
        setUser(userData);
        // Save user data to localStorage for persistence
        localStorage.setItem('user', JSON.stringify(userData));
        setReconnecting(false); // Clear reconnecting state on success
        setLoading(false); // Ensure loading is set to false
        return userData; // Return user data for persistence
      } else {
        // Only clear token if it's an authentication error (401), not server errors
        if (res.status === 401) {
          console.log('Token is invalid, clearing auth state');
          setUser(null);
          setToken(null);
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          setReconnecting(false);
          setLoading(false); // Ensure loading is set to false
        } else {
          console.log('Server error, keeping token for retry');
          // Keep the user logged in even on server errors
          // Only retry if we don't have user data yet
          if (!user && retryCount < 5) {
            const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s, 8s, 16s
            setTimeout(() => fetchUser(t, retryCount + 1), delay);
          } else {
            setReconnecting(false); // Clear reconnecting state after max retries
            setLoading(false); // Ensure loading is set to false after max retries
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      // Don't clear token on network errors - server might be restarting
      // Only retry if we don't have user data yet
      if (!user && retryCount < 5) {
        const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s, 8s, 16s
        setTimeout(() => fetchUser(t, retryCount + 1), delay);
      } else {
        setReconnecting(false); // Clear reconnecting state after max retries
        setLoading(false); // Ensure loading is set to false after max retries
      }
      console.log('Network error, keeping token for retry');
    }
    return null; // Return null on failure
  }, [user]);

  useEffect(() => {
    const t = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refreshToken');
    if (t) {
      setToken(t);

      // Sync token to extension if available
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ authToken: t });
      }

      // Only fetch user if we don't already have user data
      if (!user) {
        // Add a small delay before fetching user to allow server to start
        const timer = setTimeout(() => {
          fetchUser(t);
        }, 1000);

        // Add a timeout to prevent infinite loading (10 seconds)
        const timeoutTimer = setTimeout(() => {
          console.log('Auth timeout - setting loading to false');
          setLoading(false);
          setReconnecting(false);
        }, 10000);

        return () => {
          clearTimeout(timer);
          clearTimeout(timeoutTimer);
        };
      } else {
        setLoading(false);
      }
    } else {
      // Try refresh flow if we have a refresh token but no access token
      if (refreshToken) {
        (async () => {
          try {
            const resp = await fetch('https://price-tracker-with-cursor-web-app-s.vercel.app/api/users/refresh', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken })
            });
            const json = await resp.json();
            if (json?.success && json.data?.token) {
              localStorage.setItem('token', json.data.token);
              sessionStorage.setItem('token', json.data.token);
              setToken(json.data.token);
              fetchUser(json.data.token);
            } else {
              setLoading(false);
            }
          } catch (_) {
            setLoading(false);
          }
        })();
      } else {
        setLoading(false);
      }
    }

    // Default return for when no cleanup is needed
    return () => {};
  }, [fetchUser, user]);

  // Add a backup mechanism to restore token from sessionStorage if localStorage fails
  useEffect(() => {
    const backupToken = sessionStorage.getItem('token');
    if (!token && backupToken) {
      console.log('Restoring token from sessionStorage');
      setToken(backupToken);
      localStorage.setItem('token', backupToken);
      
      // Sync token to extension if available
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ authToken: backupToken });
      }
      
      // Only fetch user if we don't already have user data
      if (!user) {
        fetchUser(backupToken);
      }
    }
  }, [token, fetchUser, user]);

  // Add a mechanism to restore user session from localStorage if available
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!user && savedUser && token) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setLoading(false); // Ensure loading is set to false when restoring from localStorage
        console.log('Restored user session from localStorage');
      } catch (error) {
        console.log('Failed to restore user session from localStorage');
        setLoading(false); // Ensure loading is set to false even on error
      }
    }
  }, [user, token]);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch('https://price-tracker-with-cursor-web-app-s.vercel.app/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        setToken(data.data.token);
        localStorage.setItem('token', data.data.token);
        sessionStorage.setItem('token', data.data.token); // Backup storage
        if (data.data.refreshToken) {
          localStorage.setItem('refreshToken', data.data.refreshToken);
        }
        
        // Sync token to extension if available
        await syncTokenToExtension(data.data.token);
        // Also sync refresh token if available
        if (data.data.refreshToken) {
          try {
            if (typeof chrome !== 'undefined' && chrome.runtime) {
              await chrome.runtime.sendMessage({
                type: 'SYNC_REFRESH_TOKEN',
                refreshToken: data.data.refreshToken
              });
            }
          } catch {}
        }
        
        const userData = await fetchUser(data.data.token);
        if (userData) {
          // Save user data to localStorage for persistence
          localStorage.setItem('user', JSON.stringify(userData));
        }
        setLoading(false);
        return true;
      }
      setLoading(false);
      return false;
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
      return false;
    }
  };

  const signup = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch('https://price-tracker-with-cursor-web-app-s.vercel.app/api/users/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        setToken(data.data.token);
        localStorage.setItem('token', data.data.token);
        sessionStorage.setItem('token', data.data.token); // Backup storage
        if (data.data.refreshToken) {
          localStorage.setItem('refreshToken', data.data.refreshToken);
        }
        
        // Sync token to extension if available
        await syncTokenToExtension(data.data.token);
        if (data.data.refreshToken) {
          try {
            if (typeof chrome !== 'undefined' && chrome.runtime) {
              await chrome.runtime.sendMessage({
                type: 'SYNC_REFRESH_TOKEN',
                refreshToken: data.data.refreshToken
              });
            }
          } catch {}
        }
        
        const userData = await fetchUser(data.data.token);
        if (userData) {
          // Save user data to localStorage for persistence
          localStorage.setItem('user', JSON.stringify(userData));
        }
        setLoading(false);
        return true;
      }
      setLoading(false);
      return false;
    } catch (error) {
      console.error('Signup error:', error);
      setLoading(false);
      return false;
    }
  };

  // Function to sync token to extension
  const syncTokenToExtension = async (token: string) => {
    try {
      // Try to sync with extension if available
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ authToken: token });
        console.log('Token synced to extension');
      }
      
      // Also try to send a message to the extension if it's listening
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        try {
          await chrome.runtime.sendMessage({
            type: 'SYNC_TOKEN',
            token: token
          });
          console.log('Token sync message sent to extension');
        } catch (error) {
          // Extension might not be listening, which is fine
          console.log('Extension not listening for token sync');
        }
      }
    } catch (error) {
      console.log('Could not sync token to extension:', error);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user'); // Clear user data too
    sessionStorage.removeItem('token'); // Clear backup storage too
    
    // Notify extension about logout
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      try {
        chrome.runtime.sendMessage({
          type: 'LOGOUT'
        });
        console.log('Logout notification sent to extension');
      } catch (error) {
        console.log('Extension not listening for logout notification');
      }
    }
    
    // Remove token from extension if available
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.remove('authToken');
    }
  };

  const getAuthHeaders = () => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Remove periodic token validation to prevent unexpected logouts
  // Token will only be validated on initial load and when explicitly needed
  // useEffect(() => {
  //   if (token) {
  //     // Validate token every 10 minutes instead of 5 minutes
  //     const interval = setInterval(() => {
  //       fetchUser(token);
  //     }, 10 * 60 * 1000);
  //     
  //     return () => clearInterval(interval);
  //   }
  //   // Return empty cleanup function when no token
  //   return () => {};
  // }, [token, fetchUser]);

  // Debug function to check authentication state
  const debugAuthState = () => {
    console.log('=== Auth Debug Info ===');
    console.log('Token in state:', token ? 'Present' : 'Missing');
    console.log('Token in localStorage:', localStorage.getItem('token') ? 'Present' : 'Missing');
    console.log('Token in sessionStorage:', sessionStorage.getItem('token') ? 'Present' : 'Missing');
    console.log('User in state:', user ? user.email : 'Missing');
    console.log('User in localStorage:', localStorage.getItem('user') ? 'Present' : 'Missing');
    console.log('Loading:', loading);
    console.log('Reconnecting:', reconnecting);
    console.log('========================');
  };

  // Add debug function to window for testing
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).debugAuth = debugAuthState;
    }
  }, [token, user, loading, reconnecting]);

  return (
    <AuthContext.Provider value={{ user, token, loading, reconnecting, login, signup, logout, getAuthHeaders }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 