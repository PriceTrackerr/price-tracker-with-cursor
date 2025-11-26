import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
// Rewrite relative '/api' calls to the configured backend base URL if provided
const API_BASE = import.meta.env?.VITE_API_URL;
if (typeof window !== 'undefined' && API_BASE && API_BASE !== '/api') {
    const originalFetch = window.fetch.bind(window);
    const normalizedBase = API_BASE.replace(/\/$/, '');
    window.fetch = (input, init) => {
        let urlString;
        if (typeof input === 'string') {
            urlString = input;
        }
        else if (input instanceof URL) {
            urlString = input.toString();
        }
        else if (typeof input.url === 'string') {
            urlString = input.url;
        }
        if (urlString && urlString.startsWith('/api')) {
            const finalUrl = normalizedBase.endsWith('/api')
                ? `${normalizedBase}${urlString.substring(4)}`
                : `${normalizedBase}${urlString}`;
            return originalFetch(finalUrl, init);
        }
        return originalFetch(input, init);
    };
}
ReactDOM.createRoot(document.getElementById('root')).render(_jsx(React.StrictMode, { children: _jsx(App, {}) }));
//# sourceMappingURL=main.js.map