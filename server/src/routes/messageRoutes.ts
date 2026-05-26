import { Router } from 'express';
import { getRoomMessages, getDirectMessages, sendDirectMessage } from '../controllers/messageController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate as any);

router.get('/room/:roomId', getRoomMessages as any);
router.get('/direct/:partnerId', getDirectMessages as any);
router.post('/direct', sendDirectMessage as any);

export default router;
