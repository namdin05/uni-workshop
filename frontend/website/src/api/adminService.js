import { request } from './client.js';

export const fetchAdminWorkshops = (token) => request('/api/admin/workshops', { method: 'GET', token });
export const createWorkshop = (body, token) => request('/api/admin/workshops', { method: 'POST', body, token });
export const warmUpWorkshopCache = (token) => request('/api/admin/workshops/cache/prewarm', { method: 'POST', token });
export const updateWorkshop = (id, body, token) => request(`/api/admin/workshops/${id}`, { method: 'PATCH', body, token });
export const updateWorkshopStatus = (id, body, token) => request(`/api/admin/workshops/${id}/status`, { method: 'PATCH', body, token });
export const uploadCsv = (csvText, fileName) => request('/api/workshops/sync/csv', { method: 'POST', body: { csv: csvText, fileName } });
export const fetchWorkshopRegistrations = (id, token) => request(`/api/admin/workshops/${id}/registrations`, { method: 'GET', token });
