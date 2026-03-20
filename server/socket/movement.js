const db = require('../db');

function registerMovementHandlers(socket, io) {
  // Player requests to move to x, y
  socket.on('player:move', ({ x, y }) => {
    if (!socket.userId || !socket.currentArea) return;
    if (typeof x !== 'number' || typeof y !== 'number') return;

    // Clamp to sane bounds
    x = Math.max(0, Math.min(x, 2000));
    y = Math.max(0, Math.min(y, 2000));

    // Broadcast to room (including sender for confirmation)
    io.to(socket.currentArea).emit('player:moved', {
      id: socket.userId,
      x,
      y
    });
  });

  // Player has finished moving — persist final position
  socket.on('player:stopped', ({ x, y }) => {
    if (!socket.userId) return;
    if (typeof x !== 'number' || typeof y !== 'number') return;

    x = Math.max(0, Math.min(x, 2000));
    y = Math.max(0, Math.min(y, 2000));

    db.prepare(
      'UPDATE characters SET x = ?, y = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?'
    ).run(x, y, socket.userId);
  });
}

module.exports = { registerMovementHandlers };
