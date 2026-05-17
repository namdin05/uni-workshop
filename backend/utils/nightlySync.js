import cron from 'node-cron';
import { Readable } from 'stream';
import csv from 'csv-parser';
import { supabaseAdmin } from '../utils/supabase.js';

export const startNightlySync = () => {
    cron.schedule('0 2 * * *', async () => {
        console.log('⏰ [Cron] Bắt đầu đồng bộ danh sách sinh viên...');
        
        const BUCKET_NAME = 'csv_student';
        const FILE_NAME = 'students_export.csv';

        try {
            const { data: fileBlob, error: downloadError } = await supabaseAdmin
                .storage
                .from(BUCKET_NAME)
                .download(FILE_NAME);

            if (downloadError) {
                if (downloadError.message.includes('Object not found')) {
                    console.log('[-] Không tìm thấy file CSV mới trên Storage.');
                } else {
                    throw downloadError;
                }
                return;
            }

            const buffer = Buffer.from(await fileBlob.arrayBuffer());
            const stream = Readable.from(buffer);

            const records = [];

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
                    if (records.length === 0) return;

                    try {
                        const { error: upsertError } = await supabaseAdmin
                            .from('users')
                            .upsert(records, { onConflict: 'student_id' });

                        if (upsertError) throw upsertError;
                        
                        console.log(`✅ [Cron] Đồng bộ thành công ${records.length} sinh viên!`);

                        await supabaseAdmin.storage.from(BUCKET_NAME).remove([FILE_NAME]);
                        console.log(`[+] Đã dọn dẹp file CSV trên Storage.`);
                        
                    } catch (dbError) {
                        console.error('❌ [Cron] Lỗi Database:', dbError.message);
                    }
                });

        } catch (error) {
            console.error('❌ [Cron] Lỗi hệ thống:', error.message);
        }
    });
};