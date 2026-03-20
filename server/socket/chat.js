const MAX_MSG_LENGTH = 200;
const MSG_COOLDOWN_MS = 500;
const lastMessageTime = new Map();

function registerChatHandlers(socket, io) {
  socket.on('chat:message', ({ text }) => {
    if (!socket.userId || !socket.currentArea) return;
    if (typeof text !== 'string') return;

    text = text.trim().slice(0, MAX_MSG_LENGTH);
    if (!text) return;

    // Basic rate limiting
    const now = Date.now();
    const last = lastMessageTime.get(socket.userId) || 0;
    if (now - last < MSG_COOLDOWN_MS) return;
    lastMessageTime.set(socket.userId, now);

    io.to(socket.currentArea).emit('chat:received', {
      id: socket.userId,
      username: socket.username,
      text,
      timestamp: now,
      area: socket.currentArea
    });
  });

  socket.on('emote:play', ({ emoteId }) => {
    if (!socket.userId || !socket.currentArea) return;

    const VALID_EMOTES = ['wave', 'dance', 'laugh', 'cry', 'heart', 'think', 'zzz', 'alien'];
    if (!VALID_EMOTES.includes(emoteId)) return;

    io.to(socket.currentArea).emit('emote:played', {
      id: socket.userId,
      emoteId
    });
  });

  socket.on('disconnect', () => {
    lastMessageTime.delete(socket.userId);
  });
}

module.exports = { registerChatHandlers };
