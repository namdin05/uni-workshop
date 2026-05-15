import express from 'express';
import multer from 'multer';
import { createRoom, getAdminRooms, updateRoom, uploadRoomLayoutImage } from '../api/room.api.js';

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
});

router.get('/', getAdminRooms);
router.post('/', createRoom);
router.patch('/:id', updateRoom);
router.post('/:id/layout-image', upload.single('layoutImage'), uploadRoomLayoutImage);

export default router;