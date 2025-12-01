import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { User, Bell, Shield, Globe, Moon, Sun, Download, Trash2, Lock, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../components/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../components/ThemeContext';
import { useTranslation } from 'react-i18next';
export default function Settings() {
    const { t, i18n } = useTranslation();
    const { user, logout, token } = useAuth();
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
            if (user.notificationSettings)
                setNotificationSettings(user.notificationSettings);
            if (user.privacySettings)
                setPrivacySettings(user.privacySettings);
            if (user.preferences)
                setPreferences(user.preferences);
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
    const updateNotificationSetting = async (key, value) => {
        const newSettings = { ...notificationSettings, [key]: value };
        setNotificationSettings(newSettings);
        try {
            if (!token) {
                toast.error('Not authenticated');
                return;
            }
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
            }
            else {
                toast.error(data.message || 'Failed to update preference');
            }
        }
        catch (err) {
            toast.error('Failed to update preference');
        }
    };
    const updatePrivacySetting = async (key, value) => {
        const newSettings = { ...privacySettings, [key]: value };
        setPrivacySettings(newSettings);
        try {
            if (!token) {
                toast.error('Not authenticated');
                return;
            }
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
            }
            else {
                toast.error(data.message || 'Failed to update privacy preference');
            }
        }
        catch (err) {
            toast.error('Failed to update privacy preference');
        }
    };
    const updatePreference = async (key, value) => {
        const newPrefs = { ...preferences, [key]: value };
        setPreferences(newPrefs);
        try {
            if (!token) {
                toast.error('Not authenticated');
                return;
            }
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
            }
            else {
                toast.error(data.message || 'Failed to update preference');
            }
        }
        catch (err) {
            toast.error('Failed to update preference');
        }
    };
    const handleChangePassword = async (e) => {
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
            }
            else {
                toast.error(data.message || 'Failed to change password');
            }
        }
        catch (err) {
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
            if (!token) {
                toast.error('Not authenticated');
                setShowDeleteModal(false);
                return;
            }
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
            }
            else {
                toast.error(data.message || 'Failed to delete account');
            }
        }
        catch (err) {
            toast.error('Failed to delete account');
        }
        setShowDeleteModal(false);
    };
    // Toggle component
    const Toggle = ({ checked, onChange }) => (_jsx("button", { onClick: onChange, className: `relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-indigo-600' : 'bg-slate-300'}`, children: _jsx("span", { className: `inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}` }) }));
    return (_jsxs("div", { className: "min-h-screen bg-slate-50 dark:bg-gray-900", children: [_jsxs("div", { className: "fixed inset-0 overflow-hidden pointer-events-none z-0", children: [_jsx("div", { className: "absolute top-0 left-1/4 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[120px]" }), _jsx("div", { className: "absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-[100px]" })] }), _jsxs("div", { className: "relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12", children: [_jsxs("div", { className: "mb-12", children: [_jsx("h1", { className: "text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-2", children: "Settings" }), _jsx("p", { className: "text-slate-600 dark:text-slate-400", children: "Manage your account and preferences" })] }), _jsxs("div", { className: "space-y-8", children: [_jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-slate-200/60 dark:border-gray-700 overflow-hidden", children: [_jsx("div", { className: "px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-indigo-50/50 to-violet-50/50", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center", children: _jsx(User, { className: "w-5 h-5 text-indigo-600" }) }), _jsxs("div", { children: [_jsx("h2", { className: "text-xl font-bold text-slate-900 dark:text-white", children: "Account" }), _jsx("p", { className: "text-sm text-slate-600 dark:text-slate-400", children: "Manage your account information" })] })] }) }), _jsxs("div", { className: "p-8 space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block", children: "Username" }), _jsx("div", { className: "text-lg font-semibold text-slate-900 dark:text-white", children: user?.username || '—' })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block", children: "Email" }), _jsx("div", { className: "text-lg text-slate-900 dark:text-white", children: user?.email || '—' })] })] }), _jsx("div", { className: "pt-4", children: _jsxs("button", { onClick: () => setShowPasswordModal(true), className: "px-6 py-3 bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 text-slate-900 dark:text-white rounded-xl font-medium transition-colors flex items-center gap-2", children: [_jsx(Lock, { className: "w-4 h-4" }), "Change Password"] }) })] })] }), _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-slate-200/60 dark:border-gray-700 overflow-hidden", children: [_jsx("div", { className: "px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-blue-50/50 to-indigo-50/50", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center", children: _jsx(Bell, { className: "w-5 h-5 text-blue-600" }) }), _jsxs("div", { children: [_jsx("h2", { className: "text-xl font-bold text-slate-900 dark:text-white", children: "Notifications" }), _jsx("p", { className: "text-sm text-slate-600 dark:text-slate-400", children: "Choose what you want to be notified about" })] })] }) }), _jsxs("div", { className: "p-8 space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between py-4 border-b border-slate-100", children: [_jsxs("div", { children: [_jsx("div", { className: "font-medium text-slate-900 dark:text-white mb-1", children: "Price Drop Alerts" }), _jsx("div", { className: "text-sm text-slate-600 dark:text-slate-400", children: "Get notified when prices drop" })] }), _jsx(Toggle, { checked: notificationSettings.priceDrops, onChange: () => updateNotificationSetting('priceDrops', !notificationSettings.priceDrops) })] }), _jsxs("div", { className: "flex items-center justify-between py-4 border-b border-slate-100", children: [_jsxs("div", { children: [_jsx("div", { className: "font-medium text-slate-900 mb-1", children: "New Product Alerts" }), _jsx("div", { className: "text-sm text-slate-600", children: "Get notified about new tracked products" })] }), _jsx(Toggle, { checked: notificationSettings.newProducts, onChange: () => updateNotificationSetting('newProducts', !notificationSettings.newProducts) })] }), _jsxs("div", { className: "flex items-center justify-between py-4", children: [_jsxs("div", { children: [_jsx("div", { className: "font-medium text-slate-900 mb-1", children: "Weekly Summary" }), _jsx("div", { className: "text-sm text-slate-600", children: "Receive a weekly summary email" })] }), _jsx(Toggle, { checked: notificationSettings.weeklySummary, onChange: () => updateNotificationSetting('weeklySummary', !notificationSettings.weeklySummary) })] })] })] }), _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-slate-200/60 dark:border-gray-700 overflow-hidden", children: [_jsx("div", { className: "px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-green-50/50 to-emerald-50/50", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center", children: _jsx(Shield, { className: "w-5 h-5 text-green-600" }) }), _jsxs("div", { children: [_jsx("h2", { className: "text-xl font-bold text-slate-900 dark:text-white", children: "Privacy & Security" }), _jsx("p", { className: "text-sm text-slate-600 dark:text-slate-400", children: "Control your data and privacy" })] })] }) }), _jsxs("div", { className: "p-8 space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between py-4 border-b border-slate-100 dark:border-gray-700", children: [_jsxs("div", { children: [_jsx("div", { className: "font-medium text-slate-900 dark:text-white mb-1", children: "Share Usage Data" }), _jsx("div", { className: "text-sm text-slate-600 dark:text-slate-400", children: "Help us improve our service" })] }), _jsx(Toggle, { checked: privacySettings.shareData, onChange: () => updatePrivacySetting('shareData', !privacySettings.shareData) })] }), _jsxs("div", { className: "flex items-center justify-between py-4", children: [_jsxs("div", { children: [_jsx("div", { className: "font-medium text-slate-900 dark:text-white mb-1", children: "Analytics" }), _jsx("div", { className: "text-sm text-slate-600 dark:text-slate-400", children: "Allow anonymous analytics" })] }), _jsx(Toggle, { checked: privacySettings.analytics, onChange: () => updatePrivacySetting('analytics', !privacySettings.analytics) })] })] })] }), _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-slate-200/60 dark:border-gray-700 overflow-hidden", children: [_jsx("div", { className: "px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-violet-50/50 to-purple-50/50", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center", children: _jsx(Globe, { className: "w-5 h-5 text-violet-600" }) }), _jsxs("div", { children: [_jsx("h2", { className: "text-xl font-bold text-slate-900 dark:text-white", children: "Preferences" }), _jsx("p", { className: "text-sm text-slate-600 dark:text-slate-400", children: "Customize your experience" })] })] }) }), _jsxs("div", { className: "p-8 space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2", children: "Currency" }), _jsxs("select", { value: preferences.currency, onChange: (e) => updatePreference('currency', e.target.value), className: "w-full px-4 py-3 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500", children: [_jsx("option", { value: "USD", children: "USD ($)" }), _jsx("option", { value: "EUR", children: "EUR (\u20AC)" }), _jsx("option", { value: "GBP", children: "GBP (\u00A3)" }), _jsx("option", { value: "JPY", children: "JPY (\u00A5)" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2", children: "Language" }), _jsxs("select", { value: preferences.language, onChange: (e) => updatePreference('language', e.target.value), className: "w-full px-4 py-3 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500", children: [_jsx("option", { value: "en", children: "English" }), _jsx("option", { value: "es", children: "Spanish" }), _jsx("option", { value: "fr", children: "French" }), _jsx("option", { value: "de", children: "German" })] })] })] }), _jsxs("div", { className: "flex items-center justify-between py-4", children: [_jsxs("div", { children: [_jsx("div", { className: "font-medium text-slate-900 dark:text-white mb-1", children: "Dark Mode" }), _jsx("div", { className: "text-sm text-slate-600 dark:text-slate-400", children: "Toggle dark mode theme" })] }), _jsx("button", { className: `relative inline-flex h-6 w-11 items-center toggle-modern ${darkMode ? 'active' : ''}`, "aria-checked": darkMode, onClick: toggleDarkMode, style: { minWidth: 44, minHeight: 24 }, children: _jsx("span", { className: `inline-block h-4 w-4 transform rounded-full bg-white transition ${darkMode ? 'translate-x-6' : 'translate-x-1'} flex items-center justify-center`, children: darkMode ? (_jsx(Moon, { className: "w-3 h-3 text-slate-900" })) : (_jsx(Sun, { className: "w-3 h-3 text-yellow-500" })) }) })] })] })] }), _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-slate-200/60 dark:border-gray-700 overflow-hidden", children: [_jsx("div", { className: "px-8 py-6 border-b border-slate-100 bg-gradient-to-r from-slate-50/50 to-zinc-50/50", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center", children: _jsx(Download, { className: "w-5 h-5 text-slate-600" }) }), _jsxs("div", { children: [_jsx("h2", { className: "text-xl font-bold text-slate-900 dark:text-white", children: "Data Management" }), _jsx("p", { className: "text-sm text-slate-600 dark:text-slate-400", children: "Export or delete your data" })] })] }) }), _jsxs("div", { className: "p-8 space-y-6", children: [_jsxs("div", { children: [_jsxs("button", { onClick: exportData, className: "px-6 py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl font-medium transition-colors flex items-center gap-2", children: [_jsx(Download, { className: "w-4 h-4" }), "Export Data"] }), _jsx("p", { className: "text-sm text-slate-600 dark:text-slate-400 mb-4", children: "Download all your tracked products and price history" })] }), _jsxs("div", { className: "pt-6 border-t border-slate-100", children: [_jsxs("button", { onClick: () => setShowDeleteModal(true), className: "px-6 py-3 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white rounded-xl font-medium transition-colors flex items-center gap-2", children: [_jsx(Trash2, { className: "w-4 h-4" }), "Delete Account"] }), _jsx("p", { className: "text-sm text-slate-600 dark:text-slate-400 mb-4", children: "Permanently delete your account and all associated data" })] })] })] })] })] }), showPasswordModal && (_jsx("div", { className: "fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4", children: _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden", children: [_jsxs("div", { className: "px-6 py-5 border-b border-slate-100 dark:border-gray-700 flex items-center justify-between bg-slate-50 dark:bg-gray-700/50", children: [_jsx("h3", { className: "text-xl font-bold text-slate-900 dark:text-white", children: "Change Password" }), _jsx("button", { onClick: () => setShowPasswordModal(false), className: "text-slate-400 hover:text-slate-600 dark:text-gray-400 dark:hover:text-gray-200", children: _jsx(X, { className: "w-6 h-6" }) })] }), _jsxs("form", { onSubmit: handleChangePassword, className: "p-6 space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2", children: "Current Password" }), _jsx("input", { type: "password", value: currentPassword, onChange: e => setCurrentPassword(e.target.value), className: "w-full px-4 py-3 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2", children: "New Password" }), _jsx("input", { type: "password", value: newPassword, onChange: e => setNewPassword(e.target.value), className: "w-full px-4 py-3 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2", children: "Confirm New Password" }), _jsx("input", { type: "password", value: confirmPassword, onChange: e => setConfirmPassword(e.target.value), className: "w-full px-4 py-3 bg-slate-50 dark:bg-gray-700 border border-slate-200 dark:border-gray-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500", required: true })] }), _jsxs("div", { className: "flex gap-3 pt-4", children: [_jsx("button", { type: "button", onClick: () => setShowPasswordModal(false), className: "flex-1 px-4 py-3 bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 text-slate-900 dark:text-white rounded-xl font-medium transition-colors", children: "Cancel" }), _jsx("button", { type: "submit", disabled: passwordLoading, className: "flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50", children: passwordLoading ? 'Changing...' : 'Change Password' })] })] })] }) })), showDeleteModal && (_jsx("div", { className: "fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4", children: _jsxs("div", { className: "bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden", children: [_jsxs("div", { className: "px-6 py-5 border-b border-slate-100 dark:border-gray-700 flex items-center justify-between bg-rose-50 dark:bg-red-900/20", children: [_jsx("h3", { className: "text-xl font-bold text-rose-900 dark:text-red-400", children: "Delete Account" }), _jsx("button", { onClick: () => setShowDeleteModal(false), className: "text-rose-400 hover:text-rose-600 dark:text-red-400 dark:hover:text-red-300", children: _jsx(X, { className: "w-6 h-6" }) })] }), _jsxs("div", { className: "p-6", children: [_jsx("p", { className: "text-slate-700 dark:text-slate-300 mb-6", children: "Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted." }), _jsxs("div", { className: "flex gap-3", children: [_jsx("button", { onClick: () => setShowDeleteModal(false), className: "flex-1 px-4 py-3 bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 text-slate-900 dark:text-white rounded-xl font-medium transition-colors", children: "Cancel" }), _jsx("button", { onClick: handleDeleteAccount, className: "flex-1 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium transition-colors", children: "Delete Account" })] })] })] }) }))] }));
}
//# sourceMappingURL=Settings.js.map