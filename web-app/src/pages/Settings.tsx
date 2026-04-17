import React, { useState, useEffect } from 'react';
import {
  User,
  Bell,
  Shield,
  Globe,
  Moon,
  Sun,
  Download,
  Trash2,
  Lock,
  CreditCard,
  Check,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../components/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../components/ThemeContext';
import { useTranslation } from 'react-i18next';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { user, logout, token, updateUser } = useAuth();
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useTheme();

  // States
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    priceDrops: true,
    newProducts: true,
    weeklySummary: true,
  });

  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    shareData: false,
    analytics: true,
  });

  // Preferences
  const [preferences, setPreferences] = useState({
    currency: 'USD',
    language: 'en',
  });

  // Sync user preferences
  useEffect(() => {
    if (user) {
      if (user.notificationSettings) setNotificationSettings(user.notificationSettings);
      if (user.privacySettings) setPrivacySettings(user.privacySettings);
      if (user.preferences) setPreferences(user.preferences);
    }
  }, [user]);

  // Update language
  useEffect(() => {
    const selectedLanguage = user?.preferences?.language || 'en';
    if (i18n.language !== selectedLanguage) {
      i18n.changeLanguage(selectedLanguage);
    }
  }, [user?.preferences?.language, i18n]);

  // Local dark mode effect removed - handled by ThemeContext

  // API helpers
  const updateNotificationSetting = async (key: keyof typeof notificationSettings, value: boolean) => {
    const newSettings = { ...notificationSettings, [key]: value };
    setNotificationSettings(newSettings);
    try {
      if (!token) {
        toast.error('Not authenticated');
        return;
      }
      const res = await fetch(`${API_BASE}/users/preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ notificationSettings: newSettings }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Notification preference updated');
      } else {
        toast.error(data.message || 'Failed to update preference');
      }
    } catch (err) {
      toast.error('Failed to update preference');
    }
  };

  const updatePrivacySetting = async (key: keyof typeof privacySettings, value: boolean) => {
    const newSettings = { ...privacySettings, [key]: value };
    setPrivacySettings(newSettings);
    try {
      if (!token) {
        toast.error('Not authenticated');
        return;
      }
      const res = await fetch(`${API_BASE}/users/preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ privacySettings: newSettings }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Privacy preference updated');
      } else {
        toast.error(data.message || 'Failed to update privacy preference');
      }
    } catch (err) {
      toast.error('Failed to update privacy preference');
    }
  };

  const updatePreference = async (key: keyof typeof preferences, value: string) => {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    try {
      if (!token) {
        toast.error('Not authenticated');
        return;
      }
      const res = await fetch(`${API_BASE}/users/preferences`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ preferences: newPrefs }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Preference updated');
        // Update the user state in AuthContext to persist the change
        updateUser({ preferences: newPrefs });
        // Immediate update for language
        if (key === 'language') {
          i18n.changeLanguage(value);
        }
      } else {
        toast.error(data.message || 'Failed to update preference');
      }
    } catch (err) {
      toast.error('Failed to update preference');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('All fields are required');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    setPasswordLoading(true);
    try {
      if (!token) {
        toast.error('Not authenticated');
        setPasswordLoading(false);
        return;
      }
      const res = await fetch(`${API_BASE}/users/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordModal(false);
      } else {
        toast.error(data.message || 'Failed to change password');
      }
    } catch (err) {
      toast.error('Failed to change password');
    }
    setPasswordLoading(false);
  };

  const exportData = async () => {
    // Check if user has Pro subscription
    if (user?.subscription?.tier !== 'pro') {
      toast.error('Export Data is a Pro feature. Upgrade to export your tracked products.');
      return;
    }

    try {
      toast.loading('Preparing export...', { id: 'export' });

      // Fetch products
      const productsRes = await fetch(`${API_BASE}/products`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const productsData = await productsRes.json();
      const products = productsData.success ? productsData.data : [];

      // Fetch alerts
      const alertsRes = await fetch(`${API_BASE}/alerts`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const alertsData = await alertsRes.json();
      const alerts = alertsData.success ? alertsData.data : [];

      // Create CSV content
      let csvContent = 'Type,Name,Platform,Current Price,Lowest Price,URL,Created Date\n';

      // Add products to CSV
      products.forEach((product: any) => {
        const name = `"${(product.title || product.name || 'Unknown').replace(/"/g, '""')}"`;
        const platform = product.platform || 'Unknown';
        const currentPrice = product.price || product.current_price || 0;
        const lowestPrice = product.lowest_price || currentPrice;
        const url = `"${product.url || ''}"`;
        const createdAt = new Date(product.created_at || product.createdAt).toLocaleDateString();
        csvContent += `Product,${name},${platform},${currentPrice},${lowestPrice},${url},${createdAt}\n`;
      });

      // Add alerts to CSV
      alerts.forEach((alert: any) => {
        const name = `"${(alert.product_name || alert.productName || 'Unknown').replace(/"/g, '""')}"`;
        const targetPrice = alert.target_price || alert.targetPrice || 0;
        csvContent += `Alert,${name},-,Target: ${targetPrice},-,-,-\n`;
      });

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `price-tracker-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(`Exported ${products.length} products and ${alerts.length} alerts`, { id: 'export' });
    } catch (err) {
      toast.error('Failed to export data', { id: 'export' });
    }
  };

  const handleDeleteAccount = async () => {
    try {
      if (!token) {
        toast.error('Not authenticated');
        setShowDeleteModal(false);
        return;
      }
      const res = await fetch(`${API_BASE}/users/delete-account`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Account deleted successfully');
        logout();
        navigate('/');
      } else {
        toast.error(data.message || 'Failed to delete account');
      }
    } catch (err) {
      toast.error('Failed to delete account');
    }
    setShowDeleteModal(false);
  };

  // Toggle component
  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-indigo-600' : 'bg-slate-300'
        }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'
          }`}
      />
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-2">{t('settings')}</h1>
          <p className="text-slate-600 dark:text-slate-400">{t('manageAccountPrefs')}</p>
        </div>

        <div className="space-y-8">
          {/* Account Section */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-slate-200/60 dark:border-gray-700 overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-indigo-50/50 to-violet-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('account')}</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{t('manageAccountInfo')}</p>
                </div>
              </div>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">{t('userName')}</label>
                  <div className="text-lg font-semibold text-slate-900 dark:text-white">{user?.username || '—'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">{t('email')}</label>
                  <div className="text-lg text-slate-900 dark:text-white">{user?.email || '—'}</div>
                </div>
              </div>
              <div className="pt-4">
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="px-6 py-3 bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 text-slate-900 dark:text-white rounded-xl font-medium transition-colors flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  {t('changePassword')}
                </button>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-slate-200/60 dark:border-gray-700 overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('notifications')}</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{t('notificationsDesc')}</p>
                </div>
              </div>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between py-4 border-b border-slate-100">
                <div>
                  <div className="font-medium text-slate-900 dark:text-white mb-1">{t('priceDropAlerts')}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">{t('getNotifiedPriceDrops')}</div>
                </div>
                <Toggle checked={notificationSettings.priceDrops} onChange={() => updateNotificationSetting('priceDrops', !notificationSettings.priceDrops)} />
              </div>
              <div className="flex items-center justify-between py-4 border-b border-slate-100">
                <div>
                  <div className="font-medium text-slate-900 mb-1">{t('newProductAlerts')}</div>
                  <div className="text-sm text-slate-600">{t('getNotifiedNewProducts')}</div>
                </div>
                <Toggle checked={notificationSettings.newProducts} onChange={() => updateNotificationSetting('newProducts', !notificationSettings.newProducts)} />
              </div>
              <div className="flex items-center justify-between py-4">
                <div>
                  <div className="font-medium text-slate-900 mb-1">{t('weeklySummary')}</div>
                  <div className="text-sm text-slate-600">{t('receiveWeeklySummary')}</div>
                </div>
                <Toggle checked={notificationSettings.weeklySummary} onChange={() => updateNotificationSetting('weeklySummary', !notificationSettings.weeklySummary)} />
              </div>
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-slate-200/60 dark:border-gray-700 overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-green-50/50 to-emerald-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('privacySecurity')}</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{t('controlDataPrivacy')}</p>
                </div>
              </div>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-gray-700">
                <div>
                  <div className="font-medium text-slate-900 dark:text-white mb-1">{t('shareUsageData')}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">{t('helpImprove')}</div>
                </div>
                <Toggle checked={privacySettings.shareData} onChange={() => updatePrivacySetting('shareData', !privacySettings.shareData)} />
              </div>
              <div className="flex items-center justify-between py-4">
                <div>
                  <div className="font-medium text-slate-900 dark:text-white mb-1">{t('analytics')}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">{t('allowAnalytics')}</div>
                </div>
                <Toggle checked={privacySettings.analytics} onChange={() => updatePrivacySetting('analytics', !privacySettings.analytics)} />
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-slate-200/60 dark:border-gray-700 overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-violet-50/50 to-purple-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('preferences')}</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{t('customizeExperience')}</p>
                </div>
              </div>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('currency')}</label>
                  <select
                    value={preferences.currency}
                    onChange={(e) => updatePreference('currency', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="JPY">JPY (¥)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('language')}</label>
                  <select
                    value={preferences.language}
                    onChange={(e) => updatePreference('language', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-between py-4">
                <div>
                  <div className="font-medium text-slate-900 dark:text-white mb-1">{t('darkMode')}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">{t('toggleDarkMode')}</div>
                </div>
                <button
                  className={`relative inline-flex h-6 w-11 items-center toggle-modern ${darkMode ? 'active' : ''}`}
                  aria-checked={darkMode}
                  onClick={toggleDarkMode}
                  style={{ minWidth: 44, minHeight: 24 }}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${darkMode ? 'translate-x-6' : 'translate-x-1'} flex items-center justify-center`}
                  >
                    {darkMode ? (
                      <Moon className="w-3 h-3 text-slate-900" />
                    ) : (
                      <Sun className="w-3 h-3 text-yellow-500" />
                    )}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Data Management */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-slate-200/60 dark:border-gray-700 overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-zinc-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  <Download className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('dataManagement')}</h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{t('exportDeleteData')}</p>
                </div>
              </div>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <button
                  onClick={exportData}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  {t('exportData')}
                </button>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{t('downloadAllData')}</p>
              </div>
              <div className="pt-6 border-t border-slate-100">
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-6 py-3 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {t('deleteAccount')}
                </button>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{t('deleteAccountWarning')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-gray-700 flex items-center justify-between bg-slate-50 dark:bg-gray-700/50">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t('changePassword')}</h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-slate-400 hover:text-slate-600 dark:text-gray-400 dark:hover:text-gray-200">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('currentPassword')}</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('newPassword')}</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('confirmNewPassword')}</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 text-slate-900 dark:text-white rounded-xl font-medium transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  {passwordLoading ? t('changing') : t('changePassword')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-gray-700 flex items-center justify-between bg-rose-50 dark:bg-red-900/20">
              <h3 className="text-xl font-bold text-rose-900 dark:text-red-400">{t('deleteAccount')}</h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-rose-400 hover:text-rose-600 dark:text-red-400 dark:hover:text-red-300">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-slate-700 dark:text-slate-300 mb-6">
                {t('deleteConfirmation')}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 text-slate-900 dark:text-white rounded-xl font-medium transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="flex-1 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium transition-colors"
                >
                  {t('confirmDelete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}