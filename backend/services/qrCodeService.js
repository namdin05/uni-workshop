import QRCode from 'qrcode';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Generate QR code for workshop check-in
 * Encodes registration ID and workshop details
 */
export async function generateQRCode(registrationId, workshopId) {
  try {
    const qrData = {
      registrationId,
      workshopId,
      timestamp: new Date().toISOString(),
    };

    const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      quality: 0.95,
      margin: 1,
      width: 300,
    });

    return {
      code: registrationId,
      imageUrl: qrCodeDataUrl,
      data: qrData,
    };
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Verify QR code data during check-in
 */
export function verifyQRCode(qrData) {
  try {
    const data = JSON.parse(qrData);
    return {
      valid: true,
      registrationId: data.registrationId,
      workshopId: data.workshopId,
      timestamp: data.timestamp,
    };
  } catch (error) {
    return {
      valid: false,
      error: 'Invalid QR code data',
    };
  }
}
