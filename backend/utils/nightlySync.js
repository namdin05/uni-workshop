import cron from 'node-cron';
import fs from 'fs';
import { Readable } from 'stream';
import csv from 'csv-parser';
import { supabaseAdmin } from '../utils/supabase.js';

export const startNightlySync = () => {
    cron.schedule('0 2 * * *', async () => {
        console.log('⏰ [Cron] Bắt đầu đồng bộ danh sách sinh viên...');
        
        const filePath = './uploads/students_export.csv'; 

        if (!fs.existsSync(filePath)) {
            console.log('[-] Không tìm thấy file CSV mới.');
            return;
        }

        const records = [];
        const csvText = fs.readFileSync(filePath, 'utf-8');
        const stream = Readable.from(csvText);

        stream
            .pipe(csv())
            .on('data', (row) => {
                if (row.student_id && row.email) {
                    records.push({
                        student_id: row.student_id,
                        email: row.email,
                        full_name: row.full_name || 'Chưa cập nhật',
                        role: 'student'
                    });
                }
            })
            .on('end', async () => {
                try {
                    const { error } = await supabaseAdmin
                        .from('users')
                        .upsert(records, { onConflict: 'student_id' });

                    if (error) throw error;
                    
                    fs.renameSync(filePath, `./uploads/processed_${Date.now()}.csv`);
                    console.log(`✅ [Cron] Đồng bộ thành công ${records.length} sinh viên!`);
                    
                } catch (dbError) {
                    console.error('❌ [Cron] Lỗi khi lưu vào Database:', dbError.message);
                }
            })
            .on('error', (err) => {
                console.error('❌ [Cron] Lỗi định dạng file CSV:', err.message);
            });
    });
};