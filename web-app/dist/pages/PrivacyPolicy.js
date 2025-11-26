import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from 'react-router-dom';
const sections = [
    {
        title: '1. Introduction',
        content: [
            'This Privacy Policy explains how Price Tracker (“we”, “us”, “our”) collects, uses, stores, and protects your information when you use our website, browser extension, or related services.'
        ]
    },
    {
        title: '2. Information We Collect',
        content: [
            'A. Information You Provide Directly',
            '• Email address (if using accounts)',
            '• Password (securely hashed — we never store plain text)',
            '• Tracked product links',
            'B. Automatically Collected Information',
            '• Device/browser type',
            '• Usage logs (e.g., tracking button clicks)',
            '• Error reports',
            '• Basic analytics',
            'C. Price Tracking Data',
            '• Product URL',
            '• Title, price, image',
            '• Price history',
            '• Notifications sent',
            'We do not collect any sensitive personal information.'
        ]
    },
    {
        title: '3. How We Use Your Information',
        content: [
            'We use your data to:',
            '• Track product prices',
            '• Show price history',
            '• Send alerts regarding price drops or matches',
            '• Improve performance and reliability',
            '• Prevent abuse and fraud',
            '• Provide customer support',
            'We never sell user data.'
        ]
    },
    {
        title: '4. Legal Basis (if needed)',
        content: [
            'We process data based on:',
            '• Your consent',
            '• Our legitimate interest in providing the Service'
        ]
    },
    {
        title: '5. Cookies',
        content: [
            'We may use cookies or local storage for:',
            '• Session management',
            '• Analytics',
            '• Saving your preferences'
        ]
    },
    {
        title: '6. Data Sharing',
        content: [
            'We may share data only with:',
            '• Service providers (e.g., Supabase hosting)',
            '• Email services (for sending notifications)',
            'We never sell or share your information with advertisers.'
        ]
    },
    {
        title: '7. Data Security',
        content: [
            'We take security seriously and use:',
            '• Encryption',
            '• Secure storage',
            '• Access restrictions',
            '• Hashed passwords',
            'No system is 100% secure, but we work to protect your data.'
        ]
    },
    {
        title: '8. Your Rights',
        content: [
            'You can request:',
            '• Access to your data',
            '• Deletion of your account',
            '• Correction of incorrect data',
            '• Stopping email notifications',
            'Email: realpricetracker94@gmail.com for any requests.'
        ]
    },
    {
        title: '9. Data Retention',
        content: [
            'We keep your data only as long as necessary to provide the Service.',
            'If you delete your account, we remove your stored data.'
        ]
    },
    {
        title: '10. Third-Party Links',
        content: [
            'Our platform tracks data from third-party websites.',
            'We do not control their privacy practices.',
            'Please check their policies separately.'
        ]
    },
    {
        title: '11. Changes to This Policy',
        content: [
            'We may update this Privacy Policy.',
            'If we make changes, we will update the “Last updated” date.'
        ]
    },
    {
        title: '12. Contact Us',
        content: [
            'Questions? Contact us:',
            'Email: realpricetracker94@gmail.com'
        ]
    }
];
export default function PrivacyPolicy() {
    return (_jsx("div", { className: "min-h-screen bg-gray-50 py-16 px-4", children: _jsxs("div", { className: "max-w-4xl mx-auto bg-white shadow-lg rounded-2xl p-8", children: [_jsx("p", { className: "text-sm text-gray-500 mb-2", children: "Last updated: Nov 20, 2025" }), _jsx("h1", { className: "text-3xl font-bold text-gray-900 mb-6", children: "Privacy Policy" }), _jsx("p", { className: "text-gray-600 mb-8", children: "This page summarizes how we collect, process, and protect your data across the Price Tracker website and extension." }), _jsx("div", { className: "space-y-8", children: sections.map((section) => (_jsxs("section", { children: [_jsx("h2", { className: "text-xl font-semibold text-gray-900 mb-3", children: section.title }), _jsx("div", { className: "space-y-2 text-gray-700", children: section.content.map((line, idx) => (_jsx("p", { children: line }, idx))) })] }, section.title))) }), _jsx("div", { className: "mt-10", children: _jsx(Link, { to: "/auth", className: "text-blue-600 hover:text-blue-700 underline", children: "Back to authentication" }) })] }) }));
}
//# sourceMappingURL=PrivacyPolicy.js.map