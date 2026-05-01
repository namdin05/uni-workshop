// Format currency in Vietnamese Dong (VND)
export function formatVND(amount) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
  }).format(amount);
}

// Format date in Vietnamese format
export function formatDate(date) {
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

// Check if workshop registration is still open
export function isRegistrationOpen(workshop) {
  if (workshop?.status) {
    return ['active', 'open', 'published'].includes(workshop.status);
  }

  const now = new Date();
  const startDate = workshop.registrationStartDate ? new Date(workshop.registrationStartDate) : null;
  const endDate = workshop.registrationEndDate ? new Date(workshop.registrationEndDate) : null;

  if (startDate && endDate) {
    return now >= startDate && now <= endDate;
  }

  return true;
}

// Check if seats are available
export function hasAvailableSeats(availableSeats, minSeatsRequired = 1) {
  return availableSeats >= minSeatsRequired;
}
