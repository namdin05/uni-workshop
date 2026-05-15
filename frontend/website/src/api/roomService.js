import { client, request } from './client.js';

export const fetchAdminRooms = (token) => request('/api/admin/rooms', { method: 'GET', token });

export const createRoom = (body, token) => request('/api/admin/rooms', { method: 'POST', body, token });

export const updateRoom = (id, body, token) => request(`/api/admin/rooms/${id}`, { method: 'PATCH', body, token });

export const uploadRoomLayoutImage = async (id, file, token) => {
  const formData = new FormData();
  formData.append('layoutImage', file);

  const response = await client.post(`/api/admin/rooms/${id}/layout-image`, formData, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  return response.data;
};