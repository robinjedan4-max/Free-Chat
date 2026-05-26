import { Response } from 'express';
import { Message } from '../models/Message';
import { sendMessageSchema } from '../utils/zodSchemas';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../config/logger';

export const getRoomMessages = async (req: AuthenticatedRequest, res: Response) => {
  const { roomId } = req.params;
  try {
    const messages = await Message.find({ roomId })
      .populate('sender', 'username avatar vipLevel')
      .sort({ createdAt: 1 })
      .limit(50);

    return sendSuccess(res, 'Room messages retrieved', messages);
  } catch (error: any) {
    return sendError(res, 'Failed to fetch messages', error.message, 500);
  }
};

export const getDirectMessages = async (req: AuthenticatedRequest, res: Response) => {
  const { partnerId } = req.params;
  const currentUserId = req.user?.userId;

  try {
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, recipient: partnerId },
        { sender: partnerId, recipient: currentUserId },
      ],
    })
      .populate('sender', 'username avatar vipLevel')
      .populate('recipient', 'username avatar vipLevel')
      .sort({ createdAt: 1 })
      .limit(50);

    return sendSuccess(res, 'Direct messages retrieved', messages);
  } catch (error: any) {
    return sendError(res, 'Failed to fetch direct messages', error.message, 500);
  }
};

export const sendDirectMessage = async (req: AuthenticatedRequest, res: Response) => {
  const result = sendMessageSchema.safeParse(req.body);
  if (!result.success) {
    return sendError(res, 'Validation error', result.error.format(), 400);
  }

  const { content, recipientId } = result.data;
  const senderId = req.user?.userId;

  if (!recipientId) {
    return sendError(res, 'Recipient ID is required for direct messages', null, 400);
  }

  try {
    const newMsg = new Message({
      sender: senderId,
      recipient: recipientId,
      content,
    });

    await newMsg.save();
    await newMsg.populate('sender', 'username avatar vipLevel');

    logger.info(`DM sent from ${senderId} to ${recipientId}`);
    return sendSuccess(res, 'Direct message sent successfully', newMsg, 201);
  } catch (error: any) {
    return sendError(res, 'Failed to send direct message', error.message, 500);
  }
};
