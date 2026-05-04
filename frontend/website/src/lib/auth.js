import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const STORAGE_KEY = 'unihub-auth-session';

const client = axios.create({ baseURL: API_BASE, timeout: 10000 });

async function request(path, { method = 'GET', body, token } = {}) {
  try {
    const res = await client.request({
      url: path,
      method,
      data: body,
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });

    return res.data;
  } catch (err) {
    const message = err?.response?.data?.message || err.message || 'Yêu cầu không thành công';
    const e = new Error(message);
    e.status = err?.response?.status;
    throw e;
  }
}

export const loginRequest = (body) => request('/api/auth/login', { method: 'POST', body });
export const registerRequest = (body) => request('/api/auth/register', { method: 'POST', body });
export const fetchProfile = (token) => request('/api/user/profile', { method: 'GET', token });
export const fetchWorkshops = () => request('/api/workshops', { method: 'GET' });
export const fetchWorkshop = (id) => request(`/api/workshops/${id}`, { method: 'GET' });
export const registerForWorkshop = (body, token) => request('/api/workshops/register', { method: 'POST', body, token });
export const fetchMyRegistrations = (token) => request('/api/user/registrations', { method: 'GET', token });
export const fetchPaymentGatewayStatus = () => request('/api/payments/gateway/status', { method: 'GET' });
export const setPaymentGatewayState = (state) => request('/api/payments/gateway/state', { method: 'POST', body: { state } });
export const confirmDemoPayment = (body, token) => request('/api/payments/demo/confirm', { method: 'POST', body, token });
export const uploadCsv = (csvText) => request('/api/workshops/sync/csv', { method: 'POST', body: { csv: csvText } });
export const createWorkshop = (body, token) => request('/api/admin/workshops', { method: 'POST', body, token });

export const loadSession = () => {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

export const saveSession = (session) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
};

export const clearSession = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
};

export { API_BASE, STORAGE_KEY };
