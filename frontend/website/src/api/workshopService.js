import { request } from './client.js';

export const fetchWorkshops = () => request('/api/workshops', { method: 'GET' });
export const fetchWorkshop = (id) => request(`/api/workshops/${id}`, { method: 'GET' });
export const registerForWorkshop = (body, token) => request('/api/workshops/register', { method: 'POST', body, token });
