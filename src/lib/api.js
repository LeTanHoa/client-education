function getBaseUrl() {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    let clean = envUrl.trim().replace(/\/+$/, '');
    if (!clean.endsWith('/api')) clean += '/api';
    return clean;
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://api-education-iota.vercel.app/api';
  }
  return 'http://localhost:5001/api';
}

const baseUrl = getBaseUrl();
async function request(path, options = {}) {
  const token = localStorage.getItem('hoc-vui-token');
  return fetch(`${baseUrl}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
}
export async function api(path, options = {}) {
  let response = await request(path, options);
  if (response.status === 401) {
    const refresh = await fetch(`${baseUrl}/auth/refresh`, { method: 'POST', credentials: 'include' });
    if (refresh.ok) {
      const { accessToken } = await refresh.json();
      localStorage.setItem('hoc-vui-token', accessToken);
      response = await request(path, options);
    }
  }
  const data = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(data.message || 'Không thể tải dữ liệu.');
  return data;
}
