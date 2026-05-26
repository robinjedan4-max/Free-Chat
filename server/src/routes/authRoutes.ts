import { Router } from 'express';
import { register, login, logout, refresh, getMe } from '../controllers/authController';
import { authLimiter } from '../middleware/rateLimiter';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.post('/refresh-token', refresh);
router.get('/me', authenticate as any, getMe as any);

export default router;
