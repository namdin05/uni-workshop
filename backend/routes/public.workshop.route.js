import express from 'express';
import * as workshopApi from '../api/workshop.api.js';

const router = express.Router();

// Public: list all workshops
router.get('/', workshopApi.listWorkshops);

// Public: get workshop detail
router.get('/:id', workshopApi.getWorkshopById);

// Public: register for workshop (calls RPC)
router.post('/register', workshopApi.registerWorkshop);

// Public: upload CSV for data sync
router.post('/sync/csv', workshopApi.uploadCsv);

export default router;
