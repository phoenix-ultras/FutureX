
const app = require('./app');
const env = require('./config/env');
const db = require('./config/db');
const { ensureSchema } = require('./services/databaseService');
const fs = require('fs');
const path = require('path');
const socketService = require('./services/socketService');
const settlementEngine = require('./services/settlementEngine');

function startListening(port) {
  const server = app.listen(port, () => {
    console.log(`Backend server running on port ${port}`);
    socketService.init(server);
    settlementEngine.start();
    
    // Automatically configure frontend to connect to the correct backend port
    try {
      const frontendEnvPath = path.resolve(__dirname, '../../frontend/.env');
      fs.writeFileSync(frontendEnvPath, `VITE_API_BASE_URL=http://localhost:${port}\nVITE_SOCKET_URL=http://localhost:${port}\n`);
    } catch (err) {
      console.warn('Could not sync port to frontend .env:', err.message);
    }
  });

  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      console.warn(`Port ${port} is already in use, trying ${port + 1}...`);
      startListening(port + 1);
    } else {
      console.error('Server error', e);
      process.exit(1);
    }
  });
}

async function startServer() {
  try {
    console.log('Backend environment summary', env.getSafeEnvSummary());
    await db.testConnection();
    await ensureSchema();

    startListening(env.port);
  } catch (error) {
    console.error('Failed to start backend server', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    process.exit(1);
  }
}

startServer();
