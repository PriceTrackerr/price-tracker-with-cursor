import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { User, Bell, Shield, Download, Globe, Sun, Moon } from 'lucide-react';
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
            if (user.notificationSettings)
                setNotificationSettings(user.notificationSettings);
            if (user.privacySettings)
                setPrivacySettings(user.privacySettings);
            if (user.preferences)
                setPreferences(user.preferences);
        }
    }, [user]);
    useEffect(() => {
        if (i18n.language !== selectedLanguage) {
            i18n.changeLanguage(selectedLanguage);
        }
    }, [selectedLanguage, i18n]);
    // Update notification settings in backend
    const updateNotificationSetting = async (key, value) => {
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
            }
            else {
                toast.error(data.message || 'Failed to update preference');
            }
        }
        catch (err) {
            toast.error('Failed to update preference');
        }
    };
    // Update privacy settings in backend
    const updatePrivacySetting = async (key, value) => {
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
            }
            else {
                toast.error(data.message || 'Failed to update privacy preference');
            }
        }
        catch (err) {
            toast.error('Failed to update privacy preference');
        }
    };
    // Update preferences in backend
    const updatePreference = async (key, value) => {
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
            }
            else {
                toast.error(data.message || 'Failed to update preference');
            }
        }
        catch (err) {
            toast.error('Failed to update preference');
        }
    };
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
            document.body.style.backgroundColor = '#2A3440';
            localStorage.setItem('darkMode', 'true');
        }
        else {
            document.documentElement.classList.remove('dark');
            document.body.style.backgroundColor = '';
            localStorage.setItem('darkMode', 'false');
        }
    }, [darkMode]);
    const handleSettingChange = (category, key, value) => {
        setSettings(prev => ({
            ...prev,
            [category]: {
                ...(typeof prev[category] === 'object' && prev[category] !== null ? prev[category] : {}),
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
            }
            else {
                document.documentElement.classList.remove('dark');
                document.body.style.backgroundColor = '';
                localStorage.setItem('darkMode', 'false');
            }
            return newMode;
        });
    };
    const handleAccountClick = () => navigate('/settings');
    const handleLogoutClick = () => logout();
    const handleChangePassword = async (e) => {
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
            }
            else {
                setPasswordError(data.message || 'Failed to change password');
            }
        }
        catch (err) {
            setPasswordError('Failed to change password');
        }
        setPasswordLoading(false);
    };
    return (_jsxs("div", { className: "space-y-6 px-2 sm:px-4 md:px-8 max-w-3xl mx-auto", children: [_jsx("div", { className: "flex flex-col items-center pt-6 pb-2 relative", children: _jsx("h1", { className: "text-3xl font-extrabold text-gray-900 tracking-tight text-center mt-2", children: t('settings') }) }), _jsxs("div", { className: "grid grid-cols-1 gap-6 lg:grid-cols-2", children: [_jsxs("div", { className: "bg-white shadow rounded-lg p-6", children: [_jsxs("div", { className: "flex items-center mb-4", children: [_jsx(User, { className: "h-5 w-5 text-gray-400 mr-2" }), _jsx("h3", { className: "text-lg font-medium text-gray-900", children: t('account') })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: t('userName') }), _jsx("div", { className: "mt-1 mb-2 text-base font-semibold text-gray-900", children: user?.username || '—' }), _jsx("label", { className: "block text-sm font-medium text-gray-700", children: t('email') }), _jsx("div", { className: "mt-1 mb-2 text-base text-gray-800", children: user?.email || '—' })] }), _jsx("button", { className: "w-full px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50", onClick: () => setShowPasswordModal(true), children: t('changePassword') })] })] }), _jsxs("div", { className: "bg-white shadow rounded-lg p-6", children: [_jsxs("div", { className: "flex items-center mb-4", children: [_jsx(Bell, { className: "h-5 w-5 text-gray-400 mr-2" }), _jsx("h3", { className: "text-lg font-medium text-gray-900", children: t('notifications') })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: t('priceDropAlerts') }), _jsx("p", { className: "text-sm text-gray-500", children: t('getNotifiedPriceDrops') })] }), _jsx("button", { onClick: () => updateNotificationSetting('priceDrops', !notificationSettings.priceDrops), className: `relative inline-flex h-6 w-11 items-center toggle-modern ${notificationSettings.priceDrops ? 'active' : ''}`, style: { minWidth: 44, minHeight: 24 }, "aria-checked": notificationSettings.priceDrops, children: _jsx("span", { className: `inline-block h-4 w-4 transform rounded-full bg-white transition ${notificationSettings.priceDrops ? 'translate-x-6' : 'translate-x-1'} flex items-center justify-center` }) })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: t('newProductAlerts') }), _jsx("p", { className: "text-sm text-gray-500", children: t('getNotifiedNewProducts') })] }), _jsx("button", { onClick: () => updateNotificationSetting('newProducts', !notificationSettings.newProducts), className: `relative inline-flex h-6 w-11 items-center toggle-modern ${notificationSettings.newProducts ? 'active' : ''}`, style: { minWidth: 44, minHeight: 24 }, "aria-checked": notificationSettings.newProducts, children: _jsx("span", { className: `inline-block h-4 w-4 transform rounded-full bg-white transition ${notificationSettings.newProducts ? 'translate-x-6' : 'translate-x-1'} flex items-center justify-center` }) })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: t('weeklySummary') }), _jsx("p", { className: "text-sm text-gray-500", children: t('receiveWeeklySummary') })] }), _jsx("button", { onClick: () => updateNotificationSetting('weeklySummary', !notificationSettings.weeklySummary), className: `relative inline-flex h-6 w-11 items-center toggle-modern ${notificationSettings.weeklySummary ? 'active' : ''}`, style: { minWidth: 44, minHeight: 24 }, "aria-checked": notificationSettings.weeklySummary, children: _jsx("span", { className: `inline-block h-4 w-4 transform rounded-full bg-white transition ${notificationSettings.weeklySummary ? 'translate-x-6' : 'translate-x-1'} flex items-center justify-center` }) })] })] })] }), _jsxs("div", { className: "bg-white shadow rounded-lg p-6", children: [_jsxs("div", { className: "flex items-center mb-4", children: [_jsx(Shield, { className: "h-5 w-5 text-gray-400 mr-2" }), _jsx("h3", { className: "text-lg font-medium text-gray-900", children: t('privacy') })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: t('shareUsageData') }), _jsx("p", { className: "text-sm text-gray-500", children: t('helpImprove') })] }), _jsx("button", { onClick: () => updatePrivacySetting('shareData', !privacySettings.shareData), className: `relative inline-flex h-6 w-11 items-center toggle-modern ${privacySettings.shareData ? 'active' : ''}`, style: { minWidth: 44, minHeight: 24 }, "aria-checked": privacySettings.shareData, children: _jsx("span", { className: `inline-block h-4 w-4 transform rounded-full bg-white transition ${privacySettings.shareData ? 'translate-x-6' : 'translate-x-1'} flex items-center justify-center` }) })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-medium text-gray-900", children: t('analytics') }), _jsx("p", { className: "text-sm text-gray-500", children: t('allowAnalytics') })] }), _jsx("button", { onClick: () => updatePrivacySetting('analytics', !privacySettings.analytics), className: `relative inline-flex h-6 w-11 items-center toggle-modern ${privacySettings.analytics ? 'active' : ''}`, style: { minWidth: 44, minHeight: 24 }, "aria-checked": privacySettings.analytics, children: _jsx("span", { className: `inline-block h-4 w-4 transform rounded-full bg-white transition ${privacySettings.analytics ? 'translate-x-6' : 'translate-x-1'} flex items-center justify-center` }) })] })] })] }), _jsxs("div", { className: "bg-white shadow rounded-lg p-6", children: [_jsxs("div", { className: "flex items-center mb-4", children: [_jsx(Globe, { className: "h-5 w-5 text-gray-400 mr-2" }), _jsx("h3", { className: "text-lg font-medium text-gray-900", children: t('preferences') })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: t('currency') }), _jsxs("select", { value: preferences.currency, onChange: (e) => updatePreference('currency', e.target.value), className: "mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md", children: [_jsx("option", { value: "USD", children: "USD ($)" }), _jsx("option", { value: "EUR", children: "EUR (\u20AC)" }), _jsx("option", { value: "GBP", children: "GBP (\u00A3)" }), _jsx("option", { value: "JPY", children: "JPY (\u00A5)" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700", children: t('language') }), _jsxs("select", { value: preferences.language, onChange: (e) => updatePreference('language', e.target.value), className: "mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md", children: [_jsx("option", { value: "en", children: "English" }), _jsx("option", { value: "es", children: "Spanish" }), _jsx("option", { value: "fr", children: "French" }), _jsx("option", { value: "de", children: "German" })] })] }), _jsxs("div", { className: "flex items-center justify-between pt-2", children: [_jsx("span", { className: "text-sm font-medium text-gray-900", children: t('darkMode') }), _jsx("button", { className: `relative inline-flex h-6 w-11 items-center toggle-modern ${darkMode ? 'active' : ''}`, "aria-checked": darkMode, onClick: handleDarkModeToggle, style: { minWidth: 44, minHeight: 24 }, children: _jsx("span", { className: `inline-block h-4 w-4 transform rounded-full bg-white transition ${darkMode ? 'translate-x-6' : 'translate-x-1'} flex items-center justify-center`, children: darkMode ? (_jsx(Moon, { className: "w-4 h-4 text-gray-500" })) : (_jsx(Sun, { className: "w-4 h-4 text-yellow-400" })) }) })] })] })] })] }), _jsxs("div", { className: "bg-white shadow rounded-lg p-6", children: [_jsxs("div", { className: "flex items-center mb-4", children: [_jsx(Download, { className: "h-5 w-5 text-gray-400 mr-2" }), _jsx("h3", { className: "text-lg font-medium text-gray-900", children: t('dataExport') })] }), _jsx("p", { className: "text-sm text-gray-500 mb-4", children: t('dataExportDesc') }), _jsxs("button", { onClick: exportData, className: "inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50", children: [_jsx(Download, { className: "h-4 w-4 mr-2" }), t('exportData')] })] }), showPasswordModal && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-lg shadow-lg p-8 w-full max-w-sm relative", children: [_jsx("button", { className: "absolute top-2 right-2 text-gray-400 hover:text-gray-600", onClick: () => setShowPasswordModal(false), children: "\u00D7" }), _jsx("h2", { className: "text-xl font-bold mb-4 text-center text-gray-900", children: t('changePassword') }), _jsxs("form", { onSubmit: handleChangePassword, className: "space-y-4", children: [_jsx("input", { type: "password", className: "input-field", placeholder: t('Current Password'), value: currentPassword, onChange: e => setCurrentPassword(e.target.value), required: true }), _jsx("input", { type: "password", className: "input-field", placeholder: t('New Password'), value: newPassword, onChange: e => setNewPassword(e.target.value), required: true }), _jsx("input", { type: "password", className: "input-field", placeholder: t('Confirm New Password'), value: confirmPassword, onChange: e => setConfirmPassword(e.target.value), required: true }), passwordError && _jsx("div", { className: "text-red-600 text-sm", children: passwordError }), passwordSuccess && _jsx("div", { className: "text-green-600 text-sm", children: passwordSuccess }), _jsx("button", { type: "submit", className: "btn-primary w-full", disabled: passwordLoading, children: passwordLoading ? t('Changing...') : t('changePassword') })] })] }) }))] }));
}
//# sourceMappingURL=Settings.js.map