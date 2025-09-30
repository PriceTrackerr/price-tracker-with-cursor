import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Rewrite relative '/api' calls to the configured backend base URL if provided
const API_BASE = (import.meta as any).env?.VITE_API_BASE as string | undefined;
if (typeof window !== 'undefined' && API_BASE && API_BASE !== '/api') {
	const originalFetch = window.fetch.bind(window);
	const normalizedBase = API_BASE.replace(/\/$/, '');
	window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
		let urlString: string | undefined;
		if (typeof input === 'string') {
			urlString = input;
		} else if (input instanceof URL) {
			urlString = input.toString();
		} else if (typeof (input as any).url === 'string') {
			urlString = (input as any).url as string;
		}

		if (urlString && urlString.startsWith('/api')) {
			const finalUrl = normalizedBase.endsWith('/api')
				? `${normalizedBase}${urlString.substring(4)}`
				: `${normalizedBase}${urlString}`;
			return originalFetch(finalUrl, init);
		}
		return originalFetch(input as any, init);
	};
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)