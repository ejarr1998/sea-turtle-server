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
  },
  pingTimeout: 60000,      // 60 seconds before considering connection dead
  pingInterval: 25000,     // Send ping every 25 seconds
  transports: ['websocket', 'polling']
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

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.status(200).send('OK - Sea Turtle Multiplayer Server alive');
});

// Player count endpoint
app.get('/player-count', (req, res) => {
  const counts = getPlayerCounts();
  res.json(counts);
});

// Get current player counts across all modes
function getPlayerCounts() {
  let lobbyPlayers = 0;
  let singlePlayers = 0;
  let multiPlayers = 0;
  
  // Count players by activity state
  for (const [socketId, activity] of playerActivities) {
    // Verify socket is still connected
    const socket = io.sockets.sockets.get(socketId);
    if (!socket) {
      playerActivities.delete(socketId);
      continue;
    }
    
    switch (activity.state) {
      case 'lobby':
        lobbyPlayers++;
        break;
      case 'singleplayer':
        singlePlayers++;
        break;
      case 'multiplayer':
        multiPlayers++;
        break;
    }
  }
  
  return {
    total: lobbyPlayers + singlePlayers + multiPlayers,
    lobby: lobbyPlayers,
    singleplayer: singlePlayers,
    multiplayer: multiPlayers
  };
}

// Broadcast player count to all connected clients
function broadcastPlayerCount() {
  const counts = getPlayerCounts();
  io.emit('playerCount', counts);
}

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Game constants - matching client
const GAME_WIDTH = 1000;
const GAME_HEIGHT = 1000;
const TICK_RATE = 60;        // Physics updates per second (internal)
const BROADCAST_RATE = 60;   // Network updates per second (sent to clients)

// Active game rooms
const gameRooms = new Map();
// Matchmaking queue - players waiting for a match
const matchmakingQueue = [];

// Collision radius lookup by character (cached to avoid repeated calculations)
const COLLISION_RADII = {
  turtle: 0.6,
  stingray: 0.7,
  pufferfish: 0.8,
  seal: 0.65,
  sailfish: 0.55,
  seadragon: 0.60,
  penguin: 0.55,
  dolphin: 0.55,
  clownfish: 0.65,
  bluetang: 0.6
};

// Base speeds by character
const BASE_SPEEDS = {
  sailfish: 7,
  seadragon: 6,
  stingray: 5,
  pufferfish: 4,
  turtle: 4,
  seal: 4,
  penguin: 5,
  dolphin: 6,
  clownfish: 4,
  bluetang: 5
};

// Fish colors
const FISH_COLORS = ['#ff6b6b', '#ffd93d', '#6bcf7f', '#4ecdc4', '#95e1d3'];

// Room class to manage game state
class GameRoom {
  constructor(roomId, hostSocketId, difficulty, nightMode) {
    this.roomId = roomId;
    this.hostSocketId = hostSocketId;
    this.difficulty = difficulty || 'medium';
    this.nightMode = nightMode || false;
    this.players = new Map();
    this.fish = [];
    this.sharks = [];
    this.jellyfish = [];
    this.seahorses = [];
    this.octopuses = [];
    this.inkClouds = [];
    this.spawnWarnings = [];
    this.gameStarted = false;
    this.gameLoop = null;
    this.lastUpdateTime = Date.now();
    this.megaSharkActive = false;
    this.megaSharkSpeedBonus = 0;
    
    this.initializeEntities();
  }

  initializeEntities() {
    // Initialize fish (food)
    for (let i = 0; i < 15; i++) {
      this.fish.push(this.createFish());
    }

    // Initialize sharks based on difficulty
    let baseSpeed = 2;
    if (this.difficulty === 'easy') baseSpeed *= 0.75;
    else if (this.difficulty === 'hard') baseSpeed *= 1.25;
    
    if (this.difficulty !== 'freeswim') {
      const side = Math.floor(Math.random() * 4);
      const { x, y } = this.getSpawnPosition(side, 150);
      
      this.sharks.push({
        x, y,
        vx: 0,
        vy: 0,
        speed: baseSpeed,
        size: 65,
        rotation: 0,
        side,
        swimPhase: Math.random() * Math.PI * 2
      });
    }

    // Initialize jellyfish for medium/hard
    const jellyfishCount = this.difficulty === 'hard' ? 3 : 
                           this.difficulty === 'medium' ? 2 : 0;
    
    for (let i = 0; i < jellyfishCount; i++) {
      this.jellyfish.push({
        x: Math.random() * GAME_WIDTH,
        y: GAME_HEIGHT + 100 + (i * 200),
        size: 25 + Math.random() * 15,
        speed: 0.7 + Math.random() * 1.5,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.02 + Math.random() * 0.03,
        tentacles: 5 + Math.floor(Math.random() * 3),
        pulsePhase: Math.random() * Math.PI * 2
      });
    }

    this.spawnSeahorse();
    this.spawnOctopus();
  }

  createFish() {
    return {
      x: Math.random() * GAME_WIDTH,
      y: Math.random() * GAME_HEIGHT,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      size: 14 + Math.random() * 10,
      speed: 1.5 + Math.random() * 2,
      type: Math.floor(Math.random() * 4),
      direction: Math.random() * Math.PI * 2,
      color: FISH_COLORS[Math.floor(Math.random() * FISH_COLORS.length)]
    };
  }

  getSpawnPosition(side, offset) {
    switch (side) {
      case 0: return { x: -offset, y: Math.random() * GAME_HEIGHT };
      case 1: return { x: GAME_WIDTH + offset, y: Math.random() * GAME_HEIGHT };
      case 2: return { x: Math.random() * GAME_WIDTH, y: -offset };
      default: return { x: Math.random() * GAME_WIDTH, y: GAME_HEIGHT + offset };
    }
  }

  spawnSeahorse() {
    if (Math.random() < 0.3) {
      this.seahorses.push({
        x: Math.random() * GAME_WIDTH,
        y: Math.random() * GAME_HEIGHT,
        size: 25,
        bobPhase: Math.random() * Math.PI * 2,
        bobSpeed: 0.05,
        direction: (Math.random() - 0.5) * 0.3,
        speed: 0.3,
        despawnTime: Date.now() + 10000
      });
    }
  }

  spawnOctopus() {
    if (Math.random() < 0.4) {
      this.octopuses.push({
        x: Math.random() * GAME_WIDTH,
        y: Math.random() * GAME_HEIGHT,
        size: 30,
        direction: Math.random() * Math.PI * 2,
        tentaclePhase: Math.random() * Math.PI * 2,
        speed: 0.8 + Math.random() * 0.4,
        despawnTime: Date.now() + 15000
      });
    }
  }

  addPlayer(socketId, character, playerName) {
    const playerCount = this.players.size;
    const spawnX = GAME_WIDTH / 2 + (playerCount === 0 ? -50 : 50);
    const spawnY = GAME_HEIGHT / 2;
    // Set base size by character
    let size = 35;
    if (character === 'seadragon') size = 50;
    else if (character === 'dolphin' || character === 'penguin') size = 40;
    const collisionRadius = size * (COLLISION_RADII[character] || 0.6);
    
    console.log(`✅ Player ${playerName} spawning at center (${Math.round(spawnX)}, ${Math.round(spawnY)})`);
    
    this.players.set(socketId, {
      id: socketId,
      name: playerName || `Player ${this.players.size + 1}`,
      x: spawnX,
      y: spawnY,
      vx: 0,
      vy: 0,
      rotation: 0,
      size,
      collisionRadius, // Cached collision radius
      character: character || 'turtle',
      score: 0,
      alive: true,
      spawnProtection: 120,
      slowMoActive: false,
      slowMoTimer: 0,
      fireBreath: []
    });
  }

