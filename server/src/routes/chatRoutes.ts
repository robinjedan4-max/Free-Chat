import { Router } from 'express';
import { startChat } from '../controllers/chatController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/start', authenticate as any, startChat as any);

export default router;
