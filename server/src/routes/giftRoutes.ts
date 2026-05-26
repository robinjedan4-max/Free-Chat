import { Router } from 'express';
import { listGifts, sendGift } from '../controllers/giftController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate as any);

router.get('/', listGifts as any);
router.post('/send', sendGift as any);

export default router;