  removePlayer(socketId) {
    this.players.delete(socketId);
    
    if (this.players.size === 0) {
      this.stopGame();
      return true;
    }
    return false;
  }

  startGame() {
    if (this.gameStarted) return;
    
    this.gameStarted = true;
    this.gameLoopRunning = false;
    this.lastUpdateTime = Date.now();
    this.gameStartTime = null;
    this.lastSharkSpawnTime = null;
    this.tickCount = 0; // Track ticks for broadcast timing
    
    console.log('⏳ Waiting for countdown...');
    this.countdownTimeout = setTimeout(() => {
      if (!this.gameStarted) {
        console.log('⚠️ Game was stopped during countdown, not starting loop');
        return;
      }
      
      console.log('🎮 Game loop starting!');
      this.gameLoopRunning = true;
      this.gameStartTime = Date.now();
      this.lastSharkSpawnTime = Date.now();
      
      // Physics runs at TICK_RATE (60fps), broadcast at BROADCAST_RATE (30fps)
      this.gameLoop = setInterval(() => {
        this.update();
      }, 1000 / TICK_RATE);
    }, 4000);
  }

  stopGame() {
    console.log('🛑 Stopping game...');
    
    if (this.countdownTimeout) {
      clearTimeout(this.countdownTimeout);
      this.countdownTimeout = null;
    }
    
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
      this.gameLoop = null;
    }
    
