import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';

dotenv.config();

const redisUrl = process.env.REDIS_URL;
const redisToken = process.env.REDIS_TOKEN;

if (!redisUrl || !redisToken) {
  throw new Error('Thiếu cấu hình Redis trong file .env');
}

export const redis = new Redis({
  url: redisUrl,
  token: redisToken,
});

export const workshopSeatKey = (workshopId) => `workshop:${workshopId}:seats`;