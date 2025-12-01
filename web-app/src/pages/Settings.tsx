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
import { useTranslation } from 'react-i18next';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // States
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
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

  // Dark mode effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#1e293b';
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '';
      localStorage.setItem('darkMode', 'false');
    }
  }, [darkMode]);

  // API helpers
  const updateNotificationSetting = async (key: keyof typeof notificationSettings, value: boolean) => {
    const newSettings = { ...notificationSettings, [key]: value };
    setNotificationSettings(newSettings);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/users/preferences', {
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
      const token = localStorage.getItem('token');
      const res = await fetch('/api/users/preferences', {
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
      const token = localStorage.getItem('token');
      const res = await fetch('/api/users/preferences', {
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
      const token = localStorage.getItem('token');
      const res = await fetch('/api/users/change-password', {
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

  const exportData = () => {
    const data = { products: [], alerts: [], settings: { preferences, notificationSettings, privacySettings } };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'price-tracker-data.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported successfully');
  };

  const handleDeleteAccount = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/users/delete-account', {
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
    <div className="min-h-screen bg-slate-50">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight mb-2">Settings</h1>
          <p className="text-slate-600">Manage your account and preferences</p>
        </div>

        <div className="space-y-8">
          {/* Account Section */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-indigo-50/50 to-violet-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Account</h2>
                  <p className="text-sm text-slate-600">Manage your account information</p>
                </div>
              </div>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Username</label>
                  <div className="text-lg font-semibold text-slate-900">{user?.username || '—'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Email</label>
                  <div className="text-lg text-slate-900">{user?.email || '—'}</div>
                </div>
              </div>
              <div className="pt-4">
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl font-medium transition-colors flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  Change Password
                </button>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Notifications</h2>
                  <p className="text-sm text-slate-600">Choose what you want to be notified about</p>
                </div>
              </div>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between py-4 border-b border-slate-100">
                <div>
                  <div className="font-medium text-slate-900 mb-1">Price Drop Alerts</div>
                  <div className="text-sm text-slate-600">Get notified when prices drop</div>
                </div>
                <Toggle checked={notificationSettings.priceDrops} onChange={() => updateNotificationSetting('priceDrops', !notificationSettings.priceDrops)} />
              </div>
              <div className="flex items-center justify-between py-4 border-b border-slate-100">
                <div>
                  <div className="font-medium text-slate-900 mb-1">New Product Alerts</div>
                  <div className="text-sm text-slate-600">Get notified about new tracked products</div>
                </div>
                <Toggle checked={notificationSettings.newProducts} onChange={() => updateNotificationSetting('newProducts', !notificationSettings.newProducts)} />
              </div>
              <div className="flex items-center justify-between py-4">
                <div>
                  <div className="font-medium text-slate-900 mb-1">Weekly Summary</div>
                  <div className="text-sm text-slate-600">Receive a weekly summary email</div>
                </div>
                <Toggle checked={notificationSettings.weeklySummary} onChange={() => updateNotificationSetting('weeklySummary', !notificationSettings.weeklySummary)} />
              </div>
            </div>
          </div>

          {/* Privacy Settings */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-green-50/50 to-emerald-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Privacy & Security</h2>
                  <p className="text-sm text-slate-600">Control your data and privacy</p>
                </div>
              </div>
            </div>
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between py-4 border-b border-slate-100">
                <div>
                  <div className="font-medium text-slate-900 mb-1">Share Usage Data</div>
                  <div className="text-sm text-slate-600">Help us improve our service</div>
                </div>
                <Toggle checked={privacySettings.shareData} onChange={() => updatePrivacySetting('shareData', !privacySettings.shareData)} />
              </div>
              <div className="flex items-center justify-between py-4">
                <div>
                  <div className="font-medium text-slate-900 mb-1">Analytics</div>
                  <div className="text-sm text-slate-600">Allow anonymous analytics</div>
                </div>
                <Toggle checked={privacySettings.analytics} onChange={() => updatePrivacySetting('analytics', !privacySettings.analytics)} />
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-violet-50/50 to-purple-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Preferences</h2>
                  <p className="text-sm text-slate-600">Customize your experience</p>
                </div>
              </div>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Currency</label>
                  <select
                    value={preferences.currency}
                    onChange={(e) => updatePreference('currency', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="JPY">JPY (¥)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Language</label>
                  <select
                    value={preferences.language}
                    onChange={(e) => updatePreference('language', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-between py-4 border-t border-slate-100 mt-6">
                <div className="flex items-center gap-3">
                  {darkMode ? <Moon className="w-5 h-5 text-indigo-600" /> : <Sun className="w-5 h-5 text-amber-500" />}
                  <div>
                    <div className="font-medium text-slate-900 mb-1">Dark Mode</div>
                    <div className="text-sm text-slate-600">Enable dark theme across the app</div>
                  </div>
                </div>
                <Toggle checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
              </div>
            </div>
          </div>

          {/* Data Management */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-zinc-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                  <Download className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Data Management</h2>
                  <p className="text-sm text-slate-600">Export or delete your data</p>
                </div>
              </div>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <button
                  onClick={exportData}
                  className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl font-medium transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export Data
                </button>
                <p className="text-sm text-slate-500 mt-2">Download all your tracked products and settings</p>
              </div>
              <div className="pt-6 border-t border-slate-100">
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-6 py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-medium transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Account
                </button>
                <p className="text-sm text-slate-500 mt-2">Permanently delete your account and all data</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-xl font-bold text-slate-900">Change Password</h3>
              <button onClick={() => setShowPasswordModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  {passwordLoading ? 'Changing...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-rose-50">
              <h3 className="text-xl font-bold text-rose-900">Delete Account</h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-rose-400 hover:text-rose-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-slate-700 mb-6">
                Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="flex-1 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium transition-colors"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}