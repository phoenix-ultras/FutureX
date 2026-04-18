const { Server } = require('socket.io');
const env = require('../config/env');

let io;

function init(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: env.clientOrigin,
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    socket.on('market:subscribe', ({ marketId }) => {
      if (marketId) {
        socket.join(`market:${marketId}`);
      }
    });

    socket.on('market:unsubscribe', ({ marketId }) => {
      if (marketId) {
        socket.leave(`market:${marketId}`);
      }
    });
    
    socket.on('joinMarket', ({ marketId }) => {
      if (marketId) {
        socket.join(`market:${marketId}`);
      }
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
}

module.exports = {
  init,
  getIO
};
