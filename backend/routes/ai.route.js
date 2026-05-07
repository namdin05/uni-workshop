import express from 'express';
import multer from 'multer';
import { uploadPdfForSummary, getJobStatus } from '../api/ai.api.js';
import { verifyToken } from '../middlewares/auth.middlewares.js';

const router = express.Router();

const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }
});

router.post('/upload', verifyToken, upload.single('pdfFile'), uploadPdfForSummary);
router.get('/status/:jobId', verifyToken, getJobStatus);

export default router;