    this.gameStarted = false;
    this.gameLoopRunning = false;
  }

  update() {
    if (this.players.size === 0 || !this.gameLoopRunning) return;
    
    const alivePlayers = Array.from(this.players.values()).filter(p => p.alive);
    if (alivePlayers.length === 0) {
      console.log('💀 All players dead - sending final state and stopping game loop');
      // Broadcast final state BEFORE stopping so clients can show game over
      this.broadcastGameState();
      this.stopGame();
      return;
    }
    
    this.lastUpdateTime = Date.now();

    // Update all players
    for (const player of this.players.values()) {
      if (!player.alive) continue;

      player.x += player.vx;
      player.y += player.vy;

      // Wrap around boundaries
      if (player.x < 0) player.x = GAME_WIDTH;
      if (player.x > GAME_WIDTH) player.x = 0;
      if (player.y < 0) player.y = GAME_HEIGHT;
      if (player.y > GAME_HEIGHT) player.y = 0;

      // Apply friction
      player.vx *= 0.95;
      player.vy *= 0.95;

      // Update rotation based on velocity
      if (Math.abs(player.vx) > 0.1 || Math.abs(player.vy) > 0.1) {
        player.rotation = Math.atan2(player.vy, player.vx);
      }

      // Update slow-mo timer
      if (player.slowMoActive) {
        player.slowMoTimer--;
        if (player.slowMoTimer <= 0) {
          player.slowMoActive = false;
        }
      }
      
      // Countdown spawn protection
      if (player.spawnProtection > 0) {
        player.spawnProtection--;
      }
    }

    // Update fish
    for (const f of this.fish) {
      f.x += f.vx;
      f.y += f.vy;
      f.direction = Math.atan2(f.vy, f.vx);

      // Wrap around
      if (f.x < 0) f.x = GAME_WIDTH;
      if (f.x > GAME_WIDTH) f.x = 0;
      if (f.y < 0) f.y = GAME_HEIGHT;
      if (f.y > GAME_HEIGHT) f.y = 0;

      // Random direction changes
      if (Math.random() < 0.02) {
        f.vx = (Math.random() - 0.5) * 2;
        f.vy = (Math.random() - 0.5) * 2;
      }
    }

    // Check fish collisions with players
    this.updateFishCollisions();

    // Update sharks
    if (this.difficulty !== 'freeswim') {
      this.updateSharks();
    }

    // Update jellyfish
    this.updateJellyfish();

    // Update seahorses
    this.updateSeahorses();

    // Update octopuses
    this.updateOctopuses();

    // Update ink clouds
    this.updateInkClouds();

    // Spawn shark every 7 seconds
    if (this.lastSharkSpawnTime && this.difficulty !== 'freeswim' && this.players.size > 0) {
      if (Date.now() - this.lastSharkSpawnTime >= 7000) {
        this.addShark();
        this.lastSharkSpawnTime = Date.now();
        console.log(`🦈 Shark spawned in room ${this.roomId}! Total sharks: ${this.sharks.length}`);
      }
    }

    // Update spawn warnings
    this.updateSpawnWarnings();

    // Broadcast game state at BROADCAST_RATE (every other tick when TICK_RATE=60, BROADCAST_RATE=30)
    this.tickCount++;
    if (this.tickCount % (TICK_RATE / BROADCAST_RATE) === 0) {
      this.broadcastGameState();
    }
  }

  updateFishCollisions() {
    const fishToSpawn = [];
    
    for (const player of this.players.values()) {
      if (!player.alive) continue;

      this.fish = this.fish.filter(f => {
        const dx = player.x - f.x;
        const dy = player.y - f.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < player.collisionRadius + f.size) {
          player.score += 10;
          
          const playerSocket = io.sockets.sockets.get(player.id);
          if (playerSocket) {
            playerSocket.emit('fishEaten', { score: player.score });
          }
          
          fishToSpawn.push(this.createFish());
          return false;
        }
        return true;
      });
    }
    
    for (const f of fishToSpawn) {
      this.fish.push(f);
    }
  }

  updateSharks() {
    for (const shark of this.sharks) {
      // Handle sharks swimming off screen
      if (shark.swimOffScreen) {
        shark.rotation = shark.escapeAngle;
        shark.x += Math.cos(shark.rotation) * shark.speed * 2;
        shark.y += Math.sin(shark.rotation) * shark.speed * 2;
        continue;
      }
      
      // Update confusion timer
      if (shark.confused) {
        shark.confusionTimer = (shark.confusionTimer || 0) - 1;
        if (shark.confusionTimer <= 0) {
          shark.confused = false;
        }
      }
      
      // Confused sharks wander randomly
      if (shark.confused) {
        shark.x += Math.cos(shark.rotation) * (shark.speed * 0.3);
        shark.y += Math.sin(shark.rotation) * (shark.speed * 0.3);
        
        if (Math.random() < 0.05) {
          shark.rotation += (Math.random() - 0.5) * Math.PI;
        }
        
        shark.x = Math.max(shark.size, Math.min(GAME_WIDTH - shark.size, shark.x));
        shark.y = Math.max(shark.size, Math.min(GAME_HEIGHT - shark.size, shark.y));
        continue;
      }
      
      // Find nearest alive player
      let nearestPlayer = null;
      let nearestDist = Infinity;
      
      for (const player of this.players.values()) {
        if (!player.alive) continue;
        const dx = player.x - shark.x;
        const dy = player.y - shark.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestPlayer = player;
        }
      }

      if (nearestPlayer) {
        const dx = nearestPlayer.x - shark.x;
        const dy = nearestPlayer.y - shark.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        let effectiveSpeed = shark.speed;
        if (shark.isMegaShark && this.megaSharkActive) {
          effectiveSpeed += this.megaSharkSpeedBonus;
        }
        if (nearestPlayer.slowMoActive) {
          effectiveSpeed *= 0.3;
        }

        if (dist > 0) {
          shark.vx = (dx / dist) * effectiveSpeed;
          shark.vy = (dy / dist) * effectiveSpeed;
          shark.rotation = Math.atan2(dy, dx);
        }

        shark.x += shark.vx;
        shark.y += shark.vy;

        shark.x = Math.max(shark.size, Math.min(GAME_WIDTH - shark.size, shark.x));
        shark.y = Math.max(shark.size, Math.min(GAME_HEIGHT - shark.size, shark.y));

        // Check collision using UPDATED position (only if shark is on screen)
        const sharkOnScreen = shark.x > -shark.size && shark.x < GAME_WIDTH + shark.size && 
                              shark.y > -shark.size && shark.y < GAME_HEIGHT + shark.size;
        if (!sharkOnScreen) continue;
        
        const newDx = nearestPlayer.x - shark.x;
        const newDy = nearestPlayer.y - shark.y;
        const newDist = Math.sqrt(newDx * newDx + newDy * newDy);
        
        // Match single player hitbox logic:
        // Calculate angle from shark to player
        const angleToPlayer = Math.atan2(newDy, newDx);
        // Normalize angle difference to -PI to PI
        let angleDiff = angleToPlayer - shark.rotation;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        // Adjust hitbox based on direction (same as single player)
        // Front (head): Smaller hitbox (40% instead of 60%)
        // Sides/Back: Normal hitbox (60%)
        let hitboxMultiplier = 0.6; // Default (sides/back)
        if (Math.abs(angleDiff) < Math.PI / 3) {
          // Player is in front of shark (within 60 degrees) - smaller hitbox
          hitboxMultiplier = 0.4;
        }
        
        const sharkHitboxRadius = shark.size * hitboxMultiplier;
        
        if (newDist < sharkHitboxRadius + nearestPlayer.collisionRadius && !nearestPlayer.spawnProtection) {
          console.log(`🦈 SHARK KILLED ${nearestPlayer.name}`);
          nearestPlayer.alive = false;
        }
      }
    }
  }

  updateJellyfish() {
    for (let i = 0; i < this.jellyfish.length; i++) {
      const jelly = this.jellyfish[i];
      
      jelly.y -= jelly.speed;
      jelly.wobble += jelly.wobbleSpeed || 0.025;
      jelly.x += Math.sin(jelly.wobble) * 0.5;
      jelly.pulsePhase += 0.05;
      
      // Respawn at bottom when reaching top
      if (jelly.y < -80) {
        this.jellyfish[i] = {
          x: Math.random() * GAME_WIDTH,
          y: GAME_HEIGHT + 100,
          size: 25 + Math.random() * 15,
          speed: 0.7 + Math.random() * 1.5,
          wobble: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.02 + Math.random() * 0.03,
          tentacles: 5 + Math.floor(Math.random() * 3),
          pulsePhase: Math.random() * Math.PI * 2
        };
        continue;
      }

      // Check collision with players (only if jellyfish is on screen)
      const jellyOnScreen = jelly.x > 0 && jelly.x < GAME_WIDTH && jelly.y > 0 && jelly.y < GAME_HEIGHT;
      if (!jellyOnScreen) continue;
      
      for (const player of this.players.values()) {
        if (!player.alive || player.spawnProtection) continue;
        const dx = player.x - jelly.x;
        const dy = player.y - jelly.y;
        
        // Match single player: Use elliptical hitbox - jellyfish is taller than wide
        // Horizontal (x): Normal hitbox (30%)
        // Vertical (y): Much smaller, especially from top (20%)
        const hitboxX = jelly.size * 0.3;  // Horizontal radius
        const hitboxY = jelly.size * 0.2;  // Vertical radius (smaller!)
        
        // Ellipse collision detection (same as single player)
        const normalizedX = dx / (player.collisionRadius + hitboxX);
        const normalizedY = dy / (player.collisionRadius + hitboxY);
        const ellipseDistance = Math.sqrt(normalizedX * normalizedX + normalizedY * normalizedY);
        
        // If player is above jellyfish, make hitbox even smaller (same as single player)
        let threshold = 1.0;
        if (dy < 0) {
          // Player is above jellyfish (approaching from top)
          // Make it even more forgiving - only the very center of the bell
          threshold = 0.7; // 30% more forgiving from top
        }
        
        if (ellipseDistance < threshold) {
          console.log(`🎐 JELLYFISH KILLED ${player.name}`);
          player.alive = false;
        }
      }
    }
  }

  updateSeahorses() {
    for (const seahorse of this.seahorses) {
      seahorse.bobPhase += seahorse.bobSpeed || 0.05;
    }
    
    this.seahorses = this.seahorses.filter(seahorse => {
      if (Date.now() > seahorse.despawnTime) return false;

      // Only allow collection if seahorse is on screen
      const seahorseOnScreen = seahorse.x > 0 && seahorse.x < GAME_WIDTH && 
                               seahorse.y > 0 && seahorse.y < GAME_HEIGHT;
      if (!seahorseOnScreen) return true;

      for (const player of this.players.values()) {
        if (!player.alive) continue;
        const dx = player.x - seahorse.x;
        const dy = player.y - seahorse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < player.collisionRadius + seahorse.size) {
          player.slowMoActive = true;
          player.slowMoTimer = 120;
          player.score += 50;
          
          const playerSocket = io.sockets.sockets.get(player.id);
          if (playerSocket) {
            playerSocket.emit('seahorseCollected');
          }
          return false;
        }
      }
      return true;
    });

    if (this.seahorses.length === 0 && Math.random() < 0.01) {
      this.spawnSeahorse();
    }
  }

  updateOctopuses() {
    for (const octopus of this.octopuses) {
      octopus.tentaclePhase += 0.08;
      octopus.x += Math.cos(octopus.direction) * (octopus.speed || 0.8);
      octopus.y += Math.sin(octopus.direction) * (octopus.speed || 0.8);
      
      // Wrap around
      if (octopus.x < 0) octopus.x = GAME_WIDTH;
      if (octopus.x > GAME_WIDTH) octopus.x = 0;
      if (octopus.y < 0) octopus.y = GAME_HEIGHT;
      if (octopus.y > GAME_HEIGHT) octopus.y = 0;
      
      if (Math.random() < 0.01) {
        octopus.direction += (Math.random() - 0.5) * 0.5;
      }
    }
    
    this.octopuses = this.octopuses.filter(octopus => {
      if (Date.now() > octopus.despawnTime) return false;

      // Only allow collection if octopus is on screen
      const octopusOnScreen = octopus.x > 0 && octopus.x < GAME_WIDTH && 
                              octopus.y > 0 && octopus.y < GAME_HEIGHT;
      if (!octopusOnScreen) return true;

      for (const player of this.players.values()) {
        if (!player.alive) continue;
        const dx = player.x - octopus.x;
        const dy = player.y - octopus.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < player.collisionRadius + octopus.size) {
          this.inkClouds.push({
            x: octopus.x,
            y: octopus.y,
            size: 100,
            opacity: 1,
            duration: 180,
            affectedSharks: new Set()
          });
          
          player.score += 25;
          
          const playerSocket = io.sockets.sockets.get(player.id);
          if (playerSocket) {
            playerSocket.emit('octopusCollected');
          }
          return false;
        }
      }
      return true;
    });

    if (this.octopuses.length === 0 && Math.random() < 0.005) {
      this.spawnOctopus();
    }
  }

  updateInkClouds() {
    this.inkClouds = this.inkClouds.filter(ink => {
      ink.duration--;
      ink.opacity = ink.duration / 180;
      
      // Check if sharks touch the ink
      for (const shark of this.sharks) {
        if (ink.affectedSharks && ink.affectedSharks.has(shark)) continue;
        
        const dx = shark.x - ink.x;
        const dy = shark.y - ink.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < ink.size) {
          shark.confused = true;
          shark.confusionTimer = 120;
          if (ink.affectedSharks) {
            ink.affectedSharks.add(shark);
          }
        }
      }

      return ink.duration > 0;
    });
  }

  updateSpawnWarnings() {
    for (let i = this.spawnWarnings.length - 1; i >= 0; i--) {
      const w = this.spawnWarnings[i];
      w.flashTime++;
      
      if (w.flashTime < 20) {
        w.opacity = w.flashTime / 20;
      } else {
        w.opacity = 0.3 + Math.sin(w.flashTime * 0.15) * 0.2;
      }
      
      w.duration--;
      if (w.duration <= 0) {
        this.spawnWarnings.splice(i, 1);
      }
    }
  }

  addShark() {
    let baseSpeed = 2 + this.sharks.length * 0.25;
    
    if (this.difficulty === 'easy') baseSpeed *= 0.75;
    else if (this.difficulty === 'hard') baseSpeed *= 1.25;
    else if (this.difficulty === 'freeswim') baseSpeed *= 0.8;
    
    const side = Math.floor(Math.random() * 4);
    const { x, y } = this.getSpawnPosition(side, 150);
    const position = (side === 0 || side === 1) ? y : x;
    
    this.spawnWarnings.push({
      side,
      position,
      opacity: 0,
      flashTime: 0,
      duration: 60
    });
    
    setTimeout(() => {
      if (!this.gameLoopRunning) return;
      
      // Check if we should activate mega shark
      if (this.sharks.length === 9 && !this.megaSharkActive) {
        this.activateMegaShark();
        return;
      }
      
      // If mega shark is active, increase its speed bonus but ALSO spawn more sharks
      if (this.megaSharkActive) {
        this.megaSharkSpeedBonus += 0.5;
        console.log(`🦈 Mega shark getting faster! Speed bonus: ${this.megaSharkSpeedBonus}`);
        // Don't return - continue to spawn additional sharks!
      }
      
      this.sharks.push({
        x, y,
        vx: 0,
        vy: 0,
        speed: baseSpeed,
        size: 65,
        rotation: 0,
        side,
        swimPhase: Math.random() * Math.PI * 2
      });
      console.log(`🦈 Shark added! Total sharks now: ${this.sharks.length}`);
    }, 1000);
  }
  
  activateMegaShark() {
    console.log('🦈🦈🦈 MEGA SHARK MODE ACTIVATED!');
    this.megaSharkActive = true;
    
    // Make all regular sharks swim off screen
    for (const shark of this.sharks) {
      shark.swimOffScreen = true;
      const centerX = GAME_WIDTH / 2;
      const centerY = GAME_HEIGHT / 2;
      shark.escapeAngle = Math.atan2(shark.y - centerY, shark.x - centerX);
    }
    
    setTimeout(() => {
      if (!this.gameLoopRunning) return;
      
      this.sharks = [];
      
      let baseSpeed = 3.5 + this.megaSharkSpeedBonus;
      if (this.difficulty === 'easy') baseSpeed *= 0.75;
      else if (this.difficulty === 'hard') baseSpeed *= 1.25;
      
      const megaSide = Math.floor(Math.random() * 4);
      const { x, y } = this.getSpawnPosition(megaSide, 200);
      
      this.sharks.push({
        x, y,
        vx: 0,
        vy: 0,
        speed: baseSpeed,
        size: 195,
        rotation: 0,
        side: megaSide,
        swimPhase: Math.random() * Math.PI * 2,
        isMegaShark: true
      });
      
      console.log('🦈 MEGA SHARK SPAWNED!');
    }, 1500);
  }

  handlePlayerInput(socketId, input) {
    const player = this.players.get(socketId);
    if (!player || !player.alive) return;

    const baseSpeed = BASE_SPEEDS[player.character] || 4;
    
    // Dynamic speed scaling after 7 sharks
    let currentSpeed = baseSpeed;
    if (this.sharks.length > 7) {
      const bonus = player.character === 'seadragon' ? 0.3 : 0.25;
      currentSpeed += (this.sharks.length - 7) * bonus;
    }

    // Apply input
    if (input.left) player.vx -= currentSpeed * 0.2;
    if (input.right) player.vx += currentSpeed * 0.2;
    
    // Pufferfish gets boosted vertical input (2x up, 1.25x down)
    let verticalMultiplier = 1;
    if (player.character === 'pufferfish') {
      if (input.up) verticalMultiplier = 2;
      else if (input.down) verticalMultiplier = 1.25;
    }
    
    if (input.up) player.vy -= currentSpeed * 0.2 * verticalMultiplier;
    if (input.down) player.vy += currentSpeed * 0.2 * verticalMultiplier;

    // Joystick input
    if (input.joystick) {
      player.vx += input.joystick.x * currentSpeed * 0.15;
      // Apply pufferfish multiplier to joystick vertical input
      let joystickVerticalMult = 1;
      if (player.character === 'pufferfish') {
        if (input.joystick.y < 0) joystickVerticalMult = 2;
        else if (input.joystick.y > 0) joystickVerticalMult = 1.25;
      }
      player.vy += input.joystick.y * currentSpeed * 0.15 * joystickVerticalMult;
    }

    // Cap speed (but allow pufferfish higher vertical cap)
    const currentVelocity = Math.sqrt(player.vx * player.vx + player.vy * player.vy);
    const maxSpeed = player.character === 'pufferfish' ? currentSpeed * 2 : currentSpeed;
    if (currentVelocity > maxSpeed) {
      player.vx = (player.vx / currentVelocity) * maxSpeed;
      player.vy = (player.vy / currentVelocity) * maxSpeed;
    }
  }

  broadcastGameState() {
    const gameState = {
      players: Array.from(this.players.values()).map(p => ({
        id: p.id,
        name: p.name,
        x: Math.round(p.x),
        y: Math.round(p.y),
        rotation: Math.round(p.rotation * 100) / 100,
        size: p.size,
        character: p.character,
        score: p.score,
        alive: p.alive,
        slowMoActive: p.slowMoActive
      })),
      fish: this.fish.map(f => ({
        x: Math.round(f.x),
        y: Math.round(f.y),
        size: f.size,
        type: f.type,
        direction: f.direction || Math.atan2(f.vy, f.vx),
        color: f.color,
        speed: f.speed
      })),
      sharks: this.sharks.map(s => ({
        x: Math.round(s.x),
        y: Math.round(s.y),
        rotation: Math.round(s.rotation * 100) / 100,
        size: s.size,
        swimPhase: s.swimPhase || 0,
        isMegaShark: s.isMegaShark || false,
        confused: s.confused || false
      })),
      jellyfish: this.jellyfish.map(j => ({
        x: Math.round(j.x),
        y: Math.round(j.y),
        size: j.size,
        speed: j.speed,
        wobble: j.wobble,
        wobbleSpeed: j.wobbleSpeed,
        tentacles: j.tentacles,
        pulsePhase: Math.round(j.pulsePhase * 100) / 100
      })),
      seahorses: this.seahorses.map(s => ({
        x: Math.round(s.x),
        y: Math.round(s.y),
        size: s.size,
        bobPhase: s.bobPhase,
        bobSpeed: s.bobSpeed,
        direction: s.direction,
        speed: s.speed
      })),
      octopuses: this.octopuses.map(o => ({
        x: Math.round(o.x),
        y: Math.round(o.y),
        size: o.size,
        direction: o.direction,
        tentaclePhase: o.tentaclePhase,
        speed: o.speed
      })),
      inkClouds: this.inkClouds.map(i => ({
        x: Math.round(i.x),
        y: Math.round(i.y),
        size: i.size,
        opacity: Math.round(i.opacity * 100) / 100
      })),
      spawnWarnings: this.spawnWarnings.map(w => ({
        side: w.side,
        position: Math.round(w.position),
        opacity: Math.round(w.opacity * 100) / 100
      })),
      megaSharkActive: this.megaSharkActive,
      serverTime: Date.now() // Timestamp for client interpolation
    };

    io.to(this.roomId).emit('gameState', gameState);
  }
}

