const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// ============================================
// DECK DATA
// ============================================

// Classic deck - mix of fan favorites
const pokemonClassic = [
  { id: 1, name: "Bulbasaur" },
  { id: 4, name: "Charmander" },
  { id: 6, name: "Charizard" },
  { id: 7, name: "Squirtle" },
  { id: 9, name: "Blastoise" },
  { id: 25, name: "Pikachu" },
  { id: 26, name: "Raichu" },
  { id: 39, name: "Jigglypuff" },
  { id: 52, name: "Meowth" },
  { id: 54, name: "Psyduck" },
  { id: 58, name: "Growlithe" },
  { id: 63, name: "Abra" },
  { id: 74, name: "Geodude" },
  { id: 79, name: "Slowpoke" },
  { id: 81, name: "Magnemite" },
  { id: 92, name: "Gastly" },
  { id: 94, name: "Gengar" },
  { id: 95, name: "Onix" },
  { id: 104, name: "Cubone" },
  { id: 109, name: "Koffing" },
  { id: 120, name: "Staryu" },
  { id: 129, name: "Magikarp" },
  { id: 130, name: "Gyarados" },
  { id: 131, name: "Lapras" },
  { id: 133, name: "Eevee" },
  { id: 143, name: "Snorlax" },
  { id: 147, name: "Dratini" },
  { id: 149, name: "Dragonite" },
  { id: 150, name: "Mewtwo" },
  { id: 151, name: "Mew" },
  { id: 152, name: "Chikorita" },
  { id: 155, name: "Cyndaquil" },
  { id: 158, name: "Totodile" },
  { id: 175, name: "Togepi" },
  { id: 183, name: "Marill" },
  { id: 196, name: "Espeon" },
  { id: 197, name: "Umbreon" },
  { id: 246, name: "Larvitar" },
  { id: 249, name: "Lugia" },
  { id: 250, name: "Ho-Oh" },
  { id: 252, name: "Treecko" },
  { id: 255, name: "Torchic" },
  { id: 258, name: "Mudkip" },
  { id: 280, name: "Ralts" },
  { id: 302, name: "Sableye" },
  { id: 333, name: "Swablu" },
  { id: 349, name: "Feebas" },
  { id: 363, name: "Spheal" },
  { id: 374, name: "Beldum" },
  { id: 382, name: "Kyogre" },
  { id: 383, name: "Groudon" },
  { id: 384, name: "Rayquaza" },
  { id: 393, name: "Piplup" },
  { id: 403, name: "Shinx" },
  { id: 443, name: "Gible" },
  { id: 447, name: "Riolu" },
  { id: 448, name: "Lucario" },
];

// Final Forms deck - only fully evolved Pokémon (57 needed for the deck)
const pokemonFinalForms = [
  { id: 3, name: "Venusaur" },
  { id: 6, name: "Charizard" },
  { id: 9, name: "Blastoise" },
  { id: 12, name: "Butterfree" },
  { id: 18, name: "Pidgeot" },
  { id: 26, name: "Raichu" },
  { id: 28, name: "Sandslash" },
  { id: 31, name: "Nidoqueen" },
  { id: 34, name: "Nidoking" },
  { id: 38, name: "Ninetales" },
  { id: 45, name: "Vileplume" },
  { id: 55, name: "Golduck" },
  { id: 59, name: "Arcanine" },
  { id: 65, name: "Alakazam" },
  { id: 68, name: "Machamp" },
  { id: 71, name: "Victreebel" },
  { id: 76, name: "Golem" },
  { id: 78, name: "Rapidash" },
  { id: 80, name: "Slowbro" },
  { id: 82, name: "Magneton" },
  { id: 89, name: "Muk" },
  { id: 94, name: "Gengar" },
  { id: 103, name: "Exeggutor" },
  { id: 110, name: "Weezing" },
  { id: 112, name: "Rhydon" },
  { id: 121, name: "Starmie" },
  { id: 130, name: "Gyarados" },
  { id: 131, name: "Lapras" },
  { id: 134, name: "Vaporeon" },
  { id: 135, name: "Jolteon" },
  { id: 136, name: "Flareon" },
  { id: 143, name: "Snorlax" },
  { id: 149, name: "Dragonite" },
  { id: 150, name: "Mewtwo" },
  { id: 154, name: "Meganium" },
  { id: 157, name: "Typhlosion" },
  { id: 160, name: "Feraligatr" },
  { id: 169, name: "Crobat" },
  { id: 181, name: "Ampharos" },
  { id: 196, name: "Espeon" },
  { id: 197, name: "Umbreon" },
  { id: 212, name: "Scizor" },
  { id: 229, name: "Houndoom" },
  { id: 248, name: "Tyranitar" },
  { id: 254, name: "Sceptile" },
  { id: 257, name: "Blaziken" },
  { id: 260, name: "Swampert" },
  { id: 282, name: "Gardevoir" },
  { id: 306, name: "Aggron" },
  { id: 334, name: "Altaria" },
  { id: 350, name: "Milotic" },
  { id: 365, name: "Walrein" },
  { id: 376, name: "Metagross" },
  { id: 445, name: "Garchomp" },
  { id: 448, name: "Lucario" },
  { id: 475, name: "Gallade" },
  { id: 470, name: "Leafeon" },
];

// Kanto deck - Gen 1 Pokémon only (#1-151)
const pokemonKanto = [
  { id: 1, name: "Bulbasaur" },
  { id: 4, name: "Charmander" },
  { id: 6, name: "Charizard" },
  { id: 7, name: "Squirtle" },
  { id: 9, name: "Blastoise" },
  { id: 25, name: "Pikachu" },
  { id: 26, name: "Raichu" },
  { id: 35, name: "Clefairy" },
  { id: 37, name: "Vulpix" },
  { id: 39, name: "Jigglypuff" },
  { id: 52, name: "Meowth" },
  { id: 54, name: "Psyduck" },
  { id: 58, name: "Growlithe" },
  { id: 59, name: "Arcanine" },
  { id: 63, name: "Abra" },
  { id: 65, name: "Alakazam" },
  { id: 74, name: "Geodude" },
  { id: 77, name: "Ponyta" },
  { id: 79, name: "Slowpoke" },
  { id: 92, name: "Gastly" },
  { id: 94, name: "Gengar" },
  { id: 95, name: "Onix" },
  { id: 104, name: "Cubone" },
  { id: 109, name: "Koffing" },
  { id: 113, name: "Chansey" },
  { id: 120, name: "Staryu" },
  { id: 123, name: "Scyther" },
  { id: 124, name: "Jynx" },
  { id: 125, name: "Electabuzz" },
  { id: 126, name: "Magmar" },
  { id: 129, name: "Magikarp" },
  { id: 130, name: "Gyarados" },
  { id: 131, name: "Lapras" },
  { id: 133, name: "Eevee" },
  { id: 134, name: "Vaporeon" },
  { id: 135, name: "Jolteon" },
  { id: 136, name: "Flareon" },
  { id: 137, name: "Porygon" },
  { id: 142, name: "Aerodactyl" },
  { id: 143, name: "Snorlax" },
  { id: 144, name: "Articuno" },
  { id: 145, name: "Zapdos" },
  { id: 146, name: "Moltres" },
  { id: 147, name: "Dratini" },
  { id: 148, name: "Dragonair" },
  { id: 149, name: "Dragonite" },
  { id: 150, name: "Mewtwo" },
  { id: 151, name: "Mew" },
  { id: 3, name: "Venusaur" },
  { id: 12, name: "Butterfree" },
  { id: 18, name: "Pidgeot" },
  { id: 31, name: "Nidoqueen" },
  { id: 34, name: "Nidoking" },
  { id: 38, name: "Ninetales" },
  { id: 68, name: "Machamp" },
  { id: 76, name: "Golem" },
  { id: 103, name: "Exeggutor" },
];

