const RAW_API_BASE = (import.meta as any).env?.VITE_API_BASE as string | undefined;
const API_BASE = (RAW_API_BASE || '/api').replace(/\/$/, '');

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = (typeof window !== 'undefined') ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const urlPath = path.startsWith('/') ? path : `/${path}`;
  const res = await fetch(`${API_BASE}${urlPath}`, { ...options, headers });
  let body: any = null;
  try {
    body = await res.json();
  } catch (_) {}
  if (!res.ok) {
    const message = body?.message || body?.error || res.statusText || 'Request failed';
    throw new Error(message);
  }
  return body;
}

export function withAuthHeaders(headers: Record<string, string> = {}) {
  const token = (typeof window !== 'undefined') ? localStorage.getItem('token') : null;
  return token ? { ...headers, Authorization: `Bearer ${token}` } : headers;
}


