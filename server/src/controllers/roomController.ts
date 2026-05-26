import { Response } from 'express';
import { Room } from '../models/Room';
import { createRoomSchema } from '../utils/zodSchemas';
import { sendSuccess, sendError } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';
import { logger } from '../config/logger';

export const listRooms = async (req: AuthenticatedRequest, res: Response) => {
  const category = req.query.category as string || '';
  const type = req.query.type as string || '';

  try {
    const filter: any = { isActive: true };
    if (category && category !== 'All') {
      filter.category = category;
    }
    if (type) {
      filter.type = type;
    }

    const rooms = await Room.find(filter)
      .populate('host', 'username avatar vipLevel')
      .populate('seats.user', 'username avatar vipLevel')
      .sort({ viewersCount: -1, createdAt: -1 });

    return sendSuccess(res, 'Rooms retrieved successfully', rooms);
  } catch (error: any) {
    return sendError(res, 'Failed to fetch rooms', error.message, 500);
  }
};

export const createRoom = async (req: AuthenticatedRequest, res: Response) => {
  const result = createRoomSchema.safeParse(req.body);
  if (!result.success) {
    return sendError(res, 'Validation error', result.error.format(), 400);
  }

  const { title, description, type, category } = result.data;
  const hostId = req.user?.userId;

  try {
    // If the host has an existing active room, close it first
    await Room.updateMany({ host: hostId, isActive: true }, { isActive: false });

    // Instantiating a new Room creates 8 seat placeholders automatically (defined in Room.ts default)
    const newRoom = new Room({
      title,
      description,
      type,
      category,
      host: hostId,
      viewersCount: 1, // Host starts inside
    });

    // In a voice room, seat index 0 is occupied by the host by default
    if (type === 'voice') {
      newRoom.seats[0].user = hostId as any;
    }

    await newRoom.save();
    await newRoom.populate([
      { path: 'host', select: 'username avatar vipLevel' },
      { path: 'seats.user', select: 'username avatar vipLevel' }
    ]);

    logger.info(`New room created: ${title} (${type}) by host ID ${hostId}`);
    return sendSuccess(res, 'Room created successfully', newRoom, 201);
  } catch (error: any) {
    logger.error(`Room creation failed: ${error.message}`);
    return sendError(res, 'Failed to create room', error.message, 500);
  }
};

export const claimSeat = async (req: AuthenticatedRequest, res: Response) => {
  const { roomId, seatIndex } = req.body;
  const userId = req.user?.userId;

  if (seatIndex < 0 || seatIndex >= 8) {
    return sendError(res, 'Invalid seat position index', null, 400);
  }

  try {
    const room = await Room.findOne({ _id: roomId, isActive: true });
    if (!room) {
      return sendError(res, 'Active room not found', null, 404);
    }

    // Check if the seat is already taken
    const targetSeat = room.seats.find(s => s.index === seatIndex);
    if (targetSeat && targetSeat.user) {
      return sendError(res, 'This seat is already occupied', null, 409);
    }

    // Check if the user is already sitting in another seat
    const existingSeat = room.seats.find(s => s.user?.toString() === userId);
    if (existingSeat) {
      // Clear their previous seat
      existingSeat.user = null as any;
    }

    // Assign the seat to the user
    const seatToClaim = room.seats.find(s => s.index === seatIndex);
    if (seatToClaim) {
      seatToClaim.user = userId as any;
    }

    await room.save();
    await room.populate('seats.user', 'username avatar vipLevel');

    logger.info(`User ${userId} claimed seat ${seatIndex} in room ${roomId}`);
    return sendSuccess(res, 'Seat claimed successfully', room.seats);
  } catch (error: any) {
    return sendError(res, 'Failed to claim seat', error.message, 500);
  }
};

export const leaveSeat = async (req: AuthenticatedRequest, res: Response) => {
  const { roomId } = req.body;
  const userId = req.user?.userId;

  try {
    const room = await Room.findOne({ _id: roomId, isActive: true });
    if (!room) {
      return sendError(res, 'Active room not found', null, 404);
    }

    const occupiedSeat = room.seats.find(s => s.user?.toString() === userId);
    if (!occupiedSeat) {
      return sendError(res, 'You are not occupying any seat', null, 400);
    }

    occupiedSeat.user = null as any;
    await room.save();
    await room.populate('seats.user', 'username avatar vipLevel');

    logger.info(`User ${userId} left seat in room ${roomId}`);
    return sendSuccess(res, 'Seat vacated successfully', room.seats);
  } catch (error: any) {
    return sendError(res, 'Failed to vacate seat', error.message, 500);
  }
};

export const deleteRoom = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId;

  try {
    const room = await Room.findById(id);
    if (!room) return sendError(res, 'Room not found', null, 404);

    // Verify ownership or admin privileges
    if (room.host.toString() !== userId && req.user?.role !== 'admin') {
      return sendError(res, 'Access denied: You are not the host', null, 403);
    }

    room.isActive = false;
    await room.save();

    logger.info(`Room terminated: ${room.title} (ID ${id})`);
    return sendSuccess(res, 'Room closed successfully');
  } catch (error: any) {
    return sendError(res, 'Failed to close room', error.message, 500);
  }
};