// Generate random room code
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Track player activity states (for accurate online count)
const playerActivities = new Map(); // socketId -> { state: 'lobby' | 'singleplayer' | 'multiplayer', timestamp }

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);
  
  // Default to lobby state when connected
  playerActivities.set(socket.id, { state: 'lobby', timestamp: Date.now() });
  
  // Send current player count to newly connected client
  setTimeout(() => broadcastPlayerCount(), 100);
  
  // Track player activity state changes
  socket.on('setActivity', (data) => {
    const validStates = ['lobby', 'singleplayer', 'multiplayer'];
    if (data && validStates.includes(data.state)) {
      playerActivities.set(socket.id, { state: data.state, timestamp: Date.now() });
      broadcastPlayerCount();
    }
  });

  // Auto-matchmaking system
  socket.on('findMatch', (data) => {
    console.log(`🔍 Player ${socket.id} looking for match`);
    console.log(`   Character: ${data.character}, Name: ${data.playerName}`);
    
    const nightMode = Math.random() < 0.5;
    const difficulty = 'medium';
    
    matchmakingQueue.push({
      socketId: socket.id,
      character: data.character,
      playerName: data.playerName,
      nightMode
    });
    
    console.log(`📊 Queue size: ${matchmakingQueue.length}`);
    broadcastPlayerCount(); // Update count when someone joins queue
    
    if (matchmakingQueue.length >= 2) {
      console.log('✅ 2 players in queue! Creating match...');
      
      const player1 = matchmakingQueue.shift();
      const player2 = matchmakingQueue.shift();
      
      const socket1 = io.sockets.sockets.get(player1.socketId);
      const socket2 = io.sockets.sockets.get(player2.socketId);
      
      // If either socket disconnected, put the remaining player back
      if (!socket1 || !socket2) {
        console.log('⚠️ One player disconnected during matchmaking!');
        if (socket1) {
          matchmakingQueue.unshift(player1);
          socket1.emit('waitingForMatch', { queuePosition: 1 });
        }
        if (socket2) {
          matchmakingQueue.unshift(player2);
          socket2.emit('waitingForMatch', { queuePosition: 1 });
        }
        return;
      }
      
      const roomId = generateRoomCode();
      console.log(`🎮 Creating room: ${roomId}`);
      
      const room = new GameRoom(roomId, player1.socketId, difficulty, player1.nightMode);
      gameRooms.set(roomId, room);
      
      // Add player 1
      socket1.join(roomId);
      socket1.roomId = roomId;
      room.addPlayer(player1.socketId, player1.character, player1.playerName);
      socket1.emit('matchFound', {
        roomId,
        playerId: player1.socketId,
        nightMode: room.nightMode
      });
      
      // Add player 2
      socket2.join(roomId);
      socket2.roomId = roomId;
      room.addPlayer(player2.socketId, player2.character, player2.playerName);
      socket2.emit('matchFound', {
        roomId,
        playerId: player2.socketId,
        nightMode: room.nightMode
      });
      
      console.log(`🏁 Match created: ${roomId} with ${room.players.size} players`);
      
      if (room.players.size === 2) {
        room.startGame();
        io.to(roomId).emit('gameStarted', { nightMode: room.nightMode });
        console.log(`🎮 Game started in room ${roomId}`);
      } else {
        console.log(`⚠️ Room only has ${room.players.size} players, not starting`);
        gameRooms.delete(roomId);
      }
    } else {
      console.log(`⏳ Waiting for more players...`);
      socket.emit('waitingForMatch', { queuePosition: matchmakingQueue.length });
    }
  });

  // Player input
  socket.on('playerInput', (input) => {
    if (!socket.roomId) return;
    
    const room = gameRooms.get(socket.roomId);
    if (!room || !room.gameStarted || !room.gameLoopRunning) return;
    
    room.handlePlayerInput(socket.id, input);
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    
    // Remove from activity tracking
    playerActivities.delete(socket.id);
    
    // Remove from matchmaking queue
    const queueIndex = matchmakingQueue.findIndex(p => p.socketId === socket.id);
    if (queueIndex !== -1) {
      matchmakingQueue.splice(queueIndex, 1);
      console.log(`🚪 Removed from queue. Queue size: ${matchmakingQueue.length}`);
    }
    
    if (socket.roomId) {
      const room = gameRooms.get(socket.roomId);
      if (room) {
        const shouldDelete = room.removePlayer(socket.id);
        
        io.to(socket.roomId).emit('playerLeft', {
          playerId: socket.id,
          playerCount: room.players.size
        });

        if (shouldDelete) {
          gameRooms.delete(socket.roomId);
          console.log(`🗑️ Room ${socket.roomId} deleted (empty)`);
        }
      }
    }
    
    // Broadcast updated player count
    broadcastPlayerCount();
  });
});

