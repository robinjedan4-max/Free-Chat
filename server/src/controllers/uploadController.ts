import { Request, Response } from 'express';
import User from '../models/User';
import { storageService } from '../services/storageService';
import { logger } from '../config/logger';

// Extend Express Request to include user from auth middleware
interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
}

export const uploadAvatar = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No file provided',
      });
      return;
    }

    // Upload file
    const uploadResult = await storageService.upload(req.file, 'avatars', userId);

    // Update user in database
    const user = await User.findByIdAndUpdate(
      userId,
      {
        profileImage: uploadResult.url,
        avatar: uploadResult.url, // Sync with avatar field for backward compatibility
      },
      { new: true }
    );

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    logger.info(`Avatar uploaded for user ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        url: uploadResult.url,
        user: user.toJSON(),
      },
    });
  } catch (error: any) {
    logger.error(`Avatar upload error: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message || 'Avatar upload failed',
    });
  }
};

export const uploadLogo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No file provided',
      });
      return;
    }

    // Upload file
    const uploadResult = await storageService.upload(req.file, 'logos', userId);

    // Update user in database
    const user = await User.findByIdAndUpdate(
      userId,
      { logoImage: uploadResult.url },
      { new: true }
    );

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    logger.info(`Logo uploaded for user ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Logo uploaded successfully',
      data: {
        url: uploadResult.url,
        user: user.toJSON(),
      },
    });
  } catch (error: any) {
    logger.error(`Logo upload error: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message || 'Logo upload failed',
    });
  }
};

export const uploadBanner = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No file provided',
      });
      return;
    }

    // Upload file
    const uploadResult = await storageService.upload(req.file, 'banners', userId);

    // Update user in database
    const user = await User.findByIdAndUpdate(
      userId,
      { bannerImage: uploadResult.url },
      { new: true }
    );

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    logger.info(`Banner uploaded for user ${userId}`);

    res.status(200).json({
      success: true,
      message: 'Banner uploaded successfully',
      data: {
        url: uploadResult.url,
        user: user.toJSON(),
      },
    });
  } catch (error: any) {
    logger.error(`Banner upload error: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message || 'Banner upload failed',
    });
  }
};
