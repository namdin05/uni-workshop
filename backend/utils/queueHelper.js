import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const redisConnection = new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
export const notificationQueue = new Queue('workshop-notifications', { connection: redisConnection });

export const enqueueTicketEmail = async (email, fullName, title, startTime, roomName) => {
    try {
        await notificationQueue.add('send-notification', {
            user: { 
                email: email, 
                full_name: fullName || 'Sinh viên' 
            },
            workshopData: {
                title: title || 'Workshop chưa rõ tên',
                time: startTime ? new Date(startTime).toLocaleString('vi-VN') : 'Chưa cập nhật',
                location: roomName || 'Chưa cập nhật'
            }
        });
        console.log(`🚀 [Queue] Đã ném job gửi mail vé cho: ${email}`);
    } catch (error) {
        console.error('❌ [Queue Error] Lỗi khi đưa job vào hàng đợi:', error.message);
    }
};