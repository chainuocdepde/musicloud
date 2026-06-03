require('dotenv').config();
const http = require('http');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const app = require('./src/app');
const { setupRoomWebSocket } = require('./src/routes/rooms');

const PORT = process.env.PORT || 3000;

// Create HTTP server
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({
  server,
  noServer: false
});

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // Parse room_id from path: /ws/rooms/{room_id}
  const pathParts = url.pathname.split('/').filter(Boolean);
  if (pathParts[0] !== 'ws' || pathParts[1] !== 'rooms' || !pathParts[2]) {
    ws.close(1008, 'Invalid WebSocket path. Expected: /ws/rooms/{room_id}');
    return;
  }
  const roomId = pathParts[2];

  const token = url.searchParams.get('token');
  if (!token) {
    ws.close(1008, 'Missing token');
    return;
  }

  // Validate JWT token and extract user_id
  let userId;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    userId = decoded.user_id;

    if (!userId) {
      ws.close(1008, 'Invalid token: missing user_id');
      return;
    }
  } catch (error) {
    console.error('❌ JWT validation failed:', error.message);
    ws.close(1008, 'Invalid or expired token');
    return;
  }

  console.log(`✅ WebSocket connected: Room=${roomId}, User=${userId}`);

  setupRoomWebSocket(ws, roomId, userId, server);
});

wss.on('error', (error) => {
  console.error('❌ WebSocket Server Error:', error);
});

// Start server
server.listen(PORT, () => {
  console.log(`🎵 Mini SoundCloud Backend running on port ${PORT}`);
  console.log(`📡 API URL: http://localhost:${PORT}/api`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}/ws/rooms/:room_id`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
});
