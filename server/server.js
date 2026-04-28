import path from 'path';
import express from 'express';
import { app, server } from './socket/socket.js';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes.js';
import conversationRoutes from './routes/conversation.routes.js';
import messageRoutes from './routes/message.routes.js';
import userRoutes from './routes/user.routes.js';
import connectToMongoDB from './database/connectToMdb.js';

// Load environment variables from .env
dotenv.config();

const PORT_URL = Number(process.env.PORT || 5000);
const __dirname = path.resolve();

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  throw new Error('MONGO_URI is required');
}

connectToMongoDB(MONGO_URI);

// Middleware
app.use(express.json());
app.use(cookieParser());
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});
app.use('/api/auth', authRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/users', userRoutes);

// Serve frontend
app.use(express.static(path.join(__dirname, '/client/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
});

// Start server
server.listen(PORT_URL, () => {
  console.log(`listening on ${PORT_URL} successfully`);
});
