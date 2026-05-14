import dotenv from 'dotenv';
import { redis, workshopSeatKey } from '../utils/redis.js';

dotenv.config();

const [,, workshopId] = process.argv;
if (!workshopId) {
  console.error('Usage: node flush_redis.mjs <workshopId>');
  process.exit(2);
}

(async () => {
  try {
    const key = workshopSeatKey(workshopId);
    await redis.del(key);
    console.log(`Deleted Redis key: ${key}`);
    process.exit(0);
  } catch (err) {
    console.error('Error deleting redis key:', err);
    process.exit(1);
  }
})();
