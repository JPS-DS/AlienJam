/**
 * ChatPanel — Discord-like chat sidebar (HTML overlay, not canvas).
 * Manages area tabs, message history, and input.
 */
export default class ChatPanel {
  constructor(socket, currentArea) {
    this.socket = socket;
    this.currentArea = currentArea;
    this.messageHistory = { hub: [], crystal_cave: [], neon_market: [] };

    this.messagesEl = document.getElementById('chat-messages');
    this.inputEl = document.getElementById('chat-input');
    this.sendBtn = document.getElementById('chat-send');
    this.areasEl = document.getElementById('chat-areas');
    this.onlineCountEl = document.getElementById('online-count');

    this._buildAreaTabs();
    this._bindEvents();
    this._listenSocket();
  }

  _buildAreaTabs() {
    const areas = [
      { id: 'hub', label: '🌍 Hub' },
      { id: 'crystal_cave', label: '💎 Cave' },
      { id: 'neon_market', label: '🌆 Market' }
    ];

    this.areasEl.innerHTML = '';
    areas.forEach(({ id, label }) => {
      const btn = document.createElement('button');
      btn.textContent = label;
      btn.dataset.area = id;
      if (id === this.currentArea) btn.classList.add('active');
      btn.addEventListener('click', () => {
        this.setActiveArea(id);
      });
      this.areasEl.appendChild(btn);
    });
  }

  setActiveArea(area) {
    this.currentArea = area;
    document.querySelectorAll('#chat-areas button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.area === area);
    });
    this._renderMessages(area);
  }

  setOnlineCount(count) {
    if (this.onlineCountEl) this.onlineCountEl.textContent = count;
  }

  _bindEvents() {
    this.sendBtn.addEventListener('click', () => this._sendMessage());
    this.inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this._sendMessage();
    });
  }

  _sendMessage() {
    const text = this.inputEl.value.trim();
    if (!text) return;
    this.inputEl.value = '';
    this.socket.emit('chat:message', { text });
  }

  _listenSocket() {
    this.socket.on('chat:received', (msg) => {
      const area = msg.area || this.currentArea;
      if (!this.messageHistory[area]) this.messageHistory[area] = [];
      this.messageHistory[area].push(msg);

      // Keep last 100 messages per area
      if (this.messageHistory[area].length > 100) {
        this.messageHistory[area].shift();
      }

      if (area === this.currentArea) {
        this._appendMessage(msg);
      }
    });
  }

  addSystemMessage(text, area) {
    const a = area || this.currentArea;
    const msg = { system: true, text, timestamp: Date.now() };
    if (!this.messageHistory[a]) this.messageHistory[a] = [];
    this.messageHistory[a].push(msg);
    if (a === this.currentArea) this._appendSystemMessage(text);
  }

  _renderMessages(area) {
    this.messagesEl.innerHTML = '';
    const msgs = this.messageHistory[area] || [];
    msgs.forEach(msg => {
      if (msg.system) this._appendSystemMessage(msg.text);
      else this._appendMessage(msg);
    });
  }

  _appendMessage(msg) {
    const div = document.createElement('div');
    div.className = 'chat-message';

    const author = document.createElement('div');
    author.className = 'author';
    author.textContent = msg.username;
    // Color based on username hash
    author.style.color = this._usernameColor(msg.username);

    const text = document.createElement('div');
    text.className = 'text';
    text.textContent = msg.text;

    div.appendChild(author);
    div.appendChild(text);
    this.messagesEl.appendChild(div);
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }

  _appendSystemMessage(text) {
    const div = document.createElement('div');
    div.className = 'chat-message system';
    div.textContent = text;
    this.messagesEl.appendChild(div);
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }

  _usernameColor(username) {
    const colors = ['#a78bfa', '#34d399', '#f59e0b', '#60a5fa', '#f472b6', '#fb923c', '#4ade80'];
    let hash = 0;
    for (const ch of username) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffff;
    return colors[hash % colors.length];
  }

  destroy() {
    this.socket.off('chat:received');
  }
}
