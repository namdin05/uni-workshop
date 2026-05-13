import axios from 'axios';
import { loadSession } from '../utils/storage.js';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

const client = axios.create({ baseURL: API_BASE, timeout: 10000 });

// Request interceptor: attach Authorization header from stored session token
client.interceptors.request.use(
  (config) => {
    // If an Authorization header is already provided (via options), keep it.
    if (config.headers && config.headers.Authorization) return config;

    try {
      const session = loadSession();
      const token = session?.token;
      if (token) {
        config.headers = { ...(config.headers || {}), Authorization: `Bearer ${token}` };
      }
    } catch (err) {
      // fail silently; request will proceed without token
    }

    return config;
  },
  (error) => Promise.reject(error)
);

async function request(path, { method = 'GET', body, token } = {}) {
  try {
    const res = await client.request({
      url: path,
      method,
      data: body,
      // allow overriding token per-request; interceptor will apply session token otherwise
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

export { client, request, API_BASE };
