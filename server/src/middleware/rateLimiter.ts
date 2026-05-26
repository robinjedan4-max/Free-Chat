import rateLimit from 'express-rate-limit';
import { Response } from 'express';
import { sendError } from '../utils/response';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res: Response) => {
    return sendError(res, 'Too many requests from this IP, please try again after 15 minutes', null, 429);
  },
});

export const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 requests per minute for login/register
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res: Response) => {
    return sendError(res, 'Too many authentication attempts. Please wait a minute and retry.', null, 429);
  },
});