// ============================================
// FISH TANK - Social Multiplayer Mode
// ============================================

const FISHTANK_CONFIG = {
  MAX_PLAYERS_PER_TANK: 10,
  ZONE_WIDTH: 1200,
  ZONE_HEIGHT: 800,
  FISH_PER_ZONE: 5, // Reduced for cleaner look
  FISH_RESPAWN_TIME: 8000, // 8 seconds
  TICK_RATE: 10 // Updates per second (reduced from 20 for smoother client-side prediction)
};

const ZONES = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
const FT_FISH_COLORS = ['#ff6b6b', '#ffd93d', '#6bcf7f', '#4ecdc4', '#95e1d3', '#ff8c42', '#a29bfe', '#fd79a8'];

// Fish Tank storage
const fishTanks = new Map(); // tankId -> FishTank instance
let nextTankId = 1;

class FishTank {
  constructor(id) {
    this.id = id;
    this.players = new Map(); // odId -> player data
    this.zones = {
      'top-left': { fish: [], players: new Set() },
      'top-right': { fish: [], players: new Set() },
      'bottom-left': { fish: [], players: new Set() },
      'bottom-right': { fish: [], players: new Set() }
    };
    this.updateInterval = null;
    
    // Tag mode state
    this.tagMode = {
      active: false,
      taggerId: null,
      lastTagTime: 0,
      tagCooldown: 2000, // 2 seconds before you can tag back
      scores: new Map(), // odId -> seconds survived
      participants: new Set() // Players actively participating in tag
    };
    
    // Initialize fish for each zone
    ZONES.forEach(zone => {
      this.spawnInitialFish(zone);
    });
    
    console.log(`🐠 Fish Tank ${id} created`);
  }
  
