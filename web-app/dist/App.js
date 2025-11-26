import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import History from './pages/History';
import Alerts from './pages/Alerts';
import Settings from './pages/Settings';
import ProductDetails from './pages/ProductDetails';
import Subscription from './pages/Subscription';
import Pricing from './pages/Pricing';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsAndConditions from './pages/TermsAndConditions';
import ResetPassword from './pages/ResetPassword';
import { AuthProvider, useAuth } from './components/AuthContext';
import { ReconnectingIndicator } from './components/AuthContext';
import './i18n';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
function AppContent() {
    const { reconnecting } = useAuth();
    return (_jsx(I18nextProvider, { i18n: i18n, children: _jsx(Router, { children: _jsxs("div", { className: "min-h-screen bg-gray-50", children: [_jsx(ReconnectingIndicator, { reconnecting: reconnecting }), _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Landing, {}) }), _jsx(Route, { path: "/auth", element: _jsx(AuthPage, {}) }), _jsx(Route, { path: "/dashboard", element: _jsx(Layout, { children: _jsx(Dashboard, {}) }) }), _jsx(Route, { path: "/products", element: _jsx(Layout, { children: _jsx(Products, {}) }) }), _jsx(Route, { path: "/history", element: _jsx(Layout, { children: _jsx(History, {}) }) }), _jsx(Route, { path: "/alerts", element: _jsx(Layout, { children: _jsx(Alerts, {}) }) }), _jsx(Route, { path: "/settings", element: _jsx(Layout, { children: _jsx(Settings, {}) }) }), _jsx(Route, { path: "/products/:productId", element: _jsx(Layout, { children: _jsx(ProductDetails, {}) }) }), _jsx(Route, { path: "/subscription", element: _jsx(Layout, { children: _jsx(Subscription, {}) }) }), _jsx(Route, { path: "/pricing", element: _jsx(Layout, { children: _jsx(Pricing, {}) }) }), _jsx(Route, { path: "/privacy-policy", element: _jsx(PrivacyPolicy, {}) }), _jsx(Route, { path: "/terms-and-conditions", element: _jsx(TermsAndConditions, {}) }), _jsx(Route, { path: "/reset-password/*", element: _jsx(ResetPassword, {}) })] }), _jsx(Toaster, { position: "top-right", toastOptions: {
                            duration: 4000,
                            style: {
                                background: '#363636',
                                color: '#fff',
                            },
                        } })] }) }) }));
}
function App() {
    return (_jsx(AuthProvider, { children: _jsx(AppContent, {}) }));
}
export default App;
//# sourceMappingURL=App.js.map