// Import necessary modules
import { Server } from 'socket.io';
import http from 'http';
import express from 'express';
import Message from '../models/message.model.js';

const app = express(); // Create an Express application
const socketCorsOrigin = process.env.SOCKET_CORS_ORIGIN || process.env.CLIENT_URL;

// Create an HTTP server using the Express application
const server = http.createServer(app);

// Create a Socket.IO server instance on top of the HTTP server
const io = new Server(server, {
  // Configure CORS policy using runtime environment values
  cors: {
    origin: socketCorsOrigin,
    methods: ['GET', 'POST'],
  },
});
export const getReceiverSocketId = (receiverId) => {
  return userSocketMap[receiverId];
};

const userSocketMap = {};

// Listen for 'connection' event, fires when a client connects
io.on('connection', (socket) => {
  // Log a message when a user connects, along with the socket ID
  console.log('Socket connected: user connected', socket.id);

  // Access userId from the query parameters
  const userId = socket.handshake.query.userId;

  // Store userId and socketId in a map
  if (userId !== 'undefined') {
    userSocketMap[userId] = socket.id;
  }

  // Emit online users to all clients
  io.emit('getOnlineUsers', Object.keys(userSocketMap));

  socket.on('typing_start', ({ conversationId }) => {
    if (conversationId) {
      socket.to(conversationId).emit('typing_state', { userId, isTyping: true });
    }
  });

  socket.on('typing_stop', ({ conversationId }) => {
    if (conversationId) {
      socket.to(conversationId).emit('typing_state', { userId, isTyping: false });
    }
  });

  socket.on('conversation_opened', async ({ conversationId }) => {
    if (!conversationId || userId === 'undefined') return;

    socket.join(conversationId);

    await Message.updateMany(
      {
        conversationId,
        receiverId: userId,
        status: { $ne: 'read' },
      },
      { $set: { status: 'read' } }
    );

    const messages = await Message.find({ conversationId, receiverId: userId }).select('_id senderId status');
    messages.forEach((message) => {
      socket.to(conversationId).emit('message_status', {
        messageId: message._id,
        conversationId,
        status: 'read',
      });
    });
  });

  socket.on('conversation_closed', ({ conversationId }) => {
    if (conversationId) {
      socket.leave(conversationId);
    }
  });

  // Listen for 'disconnect' event, fires when a user disconnects
  socket.on('disconnect', () => {
    // Log a message when a user disconnects, along with the socket ID
    console.log('User disconnected', socket.id);

    // Remove the user from the map when disconnected
    delete userSocketMap[userId];

    // Emit updated online users to all clients
    io.emit('getOnlineUsers', Object.keys(userSocketMap));
  });
});

// Export the Express app, Socket.IO instance, and HTTP server for external use
export { app, io, server };
