// Generate a UUID v4 idempotency key
export function generateIdempotencyKey() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Store idempotency key in session storage for tracking
export function storeIdempotencyKey(workshopId, key) {
  const keys = JSON.parse(sessionStorage.getItem('idempotencyKeys') || '{}');
  keys[workshopId] = key;
  sessionStorage.setItem('idempotencyKeys', JSON.stringify(keys));
}

// Retrieve idempotency key from session storage
export function getStoredIdempotencyKey(workshopId) {
  const keys = JSON.parse(sessionStorage.getItem('idempotencyKeys') || '{}');
  return keys[workshopId];
}
