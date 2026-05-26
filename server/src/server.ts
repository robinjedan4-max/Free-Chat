import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import { connectDB } from './config/db';
import { logger } from './config/logger';
import { Room } from './models/Room';

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Socket.io with CORS settings
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Socket.io Events Setup
io.on('connection', (socket) => {
  logger.info(`Socket client connected: ${socket.id}`);

  // User joins a live-stream or voice room channel
  socket.on('join_room', async ({ roomId, username }) => {
    socket.join(roomId);
    logger.info(`User ${username} joined socket channel for room ${roomId}`);

    try {
      // Increment viewers count in room
      const room = await Room.findById(roomId);
      if (room) {
        room.viewersCount += 1;
        await room.save();
        
        // Notify other room viewers of user join and updated viewers count
        io.to(roomId).emit('viewer_update', {
          viewersCount: room.viewersCount,
          eventMsg: `${username} joined the chat ✨`,
          username,
        });
      }
    } catch (err: any) {
      logger.error(`Error during room join event: ${err.message}`);
    }
  });

  // User vacates a stream channel
  socket.on('leave_room', async ({ roomId, username }) => {
    socket.leave(roomId);
    logger.info(`User ${username} left socket channel for room ${roomId}`);

    try {
      // Decrement viewers count in room
      const room = await Room.findById(roomId);
      if (room && room.viewersCount > 0) {
        room.viewersCount = Math.max(0, room.viewersCount - 1);
        await room.save();

        io.to(roomId).emit('viewer_update', {
          viewersCount: room.viewersCount,
          eventMsg: `${username} left the chat`,
          username,
        });
      }
    } catch (err: any) {
      logger.error(`Error during room leave event: ${err.message}`);
    }
  });

  // Relays comments in a live room
  socket.on('send_room_msg', (data) => {
    // data: { roomId, message: { sender: { username, avatar, vipLevel }, content, createdAt } }
    io.to(data.roomId).emit('receive_room_msg', data.message);
  });

  // Relays gift transactions (triggers crown/heart visual cascades on all screens)
  socket.on('send_gift_effect', (data) => {
    // data: { roomId, gift: { name, cost, icon, effectClass }, senderUsername, recipientUsername }
    io.to(data.roomId).emit('receive_gift_effect', {
      gift: data.gift,
      senderUsername: data.senderUsername,
      recipientUsername: data.recipientUsername,
    });
  });

  // Triggers peer signals (mock WebRTC triggers or voice speaker notifications)
  socket.on('voice_active', (data) => {
    // data: { roomId, seatIndex, username, isActive }
    socket.to(data.roomId).emit('voice_active_broadcast', data);
  });

  // Disconnection handler
  socket.on('disconnect', () => {
    logger.info(`Socket client disconnected: ${socket.id}`);
  });
});

// Bootstrap Database and Server
const bootstrap = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      logger.info(`AetherGlow Server is running on port ${PORT} in ${process.env.NODE_ENV} environment`);
    });
  } catch (error: any) {
    logger.error(`Server failed to start: ${error.message}`);
    process.exit(1);
  }
};

bootstrap();
