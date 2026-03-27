// API configuration utility
// Uses environment variable in production, localhost in development

const getApiBaseUrl = (): string => {
  // Always check for environment variable first (works in both dev and prod)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // In production (Vercel), use relative paths (/api/*) so requests go through
  // the Vercel rewrite proxy to Render — avoids CORS issues
  if (import.meta.env.PROD) {
    return '';  // relative paths, proxied by Vercel rewrites
  }
  
  // In development, use localhost with proxy or direct URL
  return 'http://localhost:3001';
};

export const API_BASE_URL = getApiBaseUrl();

// Helper function to build API endpoints
export const apiUrl = (endpoint: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // If endpoint already includes http, return as-is
  if (cleanEndpoint.startsWith('http')) {
    return cleanEndpoint;
  }
  
  // Build full URL
  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const path = cleanEndpoint.startsWith('/') ? cleanEndpoint : `/${cleanEndpoint}`;
  
  return `${base}${path}`;
};

console.log('API Base URL:', API_BASE_URL);

