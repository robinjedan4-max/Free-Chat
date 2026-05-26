import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { join } from 'path';
import { apiLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/error';
import { logger } from './config/logger';

// Routes
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import roomRoutes from './routes/roomRoutes';
import giftRoutes from './routes/giftRoutes';
import messageRoutes from './routes/messageRoutes';
import adminRoutes from './routes/adminRoutes';
import uploadRoutes from './routes/uploadRoutes';
import contactRoutes from './routes/contactRoutes';
import chatRoutes from './routes/chatRoutes';
import inviteRoutes from './routes/inviteRoutes';

const app = express();

// Security and utility Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, _res, next) => {
  logger.http(`${req.method} ${req.url}`);
  next();
});

// Apply API rate limit to all routes
app.use('/api', apiLimiter);

// Serve static files from uploads directory (for local storage fallback)
app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Core API endpoints
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/gifts', giftRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/invite', inviteRoutes);

// Serve client build (if present) and fallback to index.html for client-side routing
// This allows direct navigation to routes like /profile/:id to work in production.
const clientDist = join(process.cwd(), 'client', 'dist');
try {
  // Only register static serving if the client dist folder exists
  // (helps when running server locally during development without a built client)
  // eslint-disable-next-line no-empty
  ;
  app.use(express.static(clientDist));

  // For any non-API GET requests, return the client index.html so React Router can handle the route
  app.get(/^\/(?!api).*/, (_req, res) => {
    res.sendFile(join(clientDist, 'index.html'));
  });
} catch (err) {
  logger.info('Client dist not found; skipping static client serving');
}

// Unmatched API route handling
app.use('/api/*', (req, res) => {
  logger.warn(`Unmatched API endpoint: ${req.method} ${req.url}`);
  res.status(404).json({ success: false, message: 'Resource not found' });
});

// Centralized error handling middleware
app.use(errorHandler);

export default app;
