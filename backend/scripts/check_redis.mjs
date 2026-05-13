import dotenv from 'dotenv';
import { redis, workshopSeatKey } from '../utils/redis.js';

dotenv.config();

const [,, workshopId] = process.argv;
if (!workshopId) {
  console.error('Usage: node check_redis.mjs <workshopId>');
  process.exit(2);
}

(async () => {
  try {
    const key = workshopSeatKey(workshopId);
    const value = await redis.get(key);
    console.log(`Redis key: ${key}`);
    console.log(`Value: ${value}`);
    process.exit(0);
  } catch (err) {
    console.error('Error reading redis:', err);
    process.exit(1);
  }
})();
