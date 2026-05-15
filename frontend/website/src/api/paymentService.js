import { request } from './client.js';

export const fetchPaymentGatewayStatus = () => request('/api/payments/gateway/status', { method: 'GET' });
export const setPaymentGatewayState = (state) => request('/api/payments/gateway/state', { method: 'POST', body: { state } });
export const confirmDemoPayment = (body, token) => request('/api/payments/demo/confirm', { method: 'POST', body, token });
export const togglePaymentGateway = (isActive, token) => request('/api/payments/admin/payment-gateway/toggle', { method: 'POST', body: { isActive }, token });
export const fetchPaymentTimeout = () => request('/api/payments/timeout', { method: 'GET' });
export const setPaymentTimeout = (timeoutSeconds, token) => request('/api/payments/timeout', { method: 'POST', body: { timeoutSeconds }, token });
export const cancelPendingRegistration = (registrationId, workshopId, token) => 
  request('/api/payments/cancel', { method: 'POST', body: { registrationId, workshopId }, token });
