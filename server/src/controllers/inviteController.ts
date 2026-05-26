import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import { logger } from '../config/logger';

// Note: This is a lightweight stub. Integrate Twilio or another SMS provider for real delivery.
export const sendInvite = async (req: Request, res: Response) => {
  const { phoneNumber, via = 'sms', message } = req.body as { phoneNumber?: string; via?: string; message?: string };

  if (!phoneNumber) return sendError(res, 'phoneNumber is required', null, 400);

  try {
    // Normalize
    const cleaned = phoneNumber.replace(/[^+0-9]/g, '');

    // TODO: integrate provider (Twilio, Vonage, WhatsApp Business API)
    logger.info(`Invite requested for ${cleaned} via ${via}`);

    // For privacy, do not persist contact info here unless explicitly requested.
    return sendSuccess(res, 'Invite queued', { phoneNumber: cleaned, via });
  } catch (error: any) {
    return sendError(res, 'Failed to send invite', error.message, 500);
  }
};
