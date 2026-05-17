import express from 'express';
import { register, login, validateActivation, activateAccount } from '../api/auth.api.js';
import { registrationLimiter } from '../middlewares/rateLimit.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', registrationLimiter, login);
router.post('/activate/validate', validateActivation);
router.post('/activate', activateAccount);

export default router;