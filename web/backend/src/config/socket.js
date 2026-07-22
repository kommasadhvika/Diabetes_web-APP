import { Server } from 'socket.io';

let io;
const userSockets = new Map(); // userId -> socketId

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // Allow all origins for development ease
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Register user room
    socket.on('register', (userId) => {
      if (userId) {
        socket.join(`room:${userId}`);
        userSockets.set(userId, socket.id);
        console.log(`Socket ${socket.id} joined user room: room:${userId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      for (const [uid, sid] of userSockets.entries()) {
        if (sid === socket.id) {
          userSockets.delete(uid);
          break;
        }
      }
    });
  });

  return io;
};

export const getIo = () => {
  return io;
};

export const emitToUser = (userId, event, data) => {
  if (io && userId) {
    io.to(`room:${userId}`).emit(event, data);
    console.log(`[SOCKET EMIT] Sent event '${event}' to room:${userId}`);
  }
};
