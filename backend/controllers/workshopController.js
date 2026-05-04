import db from '../config/database.js';
import redis from '../config/redis.js';
import {
  getAvailableSeats,
  lockSeat,
  setSeatLock,
  releaseSeat,
  initializeSeatCount,
} from '../services/seatService.js';
import { generateQRCode } from '../services/qrCodeService.js';
import { initiatePayment } from '../services/paymentService.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Get all workshops with current seat availability
 */
export async function getWorkshops(req, res, next) {
  try {
    const workshops = await db('workshops')
      .select('*')
      .orderBy('start_time', 'asc');

    // Enrich with real-time seat availability
    const workshopsWithSeats = await Promise.all(
      workshops.map(async (workshop) => {
        const availableSeats = await getAvailableSeats(workshop.id);
        return {
          ...workshop,
          availableSeats: availableSeats !== null ? availableSeats : workshop.available_seats,
        };
      })
    );

    res.json({
      success: true,
      data: workshopsWithSeats,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get workshop details by ID
 */
export async function getWorkshopById(req, res, next) {
  try {
    const { workshopId } = req.params;

    const workshop = await db('workshops')
      .where('id', workshopId)
      .first();

    if (!workshop) {
      throw new AppError('Workshop not found', 404);
    }

    const availableSeats = await getAvailableSeats(workshopId);

    res.json({
      success: true,
      data: {
        ...workshop,
        availableSeats: availableSeats !== null ? availableSeats : workshop.available_seats,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get available seats for a workshop
 */
export async function getWorkshopSeats(req, res, next) {
  try {
    const { workshopId } = req.params;

    const workshop = await db('workshops')
      .where('id', workshopId)
      .first();

    if (!workshop) {
      throw new AppError('Workshop not found', 404);
    }

    const availableSeats = await getAvailableSeats(workshopId);
    const seatsAvailable = availableSeats !== null ? availableSeats : workshop.available_seats;

    res.json({
      success: true,
      data: {
        workshopId,
        totalSeats: workshop.total_seats,
        availableSeats: seatsAvailable,
        isAvailable: seatsAvailable > 0,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Register user for a workshop
 * Requires idempotency key to prevent duplicate registrations
 */
export async function registerWorkshop(req, res, next) {
  try {
    const { workshopId } = req.params;
    const userId = req.user?.id || 2; // For testing, default to user ID 2 if not authenticated
    const idempotencyKey = req.idempotencyKey;

    // Validate user authentication
    if (!userId) {
      throw new AppError('User authentication required', 401);
    }

    // Check if workshop exists
    const workshop = await db('workshops')
      .where('id', workshopId)
      .first();

    if (!workshop) {
      throw new AppError('Workshop not found', 404);
    }

    // Check if workshop is open (status should be 'active', 'published', or similar)
    if (!['active', 'open', 'published'].includes(workshop.status)) {
      throw new AppError('Workshop registration is not open', 409);
    }

    // Check if user already registered
    const existingRegistration = await db('registrations')
      .where('user_id', userId)
      .andWhere('workshop_id', workshopId)
      .whereIn('status', ['pending_payment', 'confirmed'])
      .first();

    if (existingRegistration) {
      throw new AppError('You have already registered for this workshop', 409);
    }

    // Lazy-load seat data into Redis if needed
    const cachedSeats = await getAvailableSeats(workshopId);
    if (cachedSeats === null) {
      await initializeSeatCount(workshopId, workshop.available_seats);
    }

    // Try to lock a seat
    const newSeatCount = await lockSeat(workshopId);
    if (newSeatCount === null) {
      throw new AppError('No available seats for this workshop', 409);
    }

    // Generate QR code for check-in
    const qrCodeData = await generateQRCode(`REG_${workshopId}_${userId}_${Date.now()}`, workshopId);
    const qrCode = qrCodeData.code;

    // Create registration record
    const registration = await db('registrations')
      .insert({
        user_id: userId,
        workshop_id: workshopId,
        status: 'pending_payment',
        qr_code: qrCode,
        created_at: new Date(),
      })
      .returning('*');

    const registrationRecord = registration[0];

    // Set seat lock in Redis
    await setSeatLock(workshopId, registrationRecord.id);

    console.log('[REGISTRATION] Created registration:', {
      registrationId: registrationRecord.id,
      workshopId,
      userId,
      idempotencyKey,
    });

    // Cache result for idempotency
    const responseData = {
      success: true,
      registrationId: registrationRecord.id,
      message: 'Seat locked successfully. Please proceed to payment.',
      seatsRemaining: newSeatCount,
    };

    if (req.cacheResult) {
      await req.cacheResult(200, responseData);
    }

    res.status(200).json(responseData);
  } catch (error) {
    // If registration failed, try to release the seat
    if (error.statusCode !== 400 && error.statusCode !== 401) {
      try {
        await releaseSeat(req.params.workshopId);
      } catch (releaseError) {
        console.error('Error releasing seat after failed registration:', releaseError);
      }
    }

    next(error);
  }
}
