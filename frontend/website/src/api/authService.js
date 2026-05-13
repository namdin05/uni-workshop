import { request } from './client.js';

export const loginRequest = (body) => request('/api/auth/login', { method: 'POST', body });
export const registerRequest = (body) => request('/api/auth/register', { method: 'POST', body });
export const validateActivation = (body) => request('/api/auth/activate/validate', { method: 'POST', body });
export const completeActivation = (body) => request('/api/auth/activate', { method: 'POST', body });
