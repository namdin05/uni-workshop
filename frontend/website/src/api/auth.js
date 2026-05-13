// ============================================================================
// Aggregated export file for all API services
// For new code, consider importing directly from specific service modules
// ============================================================================

// Auth Service APIs
export { loginRequest, registerRequest, validateActivation, completeActivation } from './authService.js';

// User Service APIs
export { fetchProfile, fetchStudents, fetchMyRegistrations } from './userService.js';

// Workshop Service APIs
export { fetchWorkshops, fetchWorkshop, registerForWorkshop } from './workshopService.js';

// Admin Service APIs
export { fetchAdminWorkshops, createWorkshop, warmUpWorkshopCache, updateWorkshop, updateWorkshopStatus, uploadCsv } from './adminService.js';

// Payment Service APIs
export { fetchPaymentGatewayStatus, setPaymentGatewayState, confirmDemoPayment, togglePaymentGateway } from './paymentService.js';

// Storage Utils
export { loadSession, saveSession, clearSession, STORAGE_KEY } from '../utils/storage.js';

// HTTP Client Core
export { client, request, API_BASE } from './client.js';

// Notification DB-less flow: email is sent on registration; no inbox APIs
// admin send APIs removed - notifications are sent automatically on student registration
