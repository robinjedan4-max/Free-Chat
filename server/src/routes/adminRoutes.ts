import { Router } from 'express';
import { getStats, banUser, generateVIPCodes } from '../controllers/adminController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.use(authenticate as any);
router.use(requireRole(['admin', 'moderator']) as any);

router.get('/stats', getStats as any);
router.post('/users/ban', banUser as any);
router.post('/vip-codes', requireRole(['admin']) as any, generateVIPCodes as any);

export default router;
