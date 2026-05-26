import { z } from 'zod';

export const registerSchema = z.object({
  username: z.string()
    .min(3, { message: 'Username must be at least 3 characters long' })
    .max(20, { message: 'Username must not exceed 20 characters' })
    .regex(/^[a-zA-Z0-9_]+$/, { message: 'Username can only contain letters, numbers, and underscores' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long' }),
});

export const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

export const createRoomSchema = z.object({
  title: z.string().min(3, { message: 'Room title must be at least 3 characters' }).max(50),
  description: z.string().max(200).optional(),
  type: z.enum(['voice', 'stream'], { message: 'Type must be voice or stream' }),
  category: z.string().min(1, { message: 'Category is required' }),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1, { message: 'Content cannot be empty' }).max(500),
  recipientId: z.string().optional(),
  roomId: z.string().optional(),
});

export const sendGiftSchema = z.object({
  giftId: z.string().min(1, { message: 'Gift selection is required' }),
  recipientId: z.string().min(1, { message: 'Recipient is required' }),
  roomId: z.string().optional(),
});
