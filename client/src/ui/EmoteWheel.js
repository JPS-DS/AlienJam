/**
 * EmoteWheel — radial emote picker triggered by right-click or E key.
 */
const EMOTES = [
  { id: 'wave',  emoji: '👋' },
  { id: 'dance', emoji: '💃' },
  { id: 'laugh', emoji: '😂' },
  { id: 'cry',   emoji: '😭' },
  { id: 'heart', emoji: '❤️' },
  { id: 'think', emoji: '🤔' },
  { id: 'zzz',   emoji: '💤' },
  { id: 'alien', emoji: '👽' }
];

export default class EmoteWheel {
  constructor(socket) {
    this.socket = socket;
    this.el = document.getElementById('emote-wheel');
    this._build();
    this._bindGlobalEvents();
  }

  _build() {
    this.el.innerHTML = '';
    EMOTES.forEach(({ id, emoji }) => {
      const btn = document.createElement('button');
      btn.textContent = emoji;
      btn.title = id;
      btn.addEventListener('click', () => {
        this.socket.emit('emote:play', { emoteId: id });
        this.hide();
      });
      this.el.appendChild(btn);
    });
  }

  _bindGlobalEvents() {
    // Right-click on game canvas
    const canvas = document.querySelector('#game-container canvas');
    if (canvas) {
      canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.show(e.clientX, e.clientY);
      });
    }

    // E key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'e' || e.key === 'E') {
        if (this.el.classList.contains('visible')) {
          this.hide();
        } else {
          const cx = window.innerWidth / 2;
          const cy = window.innerHeight / 2;
          this.show(cx, cy);
        }
      }
      if (e.key === 'Escape') this.hide();
    });

    // Click outside to close
    document.addEventListener('click', (e) => {
      if (!this.el.contains(e.target)) this.hide();
    });
  }

  show(x, y) {
    this.el.style.left = `${x}px`;
    this.el.style.top = `${y}px`;
    this.el.classList.add('visible');
  }

  hide() {
    this.el.classList.remove('visible');
  }
}