  spawnInitialFish(zone) {
    for (let i = 0; i < FISHTANK_CONFIG.FISH_PER_ZONE; i++) {
      this.spawnFish(zone);
    }
  }
  
  spawnFish(zone) {
    const fish = {
      id: `fish-${zone}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      x: 100 + Math.random() * (FISHTANK_CONFIG.ZONE_WIDTH - 200),
      y: 100 + Math.random() * (FISHTANK_CONFIG.ZONE_HEIGHT - 200),
      size: 12 + Math.random() * 10,
      color: FT_FISH_COLORS[Math.floor(Math.random() * FT_FISH_COLORS.length)],
      direction: Math.random() * Math.PI * 2,
      speed: 0.5 + Math.random() * 1,
      turnTimer: 0
    };
    this.zones[zone].fish.push(fish);
    return fish;
  }
  
  addPlayer(socketId, playerData) {
    const startZone = 'top-left'; // Everyone starts in Filter Corner
    const player = {
      id: socketId,
      name: playerData.playerName || 'Player',
      character: playerData.character || 'turtle',
      zone: startZone,
      x: FISHTANK_CONFIG.ZONE_WIDTH / 2,
      y: FISHTANK_CONFIG.ZONE_HEIGHT / 2,
      vx: 0,
      vy: 0,
      rotation: 0,
      isIt: false,
      tagImmunityUntil: 0, // Timestamp when immunity ends
      survivalTime: 0 // Seconds survived without being tagged
    };
    
    this.players.set(socketId, player);
    this.zones[startZone].players.add(socketId);
    
    // Initialize tag score
    this.tagMode.scores.set(socketId, 0);
    
    console.log(`🐠 Player ${player.name} joined Tank ${this.id} (${this.players.size} players)`);
    
    // Start update loop if this is the first player
    if (this.players.size === 1) {
      this.startUpdateLoop();
    }
    
    // If tag mode is active and this is the second player, they could be "it"
    if (this.tagMode.active && !this.tagMode.taggerId) {
      this.selectRandomTagger();
    }
    
    return player;
  }
  
  removePlayer(socketId) {
    const player = this.players.get(socketId);
    if (player) {
      this.zones[player.zone].players.delete(socketId);
      this.players.delete(socketId);
      console.log(`🐠 Player left Tank ${this.id} (${this.players.size} players remaining)`);
      
      // Stop update loop if empty
      if (this.players.size === 0) {
        this.stopUpdateLoop();
      }
    }
    return this.players.size;
  }
  
  updatePlayerInput(socketId, input) {
    const player = this.players.get(socketId);
    if (!player) return;
    
    // Update position from client (client-authoritative for smooth movement)
    player.x = input.x;
    player.y = input.y;
    player.vx = input.vx;
    player.vy = input.vy;
    player.rotation = input.rotation;
    
    // Handle zone change
    if (input.zone && input.zone !== player.zone && ZONES.includes(input.zone)) {
      this.zones[player.zone].players.delete(socketId);
      player.zone = input.zone;
      this.zones[input.zone].players.add(socketId);
      
      // Notify others in both zones
      this.broadcastToZone(player.zone, 'playerEnteredZone', {
        playerId: socketId,
        player: this.getPlayerData(player)
      });
    }
  }
  
  handleFishEaten(socketId, fishId) {
    const player = this.players.get(socketId);
    if (!player) return false;
    
    const zone = this.zones[player.zone];
    const fishIndex = zone.fish.findIndex(f => f.id === fishId);
    
    if (fishIndex !== -1) {
      zone.fish.splice(fishIndex, 1);
      
      // Respawn fish after delay
      setTimeout(() => {
        if (this.zones[player.zone]) {
          this.spawnFish(player.zone);
        }
      }, FISHTANK_CONFIG.FISH_RESPAWN_TIME);
      
      return true;
    }
    return false;
  }
  
  handleEmote(socketId, emoteData) {
    const player = this.players.get(socketId);
    if (!player) return;
    
    // Broadcast emote to all players in the same zone
    this.broadcastToZone(player.zone, 'emote', {
      playerId: socketId,
      emote: emoteData.emote,
      x: player.x,
      y: player.y
    });
  }
  
  startUpdateLoop() {
    if (this.updateInterval) return;
    
    this.updateInterval = setInterval(() => {
      this.update();
    }, 1000 / FISHTANK_CONFIG.TICK_RATE);
    
    console.log(`🐠 Tank ${this.id} update loop started`);
  }
  
  stopUpdateLoop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      console.log(`🐠 Tank ${this.id} update loop stopped`);
    }
  }
  
  update() {
    // Update tag mode
    if (this.tagMode.active) {
      this.checkTagCollisions();
      this.updateTagSurvivalTimes();
    }
    
    // Update fish in each zone
    ZONES.forEach(zoneName => {
      const zone = this.zones[zoneName];
      
      zone.fish.forEach(fish => {
        // Move fish
        fish.x += Math.cos(fish.direction) * fish.speed;
        fish.y += Math.sin(fish.direction) * fish.speed;
        
        // Random turning
        fish.turnTimer--;
        if (fish.turnTimer <= 0) {
          fish.direction += (Math.random() - 0.5) * 1;
          fish.turnTimer = 30 + Math.random() * 60;
        }
        
        // Bounce off walls (stay in zone)
        const margin = 50;
        if (fish.x < margin || fish.x > FISHTANK_CONFIG.ZONE_WIDTH - margin) {
          fish.direction = Math.PI - fish.direction;
          fish.x = Math.max(margin, Math.min(FISHTANK_CONFIG.ZONE_WIDTH - margin, fish.x));
        }
        if (fish.y < margin || fish.y > FISHTANK_CONFIG.ZONE_HEIGHT - margin) {
          fish.direction = -fish.direction;
          fish.y = Math.max(margin, Math.min(FISHTANK_CONFIG.ZONE_HEIGHT - margin, fish.y));
        }
      });
      
      // Broadcast state to players in this zone (include tag mode info)
      if (zone.players.size > 0) {
        const state = this.getZoneState(zoneName);
        state.tagMode = {
          active: this.tagMode.active,
          taggerId: this.tagMode.taggerId
        };
        zone.players.forEach(playerId => {
          const socket = io.sockets.sockets.get(playerId);
          if (socket) {
            socket.emit('tankState', state);
          }
        });
      }
    });
  }
  
  getZoneState(zoneName) {
    const zone = this.zones[zoneName];
    const players = [];
    
    zone.players.forEach(playerId => {
      const player = this.players.get(playerId);
      if (player) {
        players.push(this.getPlayerData(player));
      }
    });
    
    return {
      zone: zoneName,
      players: players,
      totalPlayers: this.players.size, // Total players in entire tank
      fish: zone.fish.map(f => ({
        id: f.id,
        x: Math.round(f.x),
        y: Math.round(f.y),
        size: f.size,
        color: f.color,
        direction: f.direction
      }))
    };
  }
  
  getPlayerData(player) {
    return {
      id: player.id,
      name: player.name,
      character: player.character,
      x: Math.round(player.x),
      y: Math.round(player.y),
      rotation: player.rotation,
      zone: player.zone,
      isIt: player.isIt || false,
      tagImmune: Date.now() < (player.tagImmunityUntil || 0),
      survivalTime: player.survivalTime || 0,
      hidden: player.hidden || false
    };
  }
  
  // Tag mode methods
  startTagMode() {
    if (this.players.size < 2) {
      return { success: false, message: 'Need at least 2 players for tag!' };
    }
    
    this.tagMode.active = true;
    this.tagMode.lastTagTime = Date.now();
    this.tagMode.participants.clear();
    
    // Reset all players and add them as participants
    this.players.forEach((player, id) => {
      player.isIt = false;
      player.tagImmunityUntil = 0;
      player.survivalTime = 0;
      player.playingTag = true;
      this.tagMode.participants.add(id);
    });
    this.tagMode.scores.clear();
    this.players.forEach((_, id) => this.tagMode.scores.set(id, 0));
    
    // Select random tagger from participants
    this.selectRandomTagger();
    
    // Broadcast tag mode started
    this.broadcastToAll('tagModeStarted', {
      taggerId: this.tagMode.taggerId,
      taggerName: this.players.get(this.tagMode.taggerId)?.name,
      participantCount: this.tagMode.participants.size
    });
    
    console.log(`🏷️ Tag mode started in Tank ${this.id}!`);
    return { success: true };
  }
  
  // Player opts out of tag mode
  leaveTagMode(playerId) {
    if (!this.tagMode.active) {
      return { success: false, message: 'Tag mode is not active' };
    }
    
    const player = this.players.get(playerId);
    if (!player) return { success: false };
    
    // Remove from participants
    this.tagMode.participants.delete(playerId);
    player.playingTag = false;
    player.isIt = false;
    
    // Notify everyone this player left tag mode
    this.broadcastToAll('playerLeftTag', {
      playerId: playerId,
      playerName: player.name,
      participantCount: this.tagMode.participants.size
    });
    
    // If they were the tagger, select a new one
    if (this.tagMode.taggerId === playerId) {
      if (this.tagMode.participants.size > 0) {
        this.selectRandomTagger();
        const newTagger = this.players.get(this.tagMode.taggerId);
        this.broadcastToAll('newTagger', {
          taggerId: this.tagMode.taggerId,
          taggerName: newTagger?.name
        });
      }
    }
    
    // If less than 2 participants, end tag mode for everyone
    if (this.tagMode.participants.size < 2) {
      this.endTagModeForAll();
    }
    
    console.log(`🏷️ ${player.name} left tag mode in Tank ${this.id}`);
    return { success: true };
  }
  
  endTagModeForAll() {
    this.tagMode.active = false;
    
    // Clear tagger status
    if (this.tagMode.taggerId) {
      const tagger = this.players.get(this.tagMode.taggerId);
      if (tagger) tagger.isIt = false;
    }
    this.tagMode.taggerId = null;
    
    // Clear all players' tag status
    this.players.forEach(player => {
      player.playingTag = false;
      player.isIt = false;
    });
    
    // Get final scores from participants only
    const scores = [];
    this.tagMode.participants.forEach(id => {
      const player = this.players.get(id);
      if (player) {
        scores.push({
          id: id,
          name: player.name,
          survivalTime: player.survivalTime || 0
        });
      }
    });
    scores.sort((a, b) => b.survivalTime - a.survivalTime);
    
    this.tagMode.participants.clear();
    
    // Broadcast tag mode ended
    this.broadcastToAll('tagModeEnded', { scores });
    
    console.log(`🏷️ Tag mode ended in Tank ${this.id}`);
    return { success: true, scores };
  }
  
  // Keep stopTagMode for backwards compatibility but make it call endTagModeForAll
  stopTagMode() {
    return this.endTagModeForAll();
  }
  
  selectRandomTagger() {
    const participantIds = Array.from(this.tagMode.participants);
    if (participantIds.length === 0) return;
    
    const randomId = participantIds[Math.floor(Math.random() * participantIds.length)];
    this.setTagger(randomId);
  }
  
  setTagger(playerId) {
    // Clear old tagger
    if (this.tagMode.taggerId) {
      const oldTagger = this.players.get(this.tagMode.taggerId);
      if (oldTagger) oldTagger.isIt = false;
    }
    
    // Set new tagger
    this.tagMode.taggerId = playerId;
    const newTagger = this.players.get(playerId);
    if (newTagger) {
      newTagger.isIt = true;
      newTagger.tagImmunityUntil = 0; // Tagger has no immunity
    }
    
    this.tagMode.lastTagTime = Date.now();
  }
  
  checkTagCollisions() {
    if (!this.tagMode.active || !this.tagMode.taggerId) return;
    
    const tagger = this.players.get(this.tagMode.taggerId);
    if (!tagger) return;
    
    const now = Date.now();
    const tagRadius = 75; // How close to tag someone (generous hitbox for fun gameplay)
    
    // Check all players in the same zone
    this.zones[tagger.zone].players.forEach(playerId => {
      if (playerId === this.tagMode.taggerId) return; // Can't tag yourself
      if (!this.tagMode.participants.has(playerId)) return; // Can only tag participants
      
      const target = this.players.get(playerId);
      if (!target) return;
      
      // Check if target is immune
      if (now < target.tagImmunityUntil) return;
      
      // Check distance
      const dx = tagger.x - target.x;
      const dy = tagger.y - target.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < tagRadius) {
        // Tag!
        this.performTag(playerId);
      }
    });
  }
  
  performTag(newTaggerId) {
    const oldTaggerId = this.tagMode.taggerId;
    const oldTagger = this.players.get(oldTaggerId);
    const newTagger = this.players.get(newTaggerId);
    
    if (!newTagger) return;
    
    // Old tagger gets immunity
    if (oldTagger) {
      oldTagger.isIt = false;
      oldTagger.tagImmunityUntil = Date.now() + this.tagMode.tagCooldown;
    }
    
    // Set new tagger
    this.setTagger(newTaggerId);
    
    // Broadcast the tag event
    this.broadcastToAll('playerTagged', {
      taggerId: oldTaggerId,
      taggerName: oldTagger?.name,
      taggedId: newTaggerId,
      taggedName: newTagger.name
    });
    
    console.log(`🏷️ ${oldTagger?.name} tagged ${newTagger.name}!`);
  }
  
  updateTagSurvivalTimes() {
    if (!this.tagMode.active) return;
    
    // Increment survival time for all non-taggers
    this.players.forEach((player, id) => {
      if (!player.isIt) {
        player.survivalTime = (player.survivalTime || 0) + 0.1; // Called 10 times/sec
      }
    });
  }
  
  broadcastToAll(event, data) {
    this.players.forEach((_, playerId) => {
      const socket = io.sockets.sockets.get(playerId);
      if (socket) {
        socket.emit(event, data);
      }
    });
  }
  
  broadcastToZone(zoneName, event, data) {
    const zone = this.zones[zoneName];
    zone.players.forEach(playerId => {
      const socket = io.sockets.sockets.get(playerId);
      if (socket) {
        socket.emit(event, data);
      }
    });
  }
  
  isFull() {
    return this.players.size >= FISHTANK_CONFIG.MAX_PLAYERS_PER_TANK;
  }
}

// Find or create a tank for a new player
function findAvailableTank() {
  // Look for a tank with space
  for (const [tankId, tank] of fishTanks) {
    if (!tank.isFull()) {
      return tank;
    }
  }
  
  // Create a new tank
  const newTank = new FishTank(`tank-${nextTankId++}`);
  fishTanks.set(newTank.id, newTank);
  return newTank;
}

// Clean up empty tanks periodically
setInterval(() => {
  for (const [tankId, tank] of fishTanks) {
    if (tank.players.size === 0) {
      tank.stopUpdateLoop();
      fishTanks.delete(tankId);
      console.log(`🐠 Empty Tank ${tankId} removed`);
    }
  }
}, 60000); // Check every minute

// Fish Tank socket handlers (add to existing io.on('connection'))
// We need to add these handlers in the existing connection handler

// Store player's current tank
const playerTanks = new Map(); // socketId -> tankId

// Add Fish Tank handlers to the main socket connection
io.on('connection', (socket) => {
  // Join Fish Tank
  socket.on('joinFishTank', (data) => {
    console.log(`🐠 Player wants to join Fish Tank:`, data);
    
    // Find or create a tank
    const tank = findAvailableTank();
    const player = tank.addPlayer(socket.id, data);
    
    // Store reference
    playerTanks.set(socket.id, tank.id);
    
    // Send confirmation
    socket.emit('tankJoined', {
      tankId: tank.id,
      zone: player.zone,
      player: tank.getPlayerData(player),
      playerCount: tank.players.size
    });
    
    // Notify ALL players in the tank that someone joined
    tank.broadcastToAll('playerJoinedTank', {
      player: tank.getPlayerData(player),
      playerCount: tank.players.size
    });
    
    // Broadcast updated player count
    broadcastPlayerCount();
  });
  
  // Fish Tank input
  socket.on('fishTankInput', (input) => {
    const tankId = playerTanks.get(socket.id);
    if (!tankId) return;
    
    const tank = fishTanks.get(tankId);
    if (tank) {
      tank.updatePlayerInput(socket.id, input);
    }
  });
  
  // Zone change
  socket.on('changeZone', (data) => {
    const tankId = playerTanks.get(socket.id);
    if (!tankId) return;
    
    const tank = fishTanks.get(tankId);
    if (tank) {
      const player = tank.players.get(socket.id);
      if (player) {
        // Update zone - no notifications needed for zone changes
        tank.zones[player.zone].players.delete(socket.id);
        player.zone = data.zone;
        tank.zones[data.zone].players.add(socket.id);
        
        // Notify player of zone change (for local UI update only)
        socket.emit('zoneChanged', { playerId: socket.id, zone: data.zone });
      }
    }
  });
  
  // Emote
  socket.on('emote', (data) => {
    const tankId = playerTanks.get(socket.id);
    if (!tankId) return;
    
    const tank = fishTanks.get(tankId);
    if (tank) {
      tank.handleEmote(socket.id, data);
    }
  });
  
  // Fish eaten
  socket.on('eatFish', (data) => {
    const tankId = playerTanks.get(socket.id);
    if (!tankId) return;
    
    const tank = fishTanks.get(tankId);
    if (tank && tank.handleFishEaten(socket.id, data.fishId)) {
      // Broadcast to zone that fish was eaten
      const player = tank.players.get(socket.id);
      if (player) {
        tank.broadcastToZone(player.zone, 'fishEaten', { fishId: data.fishId });
      }
    }
  });
  
  // Hiding status update
  socket.on('hidingStatus', (data) => {
    const tankId = playerTanks.get(socket.id);
    if (!tankId) return;
    
    const tank = fishTanks.get(tankId);
    if (tank) {
      const player = tank.players.get(socket.id);
      if (player) {
        player.hidden = data.hidden || false;
      }
    }
  });
  
  // Start Tag Mode
  socket.on('startTagMode', () => {
    const tankId = playerTanks.get(socket.id);
    if (!tankId) return;
    
    const tank = fishTanks.get(tankId);
    if (tank) {
      const result = tank.startTagMode();
      socket.emit('tagModeResponse', result);
    }
  });
  
  // Leave Tag Mode (individual player opts out)
  socket.on('stopTagMode', () => {
    const tankId = playerTanks.get(socket.id);
    if (!tankId) return;
    
    const tank = fishTanks.get(tankId);
    if (tank) {
      const result = tank.leaveTagMode(socket.id);
      socket.emit('tagModeResponse', result);
    }
  });
  
  // Leave Fish Tank
  socket.on('leaveFishTank', () => {
    const tankId = playerTanks.get(socket.id);
    if (!tankId) return;
    
    const tank = fishTanks.get(tankId);
    if (tank) {
      const player = tank.players.get(socket.id);
      if (player) {
        // Notify ALL players in tank that someone left
        tank.broadcastToAll('playerLeftTank', {
          playerId: socket.id,
          playerName: player.name,
          playerCount: tank.players.size - 1
        });
        
        // Handle tag mode participant leaving
        if (tank.tagMode.active && tank.tagMode.participants.has(socket.id)) {
          tank.tagMode.participants.delete(socket.id);
          
          // If they were the tagger, select a new one
          if (tank.tagMode.taggerId === socket.id) {
            if (tank.tagMode.participants.size > 0) {
              tank.selectRandomTagger();
              const newTagger = tank.players.get(tank.tagMode.taggerId);
              tank.broadcastToAll('newTagger', {
                taggerId: tank.tagMode.taggerId,
                taggerName: newTagger?.name || 'Someone'
              });
            }
          }
          
          // End tag mode if less than 2 participants
          if (tank.tagMode.participants.size < 2) {
            tank.endTagModeForAll();
          }
        }
        
        tank.removePlayer(socket.id);
      } else {
        tank.removePlayer(socket.id);
      }
    }
    playerTanks.delete(socket.id);
    
    // Broadcast updated player count
    broadcastPlayerCount();
  });
  
  // Handle disconnect for Fish Tank
  socket.on('disconnect', () => {
    const tankId = playerTanks.get(socket.id);
    if (tankId) {
      const tank = fishTanks.get(tankId);
      if (tank) {
        const player = tank.players.get(socket.id);
        if (player) {
          // Notify ALL players in tank that someone left
          tank.broadcastToAll('playerLeftTank', {
            playerId: socket.id,
            playerName: player.name,
            playerCount: tank.players.size - 1
          });
          
          // Handle tag mode participant disconnecting
          if (tank.tagMode.active && tank.tagMode.participants.has(socket.id)) {
            tank.tagMode.participants.delete(socket.id);
            
            // If they were the tagger, select a new one
            if (tank.tagMode.taggerId === socket.id) {
              if (tank.tagMode.participants.size > 0) {
                tank.selectRandomTagger();
                const newTagger = tank.players.get(tank.tagMode.taggerId);
                tank.broadcastToAll('newTagger', {
                  taggerId: tank.tagMode.taggerId,
                  taggerName: newTagger?.name || 'Someone'
                });
              }
            }
            
            // End tag mode if less than 2 participants
            if (tank.tagMode.participants.size < 2) {
              tank.endTagModeForAll();
            }
          }
          
          tank.removePlayer(socket.id);
        } else {
          tank.removePlayer(socket.id);
        }
      }
      playerTanks.delete(socket.id);
      
      // Broadcast updated player count
      broadcastPlayerCount();
    }
  });
});

// Graceful shutdown handler for Railway
process.on('SIGTERM', () => {
  console.log('SIGTERM received - shutting down gracefully');
  http.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
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
