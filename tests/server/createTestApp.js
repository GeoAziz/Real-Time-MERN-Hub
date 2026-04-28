import express from 'express';
import cookieParser from 'cookie-parser';
import authRoutes from '../../server/routes/auth.routes.js';
import conversationRoutes from '../../server/routes/conversation.routes.js';
import messageRoutes from '../../server/routes/message.routes.js';
import userRoutes from '../../server/routes/user.routes.js';

export const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/auth', authRoutes);
  app.use('/api/conversations', conversationRoutes);
  app.use('/api/messages', messageRoutes);
  app.use('/api/users', userRoutes);
  return app;
};
