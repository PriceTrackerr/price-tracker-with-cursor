import React, { useState, useEffect } from 'react';
import { 
  User, 
  Bell, 
  Shield, 
  Download,
  Globe,
  Mail,
  Sun,
  Moon
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../components/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const [settings, setSettings] = useState({
    email: 'user@example.com',
    notifications: {
      priceDrops: true,
      newProducts: false,
      weeklySummary: true,
    },
    privacy: {
      shareData: false,
      analytics: true,
    },
    preferences: {
      currency: 'USD',
      language: 'en',
      timezone: 'UTC',
    },
  });

  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');

  // Change Password Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Notification toggles state
  const [notificationSettings, setNotificationSettings] = useState({
    priceDrops: true,
    newProducts: true,
    weeklySummary: true,
  });

  // Privacy toggles state
  const [privacySettings, setPrivacySettings] = useState({
    shareData: false,
    analytics: true,
  });

  // Preferences state
  const [preferences, setPreferences] = useState({
    currency: 'USD',
    language: 'en',
  });

  const selectedLanguage = user?.preferences?.language || 'en';

  // Sync all user preferences on load
  useEffect(() => {
    if (user) {
      if (user.notificationSettings) setNotificationSettings(user.notificationSettings);
      if (user.privacySettings) setPrivacySettings(user.privacySettings);
      if (user.preferences) setPreferences(user.preferences);
    }
  }, [user]);

  useEffect(() => {
    if (i18n.language !== selectedLanguage) {
      i18n.changeLanguage(selectedLanguage);
    }
  }, [selectedLanguage, i18n]);

  // Update notification settings in backend
  const updateNotificationSetting = async (key: keyof typeof notificationSettings, value: boolean) => {
    const newSettings = { ...notificationSettings, [key]: value };
    setNotificationSettings(newSettings);
    try {
      const res = await fetch('/api/users/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...((user && localStorage.getItem('token')) ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {}),
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

  // Update privacy settings in backend
  const updatePrivacySetting = async (key: keyof typeof privacySettings, value: boolean) => {
    const newSettings = { ...privacySettings, [key]: value };
    setPrivacySettings(newSettings);
    try {
      const res = await fetch('/api/users/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...((user && localStorage.getItem('token')) ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {}),
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

  // Update preferences in backend
  const updatePreference = async (key: keyof typeof preferences, value: string) => {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    try {
      const res = await fetch('/api/users/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...((user && localStorage.getItem('token')) ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {}),
        },
        body: JSON.stringify({ preferences: newPrefs }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Preference updated');
      } else {
        toast.error(data.message || 'Failed to update preference');
      }
    } catch (err) {
      toast.error('Failed to update preference');
    }
  };

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#2A3440';
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '';
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  const handleSettingChange = (category: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...(typeof (prev as any)[category] === 'object' && (prev as any)[category] !== null ? (prev as any)[category] : {}),
        [key]: value,
      },
    }));
    toast.success('Setting updated');
  };

  const exportData = () => {
    // Mock export functionality
    const data = {
      products: [],
      alerts: [],
      settings: settings,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'price-tracker-data.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported successfully');
  };

  const handleDarkModeToggle = () => {
    setDarkMode((prev) => {
      const newMode = !prev;
      if (newMode) {
        document.documentElement.classList.add('dark');
        document.body.style.backgroundColor = '#2A3440';
        localStorage.setItem('darkMode', 'true');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.style.backgroundColor = '';
        localStorage.setItem('darkMode', 'false');
      }
      return newMode;
    });
  };

  const handleAccountClick = () => navigate('/settings');
  const handleLogoutClick = () => logout();

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    setPasswordLoading(true);
    try {
      const res = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...((user && localStorage.getItem('token')) ? { Authorization: `Bearer ${localStorage.getItem('token')}` } : {}),
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setPasswordSuccess('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordModal(false);
      } else {
        setPasswordError(data.message || 'Failed to change password');
      }
    } catch (err) {
      setPasswordError('Failed to change password');
    }
    setPasswordLoading(false);
  };

  return (
    <div className="space-y-6 px-2 sm:px-4 md:px-8 max-w-3xl mx-auto">
      {/* Headline only, remove dark mode toggle */}
      <div className="flex flex-col items-center pt-6 pb-2 relative">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight text-center mt-2">{t('settings')}</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Account Settings */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <User className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">{t('account')}</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('userName')}</label>
              <div className="mt-1 mb-2 text-base font-semibold text-gray-900">{user?.username || '—'}</div>
              <label className="block text-sm font-medium text-gray-700">{t('email')}</label>
              <div className="mt-1 mb-2 text-base text-gray-800">{user?.email || '—'}</div>
            </div>
            <button
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              onClick={() => setShowPasswordModal(true)}>
              {t('changePassword')}
            </button>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Bell className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">{t('notifications')}</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{t('priceDropAlerts')}</p>
                <p className="text-sm text-gray-500">{t('getNotifiedPriceDrops')}</p>
              </div>
              <button
                onClick={() => updateNotificationSetting('priceDrops', !notificationSettings.priceDrops)}
                className={`relative inline-flex h-6 w-11 items-center toggle-modern ${notificationSettings.priceDrops ? 'active' : ''}`}
                style={{ minWidth: 44, minHeight: 24 }}
                aria-checked={notificationSettings.priceDrops}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${notificationSettings.priceDrops ? 'translate-x-6' : 'translate-x-1'} flex items-center justify-center`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{t('newProductAlerts')}</p>
                <p className="text-sm text-gray-500">{t('getNotifiedNewProducts')}</p>
              </div>
              <button
                onClick={() => updateNotificationSetting('newProducts', !notificationSettings.newProducts)}
                className={`relative inline-flex h-6 w-11 items-center toggle-modern ${notificationSettings.newProducts ? 'active' : ''}`}
                style={{ minWidth: 44, minHeight: 24 }}
                aria-checked={notificationSettings.newProducts}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${notificationSettings.newProducts ? 'translate-x-6' : 'translate-x-1'} flex items-center justify-center`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{t('weeklySummary')}</p>
                <p className="text-sm text-gray-500">{t('receiveWeeklySummary')}</p>
              </div>
              <button
                onClick={() => updateNotificationSetting('weeklySummary', !notificationSettings.weeklySummary)}
                className={`relative inline-flex h-6 w-11 items-center toggle-modern ${notificationSettings.weeklySummary ? 'active' : ''}`}
                style={{ minWidth: 44, minHeight: 24 }}
                aria-checked={notificationSettings.weeklySummary}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${notificationSettings.weeklySummary ? 'translate-x-6' : 'translate-x-1'} flex items-center justify-center`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Privacy Settings */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Shield className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">{t('privacy')}</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{t('shareUsageData')}</p>
                <p className="text-sm text-gray-500">{t('helpImprove')}</p>
              </div>
              <button
                onClick={() => updatePrivacySetting('shareData', !privacySettings.shareData)}
                className={`relative inline-flex h-6 w-11 items-center toggle-modern ${privacySettings.shareData ? 'active' : ''}`}
                style={{ minWidth: 44, minHeight: 24 }}
                aria-checked={privacySettings.shareData}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${privacySettings.shareData ? 'translate-x-6' : 'translate-x-1'} flex items-center justify-center`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{t('analytics')}</p>
                <p className="text-sm text-gray-500">{t('allowAnalytics')}</p>
              </div>
              <button
                onClick={() => updatePrivacySetting('analytics', !privacySettings.analytics)}
                className={`relative inline-flex h-6 w-11 items-center toggle-modern ${privacySettings.analytics ? 'active' : ''}`}
                style={{ minWidth: 44, minHeight: 24 }}
                aria-checked={privacySettings.analytics}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${privacySettings.analytics ? 'translate-x-6' : 'translate-x-1'} flex items-center justify-center`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Globe className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">{t('preferences')}</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('currency')}</label>
              <select
                value={preferences.currency}
                onChange={(e) => updatePreference('currency', e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="JPY">JPY (¥)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('language')}</label>
              <select
                value={preferences.language}
                onChange={(e) => updatePreference('language', e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>
            {/* Dark Mode Toggle */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm font-medium text-gray-900">{t('darkMode')}</span>
              <button
                className={`relative inline-flex h-6 w-11 items-center toggle-modern ${darkMode ? 'active' : ''}`}
                aria-checked={darkMode}
                onClick={handleDarkModeToggle}
                style={{ minWidth: 44, minHeight: 24 }}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${darkMode ? 'translate-x-6' : 'translate-x-1'} flex items-center justify-center`}
                >
                  {darkMode ? (
                    <Moon className="w-4 h-4 text-gray-500" />
                  ) : (
                    <Sun className="w-4 h-4 text-yellow-400" />
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Data Export */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <Download className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">{t('dataExport')}</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          {t('dataExportDesc')}
        </p>
        <button
          onClick={exportData}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <Download className="h-4 w-4 mr-2" />
          {t('exportData')}
        </button>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-sm relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-600" onClick={() => setShowPasswordModal(false)}>&times;</button>
            <h2 className="text-xl font-bold mb-4 text-center text-gray-900">{t('changePassword')}</h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <input
                type="password"
                className="input-field"
                placeholder={t('Current Password')}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
              />
              <input
                type="password"
                className="input-field"
                placeholder={t('New Password')}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
              <input
                type="password"
                className="input-field"
                placeholder={t('Confirm New Password')}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
              />
              {passwordError && <div className="text-red-600 text-sm">{passwordError}</div>}
              {passwordSuccess && <div className="text-green-600 text-sm">{passwordSuccess}</div>}
              <button
                type="submit"
                className="btn-primary w-full"
                disabled={passwordLoading}
              >
                {passwordLoading ? t('Changing...') : t('changePassword')}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 