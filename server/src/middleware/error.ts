import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { sendError } from '../utils/response';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  // Log error using Winston logger
  logger.error(`${req.method} ${req.url} - Error: ${message} - Stack: ${err.stack}`);

  // Send stylized response
  return sendError(
    res,
    process.env.NODE_ENV === 'production' ? 'Something went wrong on the server' : message,
    process.env.NODE_ENV === 'production' ? null : err.stack,
    statusCode
  );
};
