import axios from 'axios';
import { generateIdempotencyKey } from '../utils/idempotency';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const workshopService = {
  // Get all workshops with availability
  getWorkshops: async () => {
    const response = await api.get('/workshops');
    return response.data.data;
  },

  // Get workshop details by ID
  getWorkshopById: async (workshopId) => {
    const response = await api.get(`/workshops/${workshopId}`);
    return response.data.data;
  },

  // Get real-time seat availability
  getAvailableSeats: async (workshopId) => {
    const response = await api.get(`/workshops/${workshopId}/seats`);
    return response.data.data;
  },

  // Register for workshop (with idempotency key)
  registerWorkshop: async (workshopId, registrationData) => {
    const idempotencyKey = generateIdempotencyKey();
    const response = await api.post(`/workshops/${workshopId}/register`, registrationData, {
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    });
    return response.data;
  },

  // Process payment
  initiatePayment: async (registrationId, paymentData) => {
    const idempotencyKey = generateIdempotencyKey();
    const response = await api.post(`/registrations/${registrationId}/payment`, paymentData, {
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    });
    return response.data;
  },

  // Verify payment status
  verifyPayment: async (registrationId) => {
    const response = await api.get(`/registrations/${registrationId}/payment/status`);
    return response.data;
  },

  // Get registration details
  getRegistration: async (registrationId) => {
    const response = await api.get(`/registrations/${registrationId}`);
    return response.data.data;
  },

  // Get QR code for registration
  getQRCode: async (registrationId) => {
    const response = await api.get(`/registrations/${registrationId}/qr`);
    return response.data.data;
  },
};

export default api;
