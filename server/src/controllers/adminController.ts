import { Response } from 'express';
import { User } from '../models/User';
import { Room } from '../models/Room';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../config/logger';

export const getStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeRooms = await Room.countDocuments({ isActive: true });
    
    // Aggregation of diamond holdings
    const diamondAggregation = await User.aggregate([
      { $group: { _id: null, totalDiamonds: { $sum: '$diamonds' } } }
    ]);
    const systemDiamonds = diamondAggregation[0]?.totalDiamonds || 0;

    const vipCounts = {
      VIP: await User.countDocuments({ vipLevel: 'VIP' }),
      SVIP: await User.countDocuments({ vipLevel: 'SVIP' }),
      none: await User.countDocuments({ vipLevel: 'none' }),
    };

    logger.info('System stats compiled by administrator');
    return sendSuccess(res, 'System statistics loaded', {
      totalUsers,
      activeRooms,
      systemDiamonds,
      vipCounts,
    });
  } catch (error: any) {
    return sendError(res, 'Failed to compile statistics', error.message, 500);
  }
};

export const banUser = async (req: AuthenticatedRequest, res: Response) => {
  const { userId, isBanned } = req.body;

  if (userId === req.user?.userId) {
    return sendError(res, 'You cannot ban yourself', null, 400);
  }

  try {
    const user = await User.findById(userId);
    if (!user) return sendError(res, 'User not found', null, 404);

    if (user.role === 'admin') {
      return sendError(res, 'You cannot ban another administrator', null, 400);
    }

    user.isBanned = isBanned;
    await user.save();

    logger.warn(`User status change: ${user.username} isBanned set to ${isBanned} by admin`);
    return sendSuccess(res, `User successfully ${isBanned ? 'banned' : 'unbanned'}`, user);
  } catch (error: any) {
    return sendError(res, 'Failed to update user ban state', error.message, 500);
  }
};

export const generateVIPCodes = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Generate a set of unique dynamic gift keys
    const codes = Array.from({ length: 5 }, () => 
      'GLOW-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-2026'
    );
    return sendSuccess(res, 'VIP promotional codes generated successfully', codes);
  } catch (error: any) {
    return sendError(res, 'Failed to generate VIP codes', error.message, 500);
  }
};
