import { Request, Response } from 'express';
import { User } from '../models/User';
import { sendSuccess, sendError } from '../utils/response';

// Start or fetch direct chat with a user by phoneNumber or userId
export const startChat = async (req: Request, res: Response) => {
  const { phoneNumber, userId } = req.body as { phoneNumber?: string; userId?: string };

  try {
    let targetUser = null as any;
    if (userId) {
      targetUser = await User.findById(userId).select('username avatar _id phoneNumber');
    } else if (phoneNumber) {
      const cleaned = phoneNumber.replace(/[^+0-9]/g, '');
      targetUser = await User.findOne({ phoneNumber: cleaned }).select('username avatar _id phoneNumber');
    } else {
      return sendError(res, 'Missing phoneNumber or userId', null, 400);
    }

    if (!targetUser) {
      return sendSuccess(res, 'User not registered', { isRegistered: false });
    }

    // For simplicity, return the user object so the client can open a direct chat view.
    // In a richer implementation, we'd return or create a DM thread id.
    return sendSuccess(res, 'Chat ready', { isRegistered: true, user: targetUser });
  } catch (error: any) {
    return sendError(res, 'Failed to start chat', error.message, 500);
  }
};
