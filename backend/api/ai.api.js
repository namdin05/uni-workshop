import { Queue } from 'bullmq';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const pdfSummaryQueue = new Queue('pdf-summary-queue', { connection: { url: process.env.REDIS_URL } });

export const uploadPdfForSummary = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Vui lòng tải file' });
        
        const { workshopId } = req.body; 
        
        const fileName = `pdf-${Date.now()}.pdf`;

        const { error } = await supabase.storage
            .from('workshop_pdf')
            .upload(fileName, req.file.buffer, { contentType: 'application/pdf' });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('workshop_pdf')
            .getPublicUrl(fileName);

        const job = await pdfSummaryQueue.add('summarize-pdf', {
            workshopId: workshopId || null,
            fileUrl: publicUrl
        });

        res.status(200).json({ 
            message: 'Đã đưa vào hàng đợi AI', 
            jobId: job.id 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Lỗi upload' });
    }
};

export const getJobStatus = async (req, res) => {
    try {
        const { jobId } = req.params;
        const job = await pdfSummaryQueue.getJob(jobId);

        if (!job) return res.status(404).json({ error: 'Không tìm thấy tiến trình xử lý' });

        const state = await job.getState(); 
        const result = job.returnvalue; 

        res.status(200).json({ state, result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Lỗi kiểm tra trạng thái' });
    }
};