import { Router } from 'express';
import { sendInvite } from '../controllers/inviteController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/send', authenticate as any, sendInvite as any);

export default router;
