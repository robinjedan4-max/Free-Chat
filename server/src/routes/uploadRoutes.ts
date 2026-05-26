import express from 'express';
import { authenticate } from '../middleware/auth';
import { uploadMiddleware, handleMulterError } from '../middleware/upload';
import { uploadAvatar, uploadLogo, uploadBanner } from '../controllers/uploadController';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticate);

// Upload avatar
router.post('/avatar', uploadMiddleware.single('file'), handleMulterError, uploadAvatar);

// Upload logo
router.post('/logo', uploadMiddleware.single('file'), handleMulterError, uploadLogo);

// Upload banner
router.post('/banner', uploadMiddleware.single('file'), handleMulterError, uploadBanner);

export default router;
