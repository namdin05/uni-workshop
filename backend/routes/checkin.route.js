import express from 'express';
import { getWorkshopManifest, syncCheckins } from '../api/checkin.api.js';

const router = express.Router();

router.get('/workshops/:workshopId/manifest', getWorkshopManifest);
router.post('/sync', syncCheckins);

export default router;