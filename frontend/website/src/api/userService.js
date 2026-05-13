import { request } from './client.js';

export const fetchProfile = (token) => request('/api/user/profile', { method: 'GET', token });
export const fetchStudents = () => request('/api/user/students', { method: 'GET' });
export const fetchMyRegistrations = (token) => request('/api/user/registrations', { method: 'GET', token });
