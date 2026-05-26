import { Router } from 'express';
import { getCreators, getProfile, followUser, buyDiamonds, buyVIP, getFriends } from '../controllers/userController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate as any);

router.get('/', getCreators as any);
router.get('/friends', getFriends as any);
router.get('/:id', getProfile as any);
router.post('/follow/:id', followUser as any);
router.post('/buy-diamonds', buyDiamonds as any);
router.post('/buy-vip', buyVIP as any);

export default router;
