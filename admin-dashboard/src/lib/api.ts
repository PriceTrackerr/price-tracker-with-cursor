import { apiUrl } from '../utils/api';

const TOKEN_KEYS = ['admin_token', 'sb-access-token', 'token'];

export const getStoredToken = (): string | null => {
  for (const key of TOKEN_KEYS) {
    const value = window.localStorage.getItem(key);
    if (value) {
      return value;
    }
  }
  return null;
};

export const setStoredToken = (token: string) => {
  TOKEN_KEYS.forEach((key) => window.localStorage.setItem(key, token));
};

export const clearStoredToken = () => {
  TOKEN_KEYS.forEach((key) => window.localStorage.removeItem(key));
};

const redirectToLogin = () => {
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
};

interface RequestOptions extends RequestInit {
  requireAuth?: boolean;
  parseJson?: boolean;
}

const handleUnauthorized = () => {
  clearStoredToken();
  redirectToLogin();
};

const prepareHeaders = (headers?: HeadersInit): Headers => {
  if (headers instanceof Headers) {
    return headers;
  }
  return new Headers(headers || {});
};

const request = async (endpoint: string, options: RequestOptions = {}) => {
  const { requireAuth = true, parseJson = true, body, ...fetchOptions } = options;
  const headers = prepareHeaders(fetchOptions.headers);

  let token: string | null = null;
  if (requireAuth) {
    token = getStoredToken();
    if (!token) {
      redirectToLogin();
      throw new Error('Missing auth token');
    }
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (body && !headers.has('Content-Type') && !(body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(apiUrl(endpoint), {
    ...fetchOptions,
    headers,
    body: body && !(body instanceof FormData) ? JSON.stringify(body) : body,
  });

  if (response.status === 401) {
    handleUnauthorized();
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const text = await response.text().catch(() => 'Request failed');
    throw new Error(text || 'Request failed');
  }

  return parseJson ? response.json() : response;
};

export const apiClient = {
  get: <T = any>(endpoint: string, options?: RequestOptions) =>
    request(endpoint, { ...options, method: 'GET' }) as Promise<T>,

  post: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    request(endpoint, { ...options, method: 'POST', body }) as Promise<T>,

  put: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    request(endpoint, { ...options, method: 'PUT', body }) as Promise<T>,

  delete: <T = any>(endpoint: string, options?: RequestOptions) =>
    request(endpoint, { ...options, method: 'DELETE' }) as Promise<T>,

  request,
};


