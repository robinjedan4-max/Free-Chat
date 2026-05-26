import { Request, Response } from 'express';
import { User } from '../models/User';
import { Session } from '../models/Session';
import { registerSchema, loginSchema } from '../utils/zodSchemas';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/tokens';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../config/logger';

export const register = async (req: Request, res: Response) => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    return sendError(res, 'Validation error', result.error.format(), 400);
  }

  const { username, email, password } = result.data;

  try {
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return sendError(res, 'Username or Email is already registered', null, 409);
    }

    // Creating user triggers pre-save password hashing in Schema
    const newUser = new User({ username, email, password });
    
    // Seed initial users as admin if it's the very first user (simplifies admin tests)
    const totalUsers = await User.countDocuments();
    if (totalUsers === 0) {
      newUser.role = 'admin';
      newUser.vipLevel = 'SVIP';
    }
    
    await newUser.save();
    logger.info(`User registered: ${username} (${email})`);

    const payload = { userId: newUser._id.toString(), role: newUser.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Save session refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await Session.create({ userId: newUser._id, refreshToken, expiresAt });

    return sendSuccess(res, 'User registered successfully', {
      user: newUser,
      accessToken,
      refreshToken,
    }, 201);
  } catch (error: any) {
    logger.error(`Registration failed: ${error.message}`);
    return sendError(res, 'Server error during registration', error.message, 500);
  }
};

export const login = async (req: Request, res: Response) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    return sendError(res, 'Validation error', result.error.format(), 400);
  }

  const { email, password } = result.data;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return sendError(res, 'Invalid credentials', null, 401);
    }

    if (user.isBanned) {
      return sendError(res, 'This account has been banned by the administrator.', null, 403);
    }

    const isMatch = await (user as any).comparePassword(password);
    if (!isMatch) {
      return sendError(res, 'Invalid credentials', null, 401);
    }

    logger.info(`User logged in: ${user.username}`);

    const payload = { userId: user._id.toString(), role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Store Session
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await Session.create({ userId: user._id, refreshToken, expiresAt });

    return sendSuccess(res, 'Login successful', {
      user,
      accessToken,
      refreshToken,
    });
  } catch (error: any) {
    logger.error(`Login error: ${error.message}`);
    return sendError(res, 'Server error during login', error.message, 500);
  }
};

export const logout = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return sendError(res, 'Refresh token is required', null, 400);
  }

  try {
    await Session.deleteOne({ refreshToken });
    logger.info('Session revoked via logout');
    return sendSuccess(res, 'Logged out successfully');
  } catch (error: any) {
    return sendError(res, 'Server error during logout', error.message, 500);
  }
};

export const refresh = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return sendError(res, 'Refresh token is required', null, 400);
  }

  try {
    const decoded = verifyRefreshToken(refreshToken);
    const session = await Session.findOne({ userId: decoded.userId, refreshToken });
    
    if (!session) {
      return sendError(res, 'Session invalid or expired', null, 401);
    }

    const user = await User.findById(decoded.userId);
    if (!user || user.isBanned) {
      return sendError(res, 'User no longer exists or is banned', null, 403);
    }

    const payload = { userId: user._id.toString(), role: user.role };
    const newAccessToken = generateAccessToken(payload);

    return sendSuccess(res, 'Token refreshed successfully', {
      accessToken: newAccessToken,
    });
  } catch (error: any) {
    logger.warn(`Failed token refresh attempt: ${error.message}`);
    return sendError(res, 'Invalid refresh token', error.message, 401);
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return sendError(res, 'Access denied', null, 401);
    }
    const user = await User.findById(req.user.userId);
    if (!user) {
      return sendError(res, 'User not found', null, 404);
    }
    return sendSuccess(res, 'Profile retrieved', user);
  } catch (error: any) {
    return sendError(res, 'Server error fetching profile', error.message, 500);
  }
};