// Available decks
const DECKS = {
  classic: {
    name: 'Classic',
    pokemon: pokemonClassic
  },
  finalforms: {
    name: 'Final Forms',
    pokemon: pokemonFinalForms
  },
  kanto: {
    name: 'Kanto',
    pokemon: pokemonKanto
  },
  shiny: {
    name: 'Shiny',
    pokemon: pokemonClassic,  // Uses same Pokemon as classic, but client renders as shiny
    isShiny: true
  }
};

// Default deck for backward compatibility
const pokemon = pokemonClassic;

// Generate cards using finite projective plane of order 7
function generateDeck(pokemonArray = pokemon) {
  const cards = [];
  const n = 7;

  // First card
  const firstCard = [];
  for (let i = 0; i <= n; i++) {
    firstCard.push(i);
  }
  cards.push(firstCard);

  // Next n cards
  for (let i = 0; i < n; i++) {
    const card = [0];
    for (let j = 0; j < n; j++) {
      card.push(n + 1 + n * i + j);
    }
    cards.push(card);
  }

  // Remaining n² cards
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const card = [i + 1];
      for (let k = 0; k < n; k++) {
        const symbolIndex = n + 1 + k * n + ((i * k + j) % n);
        card.push(symbolIndex);
      }
      cards.push(card);
    }
  }

  // Convert to Pokémon
  return cards.map(card => card.map(idx => pokemonArray[idx]));
}

function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ============================================
// GAME STATE
// ============================================

const games = new Map();
const playerToGame = new Map();
const lobbies = new Map();  // lobbyCode -> { players: [], host: socketId, maxPlayers: 5, deck: 'classic' }
const playerToLobby = new Map();
const rematchLobbies = new Map(); // gameId -> { players: [], ready: Set, deck: 'classic' }
const sessions = new Map(); // sessionId -> { socketId, playerName, gameId, lobbyCode }
const coopGames = new Map(); // gameId -> co-op game state

// Gym Leaders configuration
const GYM_LEADERS = {
  brock: { name: 'Brock', difficulty: 'easy', pokemon: 95, badge: 'Boulder Badge', minTime: 7000, maxTime: 10000 },
  misty: { name: 'Misty', difficulty: 'easy', pokemon: 121, badge: 'Cascade Badge', minTime: 6000, maxTime: 9000 },
  surge: { name: 'Lt. Surge', difficulty: 'medium', pokemon: 26, badge: 'Thunder Badge', minTime: 4500, maxTime: 6000 },
  erika: { name: 'Erika', difficulty: 'medium', pokemon: 45, badge: 'Rainbow Badge', minTime: 4000, maxTime: 5500 },
  sabrina: { name: 'Sabrina', difficulty: 'hard', pokemon: 65, badge: 'Marsh Badge', minTime: 2500, maxTime: 4000 },
  giovanni: { name: 'Giovanni', difficulty: 'hard', pokemon: 34, badge: 'Earth Badge', minTime: 2000, maxTime: 3500 }
};

const MIN_PLAYERS = 2;
const MAX_PLAYERS = 5;
const SESSION_TIMEOUT = 60000; // 60 seconds to reconnect

function createGame(players, deckId = 'classic') {
  const gameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Get the pokemon array for the selected deck
  const selectedDeck = DECKS[deckId] || DECKS.classic;
  const pokemonArray = selectedDeck.pokemon;
  
  // Generate and shuffle the full deck
  let deck = generateDeck(pokemonArray);
  deck = shuffleArray(deck);

  // Deal cards:
  // - 1 card to each player (their current card)
  // - 1 card face up in center
  // - Remaining cards are the draw pile
  const numPlayers = players.length;
  
  const gamePlayers = {};
  const playerOrder = [];
  
  players.forEach((player, index) => {
    const card = deck[index];
    gamePlayers[player.id] = {
      socket: player,
      name: player.playerName,
      currentCard: card,
      currentCardLayout: generateCardLayout(card),  // Pre-generate layout
      score: 0
    };
    playerOrder.push(player.id);
  });

  const centerCard = deck[numPlayers];
  const drawPile = deck.slice(numPlayers + 1);

  const game = {
    id: gameId,
    deck: deckId,  // Store which deck was used
    players: gamePlayers,
    playerOrder: playerOrder,
    centerCard: centerCard,
    centerCardLayout: generateCardLayout(centerCard),  // Pre-generate center layout
    drawPile: drawPile,
    state: 'playing',
    lastMatchTime: Date.now(),
    locked: false
  };

  games.set(gameId, game);
  players.forEach(player => {
    playerToGame.set(player.id, gameId);
  });

  return game;
}

