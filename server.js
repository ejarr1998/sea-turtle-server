const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: {
    origin: [
      "https://www.seaturtlegame.com",
      "https://seaturtlegame.com",
      "http://localhost:3000",
      "http://localhost:8080",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:8080"
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});
const path = require('path');

// Enable CORS for express routes too
app.use((req, res, next) => {
  const allowedOrigins = [
    "https://www.seaturtlegame.com",
    "https://seaturtlegame.com",
    "http://localhost:3000",
    "http://localhost:8080"
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// NEW: Simple health check route for Railway
app.get('/health', (req, res) => {
  res.status(200).send('OK - Sea Turtle Multiplayer Server alive');
});

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// ... (all your GameRoom class, constants, functions, etc. remain unchanged)
// Paste your entire existing code here between the middleware and the io.on('connection') part
// For brevity I'm not repeating the huge GameRoom / update logic, but keep it exactly as you had it.

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // ... (your existing socket event handlers: findMatch, playerInput, disconnect, etc.)
  // Keep all of this unchanged
});

// NEW: Graceful shutdown handler (helps Railway see clean stops)
process.on('SIGTERM', () => {
  console.log('SIGTERM received - shutting down gracefully');
  http.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
  // Give 5 seconds max for cleanup before forced exit
  setTimeout(() => {
    console.log('Forcing exit after timeout');
    process.exit(1);
  }, 5000);
});

// Start server
const PORT = process.env.PORT || 3000;
http.listen(PORT, '0.0.0.0', () => {
  console.log(`🌊 Sea Turtle Multiplayer Server running on port ${PORT}`);
});
