import express from 'express';
import * as userApi from '../api/user.api.js';
import { verifyToken } from '../middlewares/auth.middlewares.js';

const router = express.Router();

router.get('/profile', verifyToken, userApi.getProfile);
router.get('/registrations', verifyToken, userApi.getMyRegistrations);

export default router;