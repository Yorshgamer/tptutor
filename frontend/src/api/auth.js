// src/api/auth.js
const API_URL = '';

function getToken() {
  return localStorage.getItem('token');
}

async function request(path, opts = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(opts.headers || {})
  };
  const res = await fetch(`${API_URL}${path}`, { ...opts, headers });
  const json = await res.json().catch(() => ({}));

  if (!res.ok || json.ok === false) {
    const msg = json?.error || `HTTP_${res.status}`;
    throw new Error(msg);
  }
  return json.data ?? json;
}

export async function registerUser({ name, email, password, role = "student" }) {
  return request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, role })
  });
}

export async function loginUser({ email, password }) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
}

export async function fetchMe() {
  return request('/api/auth/me');
}