import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { NotificationManager } from '../services/notification.manager.js';
import { EmailStrategy } from '../services/email.strategy.js';

const notifier = new NotificationManager();
notifier.use(new EmailStrategy());

const connection = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
});

export const startNotificationWorker = () => {
    const worker = new Worker('workshop-notifications', async (job) => {
        const { user, workshopData } = job.data;
        console.log(`[Worker] Đang rải thông báo cho sinh viên: ${user.email}`);
        
        await notifier.notifyAll(user, workshopData);
        
    }, { connection });

    worker.on('completed', job => console.log(`✅ [Worker] Xử lý xong job báo danh: ${job.id}`));
    worker.on('failed', (job, err) => console.error(`❌ [Worker] Lỗi job ${job.id}:`, err.message));
};