// Create a co-op game against a gym leader
function createCoopGame(players, deckId = 'classic', gymLeaderId = 'brock') {
  const gameId = `coop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const gymLeader = GYM_LEADERS[gymLeaderId] || GYM_LEADERS.brock;
  const selectedDeck = DECKS[deckId] || DECKS.classic;
  const pokemonArray = selectedDeck.pokemon;
  
  let deck = generateDeck(pokemonArray);
  deck = shuffleArray(deck);
  
  // All players share the same card (team card)
  const teamCard = deck[0];
  const teamCardLayout = generateCardLayout(teamCard);
  const aiCard = deck[1];
  const centerCard = deck[2];
  const drawPile = deck.slice(3);
  
  const gamePlayers = {};
  const playerOrder = [];
  
  players.forEach((player) => {
    gamePlayers[player.id] = {
      socket: player,
      name: player.playerName
    };
    playerOrder.push(player.id);
  });
  
  const game = {
    id: gameId,
    type: 'coop',
    deck: deckId,
    gymLeader: gymLeader,
    gymLeaderId: gymLeaderId,
    players: gamePlayers,
    playerOrder: playerOrder,
    teamCard: teamCard,
    teamCardLayout: teamCardLayout,
    aiCard: aiCard,
    centerCard: centerCard,
    centerCardLayout: generateCardLayout(centerCard),
    drawPile: drawPile,
    teamScore: 0,
    aiScore: 0,
    state: 'playing',
    roundScored: false,
    aiTimer: null
  };
  
  coopGames.set(gameId, game);
  players.forEach(player => {
    playerToGame.set(player.id, gameId);
  });
  
  return game;
}

// Start the AI timer for co-op game
function startCoopAiTimer(game) {
  if (game.state !== 'playing') return;
  
  // Clear existing timer
  if (game.aiTimer) {
    clearTimeout(game.aiTimer);
  }
  
  // Co-op speed multiplier - hard mode is faster since there are multiple players
  let speedMultiplier = 1.0;
  if (game.gymLeader.difficulty === 'hard') {
    speedMultiplier = 0.65; // 35% faster for hard in co-op
  } else if (game.gymLeader.difficulty === 'medium') {
    speedMultiplier = 0.85; // 15% faster for medium in co-op
  }
  
  const baseDelay = game.gymLeader.minTime + Math.random() * (game.gymLeader.maxTime - game.gymLeader.minTime);
  const delay = baseDelay * speedMultiplier;
  
  game.aiTimer = setTimeout(() => {
    if (game.state === 'playing' && !game.roundScored) {
      coopAiScores(game);
    }
  }, delay);
}

// AI scores in co-op game
function coopAiScores(game) {
  if (game.state !== 'playing' || game.roundScored) return;
  
  game.roundScored = true;
  game.aiScore++;
  
  // Find the match for highlighting
  const match = findMatch(game.centerCard, game.aiCard);
  
  // Notify all players
  game.playerOrder.forEach(playerId => {
    const player = game.players[playerId];
    if (player && player.socket) {
      player.socket.emit('coop_round_result', {
        winner: 'ai',
        gymLeaderName: game.gymLeader.name,
        pokemonId: match ? match.id : null,
        teamScore: game.teamScore,
        aiScore: game.aiScore
      });
    }
  });
  
  // Advance game after delay
  setTimeout(() => {
    advanceCoopGame(game, false);
  }, 1000);
}

// Advance co-op game to next round
function advanceCoopGame(game, teamScored) {
  game.roundScored = false;
  
  if (teamScored) {
    // Team's card becomes center, draw new team card
    game.centerCard = game.teamCard;
    game.centerCardLayout = game.teamCardLayout;
    
    if (game.drawPile.length > 0) {
      game.teamCard = game.drawPile.shift();
      game.teamCardLayout = generateCardLayout(game.teamCard);
    }
  } else {
    // AI's card becomes center, draw new AI card
    game.centerCard = game.aiCard;
    game.centerCardLayout = generateCardLayout(game.centerCard);
    
    if (game.drawPile.length > 0) {
      game.aiCard = game.drawPile.shift();
    }
  }
  
  // Check if game is over
  if (game.drawPile.length === 0) {
    endCoopGame(game);
  } else {
    // Send new game state to all players
    game.playerOrder.forEach(playerId => {
      const player = game.players[playerId];
      if (player && player.socket) {
        player.socket.emit('coop_game_state', getCoopGameState(game));
      }
    });
    
    startCoopAiTimer(game);
  }
}

// End co-op game
function endCoopGame(game) {
  game.state = 'finished';
  
  if (game.aiTimer) {
    clearTimeout(game.aiTimer);
    game.aiTimer = null;
  }
  
  const teamWon = game.teamScore > game.aiScore;
  
  game.playerOrder.forEach(playerId => {
    const player = game.players[playerId];
    if (player && player.socket) {
      player.socket.emit('coop_game_over', {
        teamWon: teamWon,
        teamScore: game.teamScore,
        aiScore: game.aiScore,
        gymLeaderName: game.gymLeader.name,
        gymLeaderPokemon: game.gymLeader.pokemon,
        gameId: game.id
      });
    }
  });
  
  // Cleanup
  game.playerOrder.forEach(id => playerToGame.delete(id));
  coopGames.delete(game.id);
}

// Get co-op game state for a player
function getCoopGameState(game) {
  return {
    centerCard: game.centerCardLayout,
    teamCard: game.teamCardLayout,
    teamScore: game.teamScore,
    aiScore: game.aiScore,
    gymLeaderName: game.gymLeader.name,
    cardsRemaining: game.drawPile.length
  };
}

// Find the matching Pokémon between two cards
function findMatch(card1, card2) {
  for (const p1 of card1) {
    for (const p2 of card2) {
      if (p1.id === p2.id) {
        return p1;
      }
    }
  }
  return null;
}

// Shuffle the symbols on a card for display
// Uses FIXED POSITIONS that guarantee no overlap, then shuffles which Pokemon goes where
function generateCardLayout(card) {
  // Pre-calculated positions that NEVER overlap
  // Each position: { x, y, maxSize } - positioned to have good spacing
  const fixedPositions = [
    { x: 50, y: 22, maxSize: 26 },   // Top center
    { x: 76, y: 32, maxSize: 24 },   // Top right
    { x: 80, y: 58, maxSize: 22 },   // Right
    { x: 68, y: 78, maxSize: 24 },   // Bottom right
    { x: 42, y: 78, maxSize: 22 },   // Bottom center
    { x: 22, y: 65, maxSize: 24 },   // Bottom left
    { x: 18, y: 40, maxSize: 24 },   // Left
    { x: 50, y: 50, maxSize: 26 },   // Center
  ];
  
  // Shuffle both the card and positions
  const shuffledCard = shuffleArray([...card]);
  const shuffledPositions = shuffleArray([...fixedPositions]);
  
  const positions = [];
  
  for (let i = 0; i < shuffledCard.length; i++) {
    const pos = shuffledPositions[i];
    // Vary the size a bit, but don't exceed maxSize for this position
    const size = pos.maxSize - Math.random() * 4;
    
    positions.push({ 
      ...shuffledCard[i], 
      x: pos.x,
      y: pos.y,
      size,
      rotation: 0
    });
  }
  
  return positions;
}

// Get game state to send to a specific player
function getGameStateForPlayer(game, playerId) {
  const player = game.players[playerId];
  
  // Get all opponents' scores
  const opponents = [];
  game.playerOrder.forEach(id => {
    if (id !== playerId) {
      const opp = game.players[id];
      opponents.push({
        name: opp.name,
        score: opp.score
      });
    }
  });

  // Get next card preview for preloading (peek at draw pile)
  let nextCardPreview = null;
  if (game.drawPile.length > 0) {
    // Just send Pokemon IDs for preloading images
    nextCardPreview = game.drawPile[0].map(p => p.id);
  }

  return {
    centerCard: game.centerCardLayout,  // Use pre-generated layout
    yourCard: player.currentCardLayout,  // Use pre-generated layout
    yourScore: player.score,
    opponents: opponents,
    cardsRemaining: game.drawPile.length,
    totalPlayers: game.playerOrder.length,
    nextCardPreview: nextCardPreview
  };
}

// ============================================
// SOCKET HANDLERS
// ============================================

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Handle reconnection with session ID
  socket.on('reconnect_session', (data) => {
    const { sessionId } = data;
    if (!sessionId) return;
    
    const session = sessions.get(sessionId);
    if (!session) {
      socket.emit('reconnect_failed', { message: 'Session expired' });
      return;
    }
    
    // Clear any pending disconnect timeout
    if (session.disconnectTimeout) {
      clearTimeout(session.disconnectTimeout);
      session.disconnectTimeout = null;
    }
    
    socket.playerName = session.playerName;
    socket.sessionId = sessionId;
    session.socketId = socket.id;
    
    // Reconnect to game if in one
    if (session.gameId) {
      const game = games.get(session.gameId);
      if (game && game.players[session.oldSocketId]) {
        // Swap socket references
        const playerData = game.players[session.oldSocketId];
        playerData.socket = socket;
        game.players[socket.id] = playerData;
        delete game.players[session.oldSocketId];
        
        // Update player order
        const orderIndex = game.playerOrder.indexOf(session.oldSocketId);
        if (orderIndex !== -1) {
          game.playerOrder[orderIndex] = socket.id;
        }
        
        playerToGame.set(socket.id, session.gameId);
        playerToGame.delete(session.oldSocketId);
        session.oldSocketId = socket.id;
        
        // Send current game state
        socket.emit('reconnect_success', { type: 'game' });
        socket.emit('game_state', getGameStateForPlayer(game, socket.id));
        
        console.log(`${socket.playerName} reconnected to game`);
        return;
      }
    }
    
    // Reconnect to lobby if in one
    if (session.lobbyCode) {
      const lobby = lobbies.get(session.lobbyCode);
      if (lobby) {
        // Find and update socket in lobby
        const playerIndex = lobby.players.findIndex(p => p.id === session.oldSocketId);
        if (playerIndex !== -1) {
          lobby.players[playerIndex] = socket;
          
          if (lobby.host === session.oldSocketId) {
            lobby.host = socket.id;
          }
          
          playerToLobby.set(socket.id, session.lobbyCode);
          playerToLobby.delete(session.oldSocketId);
          session.oldSocketId = socket.id;
          
          const playerList = lobby.players.map(p => ({
            name: p.playerName,
            isHost: p.id === lobby.host
          }));
          
          socket.emit('reconnect_success', { type: 'lobby' });
          socket.emit('lobby_updated', { code: session.lobbyCode, players: playerList });
          
          console.log(`${socket.playerName} reconnected to lobby ${session.lobbyCode}`);
          return;
        }
      }
    }
    
    socket.emit('reconnect_failed', { message: 'Could not find your game' });
  });

  // Generate a random 3-letter lobby code
  function generateLobbyCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // No I or O to avoid confusion
    let code = '';
    for (let i = 0; i < 3; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  // Generate session ID
  function generateSessionId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  socket.on('create_lobby', (data) => {
    socket.playerName = data.name || `Player ${socket.id.substr(0, 4)}`;
    const isPublic = data.isPublic !== false; // Default to public
    
    // Create session
    const sessionId = generateSessionId();
    socket.sessionId = sessionId;
    
    // Generate unique lobby code
    let code = generateLobbyCode();
    while (lobbies.has(code)) {
      code = generateLobbyCode();
    }

    const lobby = {
      code: code,
      players: [socket],
      host: socket.id,
      maxPlayers: MAX_PLAYERS,
      isPublic: isPublic,
      hostName: socket.playerName,
      createdAt: Date.now(),
      deck: 'classic',  // Default deck
      mode: 'versus',   // 'versus' or 'coop'
      gymLeader: null   // For co-op mode
    };
    
    lobbies.set(code, lobby);
    playerToLobby.set(socket.id, code);
    
    // Save session
    sessions.set(sessionId, {
      socketId: socket.id,
      oldSocketId: socket.id,
      playerName: socket.playerName,
      lobbyCode: code,
      gameId: null
    });
    
    socket.emit('lobby_created', { 
      code: code,
      isPublic: isPublic,
      sessionId: sessionId,
      players: [{ name: socket.playerName, isHost: true }],
      deck: lobby.deck,
      mode: lobby.mode,
      gymLeader: lobby.gymLeader,
      availableDecks: Object.keys(DECKS).map(key => ({ id: key, name: DECKS[key].name })),
      availableGymLeaders: Object.keys(GYM_LEADERS).map(key => ({ id: key, ...GYM_LEADERS[key] }))
    });
    
    console.log(`Lobby ${code} created by ${socket.playerName} (${isPublic ? 'public' : 'private'})`);
  });

  // Host can change the deck
  socket.on('set_deck', (data) => {
    const code = playerToLobby.get(socket.id);
    if (!code) return;
    
    const lobby = lobbies.get(code);
    if (!lobby) return;
    
    // Only host can change deck
    if (socket.id !== lobby.host) {
      socket.emit('error', { message: 'Only the host can change the deck' });
      return;
    }
    
    // Validate deck exists
    if (!DECKS[data.deck]) {
      socket.emit('error', { message: 'Invalid deck selected' });
      return;
    }
    
    lobby.deck = data.deck;
    
    // Notify all players of deck change
    const playerList = lobby.players.map(p => ({
      name: p.playerName,
      isHost: p.id === lobby.host
    }));
    
    lobby.players.forEach(p => {
      p.emit('lobby_updated', { 
        code: code,
        players: playerList,
        deck: lobby.deck,
        mode: lobby.mode,
        gymLeader: lobby.gymLeader,
        availableDecks: Object.keys(DECKS).map(key => ({ id: key, name: DECKS[key].name })),
        availableGymLeaders: Object.keys(GYM_LEADERS).map(key => ({ id: key, ...GYM_LEADERS[key] })),
        isPublic: lobby.isPublic
      });
    });
    
    console.log(`Lobby ${code} deck changed to ${DECKS[data.deck].name}`);
  });

  // Host can change game mode (versus or coop)
  socket.on('set_mode', (data) => {
    const code = playerToLobby.get(socket.id);
    if (!code) return;
    
    const lobby = lobbies.get(code);
    if (!lobby) return;
    
    if (socket.id !== lobby.host) {
      socket.emit('error', { message: 'Only the host can change the game mode' });
      return;
    }
    
    if (data.mode !== 'versus' && data.mode !== 'coop') {
      socket.emit('error', { message: 'Invalid game mode' });
      return;
    }
    
    lobby.mode = data.mode;
    if (data.mode === 'versus') {
      lobby.gymLeader = null;
    }
    
    const playerList = lobby.players.map(p => ({
      name: p.playerName,
      isHost: p.id === lobby.host
    }));
    
    lobby.players.forEach(p => {
      p.emit('lobby_updated', { 
        code: code,
        players: playerList,
        deck: lobby.deck,
        mode: lobby.mode,
        gymLeader: lobby.gymLeader,
        availableDecks: Object.keys(DECKS).map(key => ({ id: key, name: DECKS[key].name })),
        availableGymLeaders: Object.keys(GYM_LEADERS).map(key => ({ id: key, ...GYM_LEADERS[key] })),
        isPublic: lobby.isPublic
      });
    });
    
    console.log(`Lobby ${code} mode changed to ${data.mode}`);
  });

  // Host can set gym leader for co-op mode
  socket.on('set_gym_leader', (data) => {
    const code = playerToLobby.get(socket.id);
    if (!code) return;
    
    const lobby = lobbies.get(code);
    if (!lobby) return;
    
    if (socket.id !== lobby.host) {
      socket.emit('error', { message: 'Only the host can change the gym leader' });
      return;
    }
    
    if (!GYM_LEADERS[data.gymLeader]) {
      socket.emit('error', { message: 'Invalid gym leader' });
      return;
    }
    
    lobby.gymLeader = data.gymLeader;
    lobby.mode = 'coop';  // Setting gym leader implies co-op mode
    
    const playerList = lobby.players.map(p => ({
      name: p.playerName,
      isHost: p.id === lobby.host
    }));
    
    lobby.players.forEach(p => {
      p.emit('lobby_updated', { 
        code: code,
        players: playerList,
        deck: lobby.deck,
        mode: lobby.mode,
        gymLeader: lobby.gymLeader,
        availableDecks: Object.keys(DECKS).map(key => ({ id: key, name: DECKS[key].name })),
        availableGymLeaders: Object.keys(GYM_LEADERS).map(key => ({ id: key, ...GYM_LEADERS[key] })),
        isPublic: lobby.isPublic
      });
    });
    
    console.log(`Lobby ${code} gym leader set to ${GYM_LEADERS[data.gymLeader].name}`);
  });

  socket.on('get_public_lobbies', () => {
    const publicLobbies = [];
    lobbies.forEach((lobby, code) => {
      if (lobby.isPublic && lobby.players.length < lobby.maxPlayers) {
        publicLobbies.push({
          code: code,
          hostName: lobby.hostName,
          playerCount: lobby.players.length,
          maxPlayers: lobby.maxPlayers,
          mode: lobby.mode,
          gymLeader: lobby.gymLeader ? GYM_LEADERS[lobby.gymLeader] : null,
          gymLeaderId: lobby.gymLeader
        });
      }
    });
    socket.emit('public_lobbies', { lobbies: publicLobbies });
  });

  socket.on('join_lobby', (data) => {
    socket.playerName = data.name || `Player ${socket.id.substr(0, 4)}`;
    const code = data.code.toUpperCase();
    
    const lobby = lobbies.get(code);
    if (!lobby) {
      socket.emit('error', { message: 'Lobby not found' });
      return;
    }
    
    if (lobby.players.length >= lobby.maxPlayers) {
      socket.emit('error', { message: 'Lobby is full' });
      return;
    }
    
    // Create session
    const sessionId = generateSessionId();
    socket.sessionId = sessionId;
    sessions.set(sessionId, {
      socketId: socket.id,
      oldSocketId: socket.id,
      playerName: socket.playerName,
      lobbyCode: code,
      gameId: null
    });
    
    lobby.players.push(socket);
    playerToLobby.set(socket.id, code);
    
    // Notify all players in lobby
    const playerList = lobby.players.map(p => ({
      name: p.playerName,
      isHost: p.id === lobby.host
    }));
    
    lobby.players.forEach(p => {
      const pSession = sessions.get(p.sessionId);
      p.emit('lobby_updated', { 
        code: code,
        players: playerList,
        sessionId: p.sessionId,
        isPublic: lobby.isPublic,
        deck: lobby.deck,
        mode: lobby.mode,
        gymLeader: lobby.gymLeader,
        availableDecks: Object.keys(DECKS).map(key => ({ id: key, name: DECKS[key].name })),
        availableGymLeaders: Object.keys(GYM_LEADERS).map(key => ({ id: key, ...GYM_LEADERS[key] }))
      });
    });
    
    console.log(`${socket.playerName} joined lobby ${code}`);
  });

  socket.on('start_game', () => {
    const code = playerToLobby.get(socket.id);
    if (!code) return;
    
    const lobby = lobbies.get(code);
    if (!lobby) return;
    
    // Only host can start
    if (socket.id !== lobby.host) {
      socket.emit('error', { message: 'Only the host can start the game' });
      return;
    }
    
    // Co-op mode needs at least 2 players
    const minPlayers = lobby.mode === 'coop' ? 2 : MIN_PLAYERS;
    if (lobby.players.length < minPlayers) {
      socket.emit('error', { message: `Need at least ${minPlayers} player(s) to start` });
      return;
    }
    
    // Co-op mode requires a gym leader
    if (lobby.mode === 'coop' && !lobby.gymLeader) {
      socket.emit('error', { message: 'Please select a gym leader for co-op mode' });
      return;
    }

    // Send countdown to all players
    lobby.players.forEach(p => {
      p.emit('game_countdown', { seconds: 3 });
    });

    // Start game after countdown
    setTimeout(() => {
      // Make sure lobby still exists and has players
      if (!lobbies.has(code)) return;
      
      if (lobby.mode === 'coop') {
        // Create co-op game
        const game = createCoopGame(lobby.players, lobby.deck, lobby.gymLeader);
        
        game.playerOrder.forEach(playerId => {
          const player = game.players[playerId];
          playerToLobby.delete(playerId);
          
          if (player.socket.sessionId) {
            const session = sessions.get(player.socket.sessionId);
            if (session) {
              session.gameId = game.id;
              session.lobbyCode = null;
            }
          }
          
          player.socket.emit('coop_game_start', {
            gameId: game.id,
            yourName: player.name,
            totalPlayers: game.playerOrder.length,
            deck: game.deck,
            gymLeader: game.gymLeader,
            gymLeaderId: game.gymLeaderId,
            isShiny: DECKS[game.deck]?.isShiny || false
          });
          
          player.socket.emit('coop_game_state', getCoopGameState(game));
        });
        
        // Start AI timer
        startCoopAiTimer(game);
        
        lobbies.delete(code);
        console.log(`Co-op game started in lobby ${code} with ${game.playerOrder.length} players vs ${game.gymLeader.name}`);
        
      } else {
        // Create regular versus game
        const game = createGame(lobby.players, lobby.deck);
        
        game.playerOrder.forEach(playerId => {
          const player = game.players[playerId];
          playerToLobby.delete(playerId);
          
          if (player.socket.sessionId) {
            const session = sessions.get(player.socket.sessionId);
            if (session) {
              session.gameId = game.id;
              session.lobbyCode = null;
            }
          }
          
          player.socket.emit('game_start', {
            gameId: game.id,
            yourName: player.name,
            totalPlayers: game.playerOrder.length,
            deck: game.deck,
            isShiny: DECKS[game.deck]?.isShiny || false
          });

          player.socket.emit('game_state', getGameStateForPlayer(game, playerId));
        });

        lobbies.delete(code);
        console.log(`Game started in lobby ${code} with ${game.playerOrder.length} players using ${DECKS[game.deck].name} deck`);
      }
    }, 3000);
  });

  socket.on('leave_lobby', () => {
    const code = playerToLobby.get(socket.id);
    if (!code) return;
    
    const lobby = lobbies.get(code);
    if (!lobby) return;
    
    handleLobbyLeave(socket, lobby, code);
  });
  
  function handleLobbyLeave(socket, lobby, code) {
    lobby.players = lobby.players.filter(p => p.id !== socket.id);
    playerToLobby.delete(socket.id);
    
    if (lobby.players.length === 0) {
      lobbies.delete(code);
      console.log(`Lobby ${code} deleted (empty)`);
      return;
    }
    
    // If host left, assign new host
    if (socket.id === lobby.host) {
      lobby.host = lobby.players[0].id;
    }
    
    // Notify remaining players
    const playerList = lobby.players.map(p => ({
      name: p.playerName,
      isHost: p.id === lobby.host
    }));
    
    lobby.players.forEach(p => {
      p.emit('lobby_updated', { 
        code: code,
        players: playerList,
        isPublic: lobby.isPublic
      });
    });
  }

  socket.on('claim_match', (data) => {
    const gameId = playerToGame.get(socket.id);
    if (!gameId) return;

    const game = games.get(gameId);
    if (!game || game.state !== 'playing') return;

    const { pokemonId } = data;
    const player = game.players[socket.id];
    
    const playerCard = player.currentCard;
    
    // First verify the Pokemon is actually on THIS player's card
    const pokemonOnPlayerCard = playerCard.some(p => p.id === pokemonId);
    if (!pokemonOnPlayerCard) {
      // Player clicked a Pokemon that's not on their card - ignore
      // (This could happen from lag or cheating attempts)
      return;
    }
    
    // Check if the Pokemon is also on the center card (making it the correct match)
    const pokemonOnCenterCard = game.centerCard.some(p => p.id === pokemonId);
    const wouldBeCorrect = pokemonOnPlayerCard && pokemonOnCenterCard;

    // Check if we're in grace period AND the guess was on the old center card
    const now = Date.now();
    const inGracePeriod = game.graceEndTime && 
                          now < game.graceEndTime && 
                          game.previousCenterCardIds &&
                          game.previousCenterCardIds.includes(pokemonId);

    // Prevent race conditions
    if (game.locked) {
      // If in grace period and they clicked something from the old card, no penalty
      if (inGracePeriod) {
        socket.emit('match_result', {
          correct: false,
          wasCorrectButLate: true,
          message: 'Too slow!'
        });
      }
      // Otherwise just ignore silently
      return;
    }
    
    game.locked = true;

    if (wouldBeCorrect) {
      // CORRECT MATCH!
      const correctMatch = playerCard.find(p => p.id === pokemonId);
      console.log(`${player.name} found match: ${correctMatch.name}`);

      // Store the OLD center card Pokemon IDs for grace period
      game.previousCenterCardIds = game.centerCard.map(p => p.id);
      game.graceEndTime = now + 2000; // 2 second grace period

      // Player scores a point
      player.score++;
      
      // Player's current card becomes the new center card
      // KEEP THE SAME LAYOUT - this is key!
      game.centerCard = player.currentCard;
      game.centerCardLayout = player.currentCardLayout;
      
      // Player draws a new card from the pile (if any left)
      if (game.drawPile.length > 0) {
        player.currentCard = game.drawPile.shift();
        player.currentCardLayout = generateCardLayout(player.currentCard);
      } else {
        // No more cards - game over!
        game.state = 'finished';
        
        const finalScores = {};
        game.playerOrder.forEach(id => {
          finalScores[game.players[id].name] = game.players[id].score;
        });
        
        // Find winner (highest score)
        let winnerName = player.name;
        let highestScore = 0;
        Object.entries(finalScores).forEach(([name, score]) => {
          if (score > highestScore) {
            highestScore = score;
            winnerName = name;
          }
        });
        
        // The winning Pokemon is the last match that was found
        const winningPokemonId = correctMatch.id;
        
        // Create rematch lobby for this game
        const rematchLobby = {
          players: game.playerOrder.map(id => game.players[id].socket),
          ready: new Set(),
          playerNames: {},
          deck: game.deck  // Preserve the deck for rematch
        };
        game.playerOrder.forEach(id => {
          rematchLobby.playerNames[id] = game.players[id].name;
        });
        rematchLobbies.set(gameId, rematchLobby);
        
        game.playerOrder.forEach(playerId => {
          const p = game.players[playerId];
          // Keep track of which rematch lobby this player is in
          p.socket.rematchGameId = gameId;
          p.socket.emit('game_over', {
            winner: winnerName,
            isYou: p.name === winnerName,
            finalScores: finalScores,
            gameId: gameId,
            winningPokemonId: winningPokemonId
          });
        });

        // Cleanup game but keep rematch lobby
        game.playerOrder.forEach(id => playerToGame.delete(id));
        games.delete(gameId);
        game.locked = false;
        return;
      }

      // Notify all players of the successful match
      game.playerOrder.forEach(playerId => {
        const p = game.players[playerId];
        const isMatchWinner = playerId === socket.id;
        
        p.socket.emit('match_result', {
          correct: true,
          winner: player.name,
          isYou: isMatchWinner,
          pokemonId: correctMatch.id,
          pokemonName: correctMatch.name
        });

        // Send updated game state after short delay
        setTimeout(() => {
          if (game.state === 'playing') {
            p.socket.emit('game_state', getGameStateForPlayer(game, playerId));
          }
        }, 1000);
      });

      game.lastMatchTime = Date.now();
    } else {
      // Check if in grace period AND guess was on the old card
      if (inGracePeriod) {
        // No penalty - they clicked something from the old card
        socket.emit('match_result', {
          correct: false,
          wasCorrectButLate: true,
          message: 'Too slow!'
        });
      } else {
        // WRONG MATCH - feedback with penalty
        socket.emit('match_result', {
          correct: false,
          wasCorrectButLate: false,
          message: 'Wrong! Try again.'
        });
      }
    }

    game.locked = false;
  });

  // Co-op mode: any player can claim a match for the team
  socket.on('coop_claim_match', (data) => {
    const gameId = playerToGame.get(socket.id);
    if (!gameId) return;
    
    const game = coopGames.get(gameId);
    if (!game || game.state !== 'playing') return;
    
    // Check if round already scored
    if (game.roundScored) return;
    
    const { pokemonId } = data;
    
    // Verify Pokemon is on team's card
    const pokemonOnTeamCard = game.teamCard.some(p => p.id === pokemonId);
    if (!pokemonOnTeamCard) return;
    
    // Check if it's also on the center card
    const pokemonOnCenterCard = game.centerCard.some(p => p.id === pokemonId);
    
    if (pokemonOnTeamCard && pokemonOnCenterCard) {
      // Correct match! Team scores
      game.roundScored = true;
      game.teamScore++;
      
      // Clear AI timer
      if (game.aiTimer) {
        clearTimeout(game.aiTimer);
        game.aiTimer = null;
      }
      
      const match = game.teamCard.find(p => p.id === pokemonId);
      const scorerName = game.players[socket.id] ? game.players[socket.id].name : 'Team';
      
      // Notify all players
      game.playerOrder.forEach(playerId => {
        const player = game.players[playerId];
        if (player && player.socket) {
          player.socket.emit('coop_round_result', {
            winner: 'team',
            scorerName: scorerName,
            pokemonId: match.id,
            teamScore: game.teamScore,
            aiScore: game.aiScore
          });
        }
      });
      
      // Advance game after delay
      setTimeout(() => {
        advanceCoopGame(game, true);
      }, 1000);
      
    } else {
      // Wrong guess - just notify this player
      socket.emit('coop_wrong_guess', {
        pokemonId: pokemonId
      });
    }
  });

  socket.on('request_rematch', () => {
    const gameId = socket.rematchGameId;
    if (!gameId) return;
    
    const rematchLobby = rematchLobbies.get(gameId);
    if (!rematchLobby) return;
    
    // Mark this player as ready
    rematchLobby.ready.add(socket.id);
    
    // First player to click rematch becomes host
    if (!rematchLobby.host) {
      rematchLobby.host = socket.id;
    }
    
    // Notify all players of rematch status
    const readyCount = rematchLobby.ready.size;
    const totalCount = rematchLobby.players.filter(p => p.connected).length;
    
    rematchLobby.players.forEach(p => {
      if (p.connected) {
        p.emit('rematch_status', {
          ready: readyCount,
          total: totalCount,
          isHost: p.id === rematchLobby.host,
          canStart: p.id === rematchLobby.host && readyCount >= MIN_PLAYERS
        });
      }
    });
  });

  socket.on('start_rematch', () => {
    const gameId = socket.rematchGameId;
    if (!gameId) return;
    
    const rematchLobby = rematchLobbies.get(gameId);
    if (!rematchLobby) return;
    
    // Only host can start
    if (socket.id !== rematchLobby.host) return;
    
    // Get all ready and connected players
    const readyPlayers = rematchLobby.players.filter(p => 
      p.connected && rematchLobby.ready.has(p.id)
    );
    
    if (readyPlayers.length < MIN_PLAYERS) return;
    
    // Create new game with ready players, using the same deck
    const game = createGame(readyPlayers, rematchLobby.deck || 'classic');
    
    game.playerOrder.forEach(playerId => {
      const player = game.players[playerId];
      player.socket.rematchGameId = null;
      
      player.socket.emit('game_start', {
        gameId: game.id,
        yourName: player.name,
        totalPlayers: game.playerOrder.length,
        deck: game.deck
      });
      
      player.socket.emit('game_state', getGameStateForPlayer(game, playerId));
    });
    
    // Notify players who didn't join that game started without them
    rematchLobby.players.forEach(p => {
      if (p.connected && !rematchLobby.ready.has(p.id)) {
        p.emit('rematch_expired');
        p.rematchGameId = null;
      }
    });
    
    // Clean up rematch lobby
    rematchLobbies.delete(gameId);
    
    console.log(`Rematch started with ${readyPlayers.length} players using ${DECKS[game.deck].name} deck`);
  });

  socket.on('leave_game', () => {
    // Check if in co-op game
    const coopGameId = playerToGame.get(socket.id);
    if (coopGameId && coopGameId.startsWith('coop_')) {
      const game = coopGames.get(coopGameId);
      if (game) {
        handleCoopPlayerLeave(socket, game, coopGameId);
        
        if (socket.sessionId) {
          sessions.delete(socket.sessionId);
        }
        return;
      }
    }
    
    // Check if in active versus game
    const activeGameId = playerToGame.get(socket.id);
    if (activeGameId) {
      const game = games.get(activeGameId);
      if (game && game.state === 'playing') {
        handlePlayerLeaveGame(socket, game, activeGameId);
        
        // Clear session
        if (socket.sessionId) {
          sessions.delete(socket.sessionId);
        }
        return;
      }
    }
    
    // Check if in rematch lobby
    const gameId = socket.rematchGameId;
    if (!gameId) return;
    
    const rematchLobby = rematchLobbies.get(gameId);
    if (!rematchLobby) return;
    
    // Remove player from rematch lobby
    rematchLobby.players = rematchLobby.players.filter(p => p.id !== socket.id);
    rematchLobby.ready.delete(socket.id);
    socket.rematchGameId = null;
    
    // Clear session
    if (socket.sessionId) {
      sessions.delete(socket.sessionId);
    }
    
    // Notify remaining players
    if (rematchLobby.players.length > 0) {
      rematchLobby.players.forEach(p => {
        p.emit('player_left_rematch', {
          playersLeft: rematchLobby.players.length
        });
      });
    }
    
    // Clean up if empty
    if (rematchLobby.players.length === 0) {
      rematchLobbies.delete(gameId);
    }
  });

  // Handle player leaving co-op game
  function handleCoopPlayerLeave(socket, game, gameId) {
    const leavingPlayer = game.players[socket.id];
    if (!leavingPlayer) return;
    
    delete game.players[socket.id];
    game.playerOrder = game.playerOrder.filter(id => id !== socket.id);
    playerToGame.delete(socket.id);
    
    console.log(`${leavingPlayer.name} left the co-op game`);
    
    // Notify remaining players
    game.playerOrder.forEach(playerId => {
      const player = game.players[playerId];
      if (player && player.socket) {
        player.socket.emit('coop_player_left', {
          name: leavingPlayer.name,
          playersRemaining: game.playerOrder.length
        });
      }
    });
    
    // If no players left, end the game
    if (game.playerOrder.length === 0) {
      if (game.aiTimer) {
        clearTimeout(game.aiTimer);
        game.aiTimer = null;
      }
      coopGames.delete(gameId);
      console.log(`Co-op game ${gameId} ended - all players left`);
    }
  }

  function handlePlayerLeaveGame(socket, game, gameId) {
    const leavingPlayer = game.players[socket.id];
    if (!leavingPlayer) return;
    
    // Remove player from game
    delete game.players[socket.id];
    game.playerOrder = game.playerOrder.filter(id => id !== socket.id);
    playerToGame.delete(socket.id);
    
    console.log(`${leavingPlayer.name} left the game`);
    
    // If only 1 player left, they win
    if (game.playerOrder.length < 2) {
      game.state = 'finished';
      
      const lastPlayerId = game.playerOrder[0];
      const winner = game.players[lastPlayerId];
      
      const finalScores = {};
      finalScores[winner.name] = winner.score;
      finalScores[leavingPlayer.name] = leavingPlayer.score + ' (left)';
      
      // Create rematch lobby
      const rematchLobby = {
        players: [winner.socket],
        ready: new Set(),
        playerNames: { [lastPlayerId]: winner.name },
        host: null,
        deck: game.deck  // Preserve the deck
      };
      rematchLobbies.set(gameId, rematchLobby);
      
      winner.socket.rematchGameId = gameId;
      winner.socket.emit('game_over', {
        winner: winner.name,
        isYou: true,
        finalScores: finalScores,
        gameId: gameId,
        winningPokemonId: 25
      });
      
      playerToGame.delete(lastPlayerId);
      games.delete(gameId);
    } else {
      // Notify remaining players
      game.playerOrder.forEach(id => {
        const p = game.players[id];
        p.socket.emit('player_left_game', {
          name: leavingPlayer.name,
          playersRemaining: game.playerOrder.length
        });
        p.socket.emit('game_state', getGameStateForPlayer(game, id));
      });
    }
  }

  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);

    // If has session, set timeout for reconnection
    if (socket.sessionId) {
      const session = sessions.get(socket.sessionId);
      if (session) {
        session.disconnectTimeout = setTimeout(() => {
          // Timeout expired, remove player permanently
          console.log(`Session timeout for ${socket.playerName}`);
          
          // Handle lobby disconnect
          const lobbyCode = playerToLobby.get(socket.id);
          if (lobbyCode) {
            const lobby = lobbies.get(lobbyCode);
            if (lobby) {
              handleLobbyLeave(socket, lobby, lobbyCode);
            }
          }

          // Handle co-op game disconnect
          const gameId = playerToGame.get(socket.id);
          if (gameId && gameId.startsWith('coop_')) {
            const coopGame = coopGames.get(gameId);
            if (coopGame) {
              handleCoopPlayerLeave(socket, coopGame, gameId);
            }
          } else if (gameId) {
            // Handle regular game disconnect
            const game = games.get(gameId);
            if (game && game.state === 'playing') {
              handlePlayerLeaveGame(socket, game, gameId);
            }
          }
          
          // Handle rematch lobby disconnect
          handleRematchDisconnect(socket);
          
          sessions.delete(socket.sessionId);
        }, SESSION_TIMEOUT);
        
        return; // Don't remove immediately, wait for timeout
      }
    }

    // No session - handle immediately
    // Handle lobby disconnect
    const lobbyCode = playerToLobby.get(socket.id);
    if (lobbyCode) {
      const lobby = lobbies.get(lobbyCode);
      if (lobby) {
        handleLobbyLeave(socket, lobby, lobbyCode);
      }
    }

    // Handle co-op game disconnect
    const gameId = playerToGame.get(socket.id);
    if (gameId && gameId.startsWith('coop_')) {
      const coopGame = coopGames.get(gameId);
      if (coopGame) {
        handleCoopPlayerLeave(socket, coopGame, gameId);
      }
    } else if (gameId) {
      // Handle regular game disconnect
      const game = games.get(gameId);
      if (game && game.state === 'playing') {
        handlePlayerLeaveGame(socket, game, gameId);
      }
    }
    
    // Handle rematch lobby disconnect
    handleRematchDisconnect(socket);
  });

  function handleRematchDisconnect(socket) {
    const rematchGameId = socket.rematchGameId;
    if (rematchGameId) {
      const rematchLobby = rematchLobbies.get(rematchGameId);
      if (rematchLobby) {
        rematchLobby.players = rematchLobby.players.filter(p => p.id !== socket.id);
        rematchLobby.ready.delete(socket.id);
        
        if (rematchLobby.host === socket.id && rematchLobby.players.length > 0) {
          const newHost = rematchLobby.players.find(p => rematchLobby.ready.has(p.id));
          rematchLobby.host = newHost ? newHost.id : null;
        }
        
        const readyCount = rematchLobby.ready.size;
        const totalCount = rematchLobby.players.filter(p => p.connected).length;
        
        rematchLobby.players.forEach(p => {
          if (p.connected) {
            p.emit('rematch_status', {
              ready: readyCount,
              total: totalCount,
              isHost: p.id === rematchLobby.host,
              canStart: p.id === rematchLobby.host && readyCount >= MIN_PLAYERS
            });
          }
        });
        
        if (rematchLobby.players.length === 0) {
          rematchLobbies.delete(rematchGameId);
        }
      }
    }
  }
});

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🎮 Pokémon Spot It server running on port ${PORT}`);
  console.log(`   Open http://localhost:${PORT} to play`);
});
