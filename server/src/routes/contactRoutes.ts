import { Router } from 'express';
import { syncContacts } from '../controllers/contactController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/sync', authenticate as any, syncContacts as any);

export default router;
