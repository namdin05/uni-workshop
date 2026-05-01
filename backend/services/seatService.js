import redis from '../config/redis.js';

/**
 * Workshop Service
 * Handles seat availability, locking, and workshop data
 */

const SEAT_LOCK_DURATION = 10 * 60; // 10 minutes in seconds

/**
 * Get seat count for a workshop (from Redis cache)
 */
export async function getAvailableSeats(workshopId) {
  try {
    const seatsKey = `workshop:${workshopId}:available_seats`;
    const seats = await redis.get(seatsKey);
    return seats ? parseInt(seats, 10) : null;
  } catch (error) {
    console.error('Error getting available seats:', error);
    throw error;
  }
}

/**
 * Decrease available seats (atomic operation)
 * Returns new seat count if successful, null if no seats available
 */
export async function lockSeat(workshopId) {
  try {
    const seatsKey = `workshop:${workshopId}:available_seats`;

    // Use Redis DECR for atomic operation
    const newSeatCount = await redis.decr(seatsKey);

    if (newSeatCount < 0) {
      // Increment back if we went negative
      await redis.incr(seatsKey);
      console.log(`[SEAT] No available seats for workshop ${workshopId}`);
      return null;
    }

    console.log(`[SEAT] Locked seat for workshop ${workshopId}. Remaining: ${newSeatCount}`);
    return newSeatCount;
  } catch (error) {
    console.error('Error locking seat:', error);
    throw error;
  }
}

/**
 * Release a locked seat (increase available seats)
 * Called when registration is cancelled or payment times out
 */
export async function releaseSeat(workshopId) {
  try {
    const seatsKey = `workshop:${workshopId}:available_seats`;
    const newSeatCount = await redis.incr(seatsKey);
    console.log(`[SEAT] Released seat for workshop ${workshopId}. Available: ${newSeatCount}`);
    return newSeatCount;
  } catch (error) {
    console.error('Error releasing seat:', error);
    throw error;
  }
}

/**
 * Initialize seat count for a workshop
 * Called when workshop is created or cache is refreshed
 */
export async function initializeSeatCount(workshopId, totalSeats) {
  try {
    const seatsKey = `workshop:${workshopId}:available_seats`;
    await redis.set(seatsKey, totalSeats.toString());
    console.log(`[SEAT] Initialized ${totalSeats} seats for workshop ${workshopId}`);
  } catch (error) {
    console.error('Error initializing seat count:', error);
    throw error;
  }
}

/**
 * Store seat lock temporarily (for timeout handling)
 */
export async function setSeatLock(workshopId, registrationId) {
  try {
    const lockKey = `workshop:${workshopId}:lock:${registrationId}`;
    await redis.setEx(lockKey, SEAT_LOCK_DURATION, '1');
    console.log(`[SEAT] Locked seat for registration ${registrationId}`);
  } catch (error) {
    console.error('Error setting seat lock:', error);
    throw error;
  }
}

/**
 * Check if a user already has a locked seat
 */
export async function hasSeatLock(workshopId, registrationId) {
  try {
    const lockKey = `workshop:${workshopId}:lock:${registrationId}`;
    const lock = await redis.get(lockKey);
    return lock !== null;
  } catch (error) {
    console.error('Error checking seat lock:', error);
    throw error;
  }
}

/**
 * Remove seat lock
 */
export async function removeSeatLock(workshopId, registrationId) {
  try {
    const lockKey = `workshop:${workshopId}:lock:${registrationId}`;
    await redis.del(lockKey);
    console.log(`[SEAT] Removed seat lock for registration ${registrationId}`);
  } catch (error) {
    console.error('Error removing seat lock:', error);
    throw error;
  }
}
