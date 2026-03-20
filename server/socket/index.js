const { verifyToken } = require('../auth');
const db = require('../db');
const { registerMovementHandlers } = require('./movement');
const { registerChatHandlers } = require('./chat');

const VALID_AREAS = ['hub', 'crystal_cave', 'neon_market'];

// In-memory map of userId -> player state (for fast area lookups)
const connectedPlayers = new Map();

function setupSocket(io) {
  // Auth middleware for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      const decoded = verifyToken(token);
      socket.userId = decoded.id;
      socket.username = decoded.username;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.username} (${socket.userId})`);

    // Load character from DB
    const character = db.prepare('SELECT * FROM characters WHERE user_id = ?').get(socket.userId);
    const startArea = character?.planet || 'hub';

    socket.currentArea = startArea;

    // Join area room
    joinArea(socket, io, startArea, character);

    // Register handlers
    registerMovementHandlers(socket, io);
    registerChatHandlers(socket, io);

    // Player requests to change area
    socket.on('player:join_area', ({ area }) => {
      if (!VALID_AREAS.includes(area)) return;
      if (area === socket.currentArea) return;

      // Update planet in DB
      db.prepare('UPDATE characters SET planet = ? WHERE user_id = ?').run(area, socket.userId);

      joinArea(socket, io, area, character);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${socket.username}`);
      if (socket.currentArea) {
        socket.to(socket.currentArea).emit('player:left', { id: socket.userId });
      }
      connectedPlayers.delete(socket.userId);
    });
  });
}

function joinArea(socket, io, area, characterData) {
  const prevArea = socket.currentArea;

  // Notify old room
  if (prevArea && prevArea !== area) {
    socket.to(prevArea).emit('player:left', { id: socket.userId });
    socket.leave(prevArea);
  }

  socket.currentArea = area;
  socket.join(area);

  // Build this player's state
  const char = db.prepare('SELECT * FROM characters WHERE user_id = ?').get(socket.userId);
  const playerState = {
    id: socket.userId,
    username: socket.username,
    species: char?.species || 'blob',
    color: char?.color || '#7CFC00',
    accessories: char ? JSON.parse(char.accessories) : [],
    x: char?.x || 400,
    y: char?.y || 300,
    area
  };

  // Track in memory
  connectedPlayers.set(socket.userId, { ...playerState, socketId: socket.id });

  // Send current area state to joining player
  const othersInArea = [];
  connectedPlayers.forEach((p, uid) => {
    if (uid !== socket.userId && p.area === area) {
      othersInArea.push(p);
    }
  });

  socket.emit('area:state', {
    area,
    players: othersInArea,
    self: playerState
  });

  // Announce this player to the rest of the room
  socket.to(area).emit('player:joined', playerState);
}

module.exports = { setupSocket };
