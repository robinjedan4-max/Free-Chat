import { Request, Response } from 'express';
import { Gift } from '../models/Gift';
import { User } from '../models/User';
import { Message } from '../models/Message';
import { sendGiftSchema } from '../utils/zodSchemas';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../config/logger';

export const listGifts = async (req: Request, res: Response) => {
  try {
    let gifts = await Gift.find();
    
    // Seed gifts if database is currently empty
    if (gifts.length === 0) {
      const defaultGifts = [
        { name: 'Glow Heart', cost: 10, icon: '❤️', effectClass: 'heart-rain' },
        { name: 'Neon Microphone', cost: 50, icon: '🎤', effectClass: 'microphone-sparkle' },
        { name: 'Cyber Crown', cost: 200, icon: '👑', effectClass: 'crown-glow' },
        { name: 'Supernova Rocket', cost: 500, icon: '🚀', effectClass: 'rocket-launch' },
        { name: 'Aether Sparkle', cost: 1000, icon: '✨', effectClass: 'sparkle-nova' },
      ];
      gifts = await Gift.insertMany(defaultGifts);
      logger.info('Pre-seeded default Virtual Gifts in DB');
    }

    return sendSuccess(res, 'Virtual gifts retrieved', gifts);
  } catch (error: any) {
    return sendError(res, 'Failed to fetch gifts', error.message, 500);
  }
};

export const sendGift = async (req: AuthenticatedRequest, res: Response) => {
  const result = sendGiftSchema.safeParse(req.body);
  if (!result.success) {
    return sendError(res, 'Validation error', result.error.format(), 400);
  }

  const { giftId, recipientId, roomId } = result.data;
  const senderId = req.user?.userId;

  if (senderId === recipientId) {
    return sendError(res, 'You cannot send a gift to yourself', null, 400);
  }

  try {
    const gift = await Gift.findById(giftId);
    if (!gift) return sendError(res, 'Virtual gift asset not found', null, 404);

    const sender = await User.findById(senderId);
    const recipient = await User.findById(recipientId);

    if (!sender || !recipient) {
      return sendError(res, 'Sender or Recipient profile not found', null, 404);
    }

    // Check balance
    if (sender.diamonds < gift.cost) {
      return sendError(res, `Insufficient diamonds. You need ${gift.cost} diamonds, but only have ${sender.diamonds}`, null, 400);
    }

    // Process transaction
    sender.diamonds -= gift.cost;
    recipient.diamonds += Math.round(gift.cost * 0.8); // Recipient receives 80% reputation diamonds

    await sender.save();
    await recipient.save();

    // Create a special room message declaring the gift
    const messageContent = `sent ${gift.name} ${gift.icon} to @${recipient.username}!`;
    const giftMsg = new Message({
      sender: senderId,
      roomId: roomId || null,
      content: messageContent,
      isGift: true,
      giftDetails: {
        giftId: gift._id,
        name: gift.name,
        cost: gift.cost,
        icon: gift.icon
      }
    });

    await giftMsg.save();
    await giftMsg.populate('sender', 'username avatar vipLevel');

    logger.info(`Gift transaction: ${sender.username} sent ${gift.name} to ${recipient.username}`);

    return sendSuccess(res, `Successfully sent ${gift.name}!`, {
      senderDiamonds: sender.diamonds,
      recipientDiamonds: recipient.diamonds,
      message: giftMsg,
      giftDetails: {
        icon: gift.icon,
        name: gift.name,
        effectClass: gift.effectClass
      }
    });
  } catch (error: any) {
    logger.error(`Gift transaction failed: ${error.message}`);
    return sendError(res, 'Failed to complete gift transaction', error.message, 500);
  }
};
