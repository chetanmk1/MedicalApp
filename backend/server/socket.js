import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io;
const userSockets = new Map(); // Map user ID to socket ID

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // Adjust for production
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      credentials: true
    }
  });

  // Middleware for authentication
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_access_secret_99887766');
      socket.user = decoded; // { id, role, clinicId, ... }
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id} (User: ${socket.user.id})`);
    
    // Join a room for the specific user to receive targeted events
    socket.join(`user_${socket.user.id}`);
    
    // If the user belongs to a clinic, join a clinic room
    if (socket.user.clinicId) {
      socket.join(`clinic_${socket.user.clinicId}`);
    }

    userSockets.set(socket.user.id, socket.id);

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      userSockets.delete(socket.user.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io is not initialized');
  }
  return io;
};
