import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: any;
}

export const sendSuccess = <T>(res: Response, message: string, data?: T, statusCode = 200): Response => {
  const responseBody: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  return res.status(statusCode).json(responseBody);
};

export const sendError = (res: Response, message: string, error?: any, statusCode = 400): Response => {
  const responseBody: ApiResponse = {
    success: false,
    message,
    error: error || null,
  };
  return res.status(statusCode).json(responseBody);
};
