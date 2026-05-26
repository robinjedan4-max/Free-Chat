import { Router } from 'express';
import { listRooms, createRoom, claimSeat, leaveSeat, deleteRoom } from '../controllers/roomController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate as any);

router.get('/', listRooms as any);
router.post('/create', createRoom as any);
router.post('/seats/claim', claimSeat as any);
router.post('/seats/leave', leaveSeat as any);
router.delete('/:id', deleteRoom as any);

export default router;
