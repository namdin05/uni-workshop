import express from 'express';
import { getRooms } from '../api/room.api.js';

const router = express.Router();

router.get('/', getRooms);

export default router;