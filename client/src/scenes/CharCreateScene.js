/**
 * CharCreateScene — pick species, color, accessories. Then jump to hub.
 */
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

const SPECIES = ['blob', 'tentacle', 'crystal', 'bug'];
const COLORS = ['#7CFC00', '#FF69B4', '#00BFFF', '#FFD700', '#FF4500', '#9B59B6', '#1ABC9C', '#F39C12'];
const ACCESSORIES = ['antenna', 'hat', 'glasses', 'bow', 'crown', 'scarf'];

export default class CharCreateScene extends Phaser.Scene {
  constructor() {
    super('CharCreateScene');
  }

  init(data) {
    this.token = data.token;
    this.username = data.username;
    this.userId = data.userId;
    this.fromBoot = data.fromBoot;
  }

  async create() {
    // If returning player, try to load existing character
    if (this.fromBoot) {
      try {
        const res = await fetch(`${SERVER_URL}/api/character`, {
          headers: { 'Authorization': `Bearer ${this.token}` }
        });
        const data = await res.json();
        if (data.character) {
          this._startGame(data.character);
          return;
        }
      } catch {
        // Fall through to character creation
      }
    }
    this._showCharCreate();
  }

  _showCharCreate() {
    const overlay = document.getElementById('ui-overlay');
    overlay.classList.remove('hidden');

    let selectedSpecies = SPECIES[0];
    let selectedColor = COLORS[0];
    let selectedAccessories = [];

    const render = () => {
      overlay.innerHTML = `
        <div class="panel" style="width:420px; max-height:90vh; overflow-y:auto">
          <h2>🧬 Create Your Alien</h2>
          <p class="subtitle">Welcome, ${this.username}! Choose your form.</p>
          <div class="error" id="cc-error"></div>

          <label>Species</label>
          <div class="species-grid" id="species-grid">
            ${SPECIES.map(s => `
              <div class="species-btn ${s === selectedSpecies ? 'selected' : ''}" data-species="${s}">
                <canvas width="48" height="48" data-preview="${s}" data-color="${selectedColor}"></canvas>
                <span>${s}</span>
              </div>
            `).join('')}
          </div>

          <label>Color</label>
          <div class="color-picker-row" id="color-row">
            ${COLORS.map(c => `
              <div class="color-swatch ${c === selectedColor ? 'selected' : ''}"
                   data-color="${c}"
                   style="background:${c}">
              </div>
            `).join('')}
          </div>

          <label>Accessories (pick any)</label>
          <div class="accessories-row" id="accessories-row">
            ${ACCESSORIES.map(a => `
              <button class="accessory-btn ${selectedAccessories.includes(a) ? 'selected' : ''}"
                      data-acc="${a}">
                ${this._accLabel(a)}
              </button>
            `).join('')}
          </div>

          <button class="btn-primary" id="cc-submit">Enter the Universe 🚀</button>
        </div>
      `;

      // Draw previews
      SPECIES.forEach(s => {
        const canvas = overlay.querySelector(`canvas[data-preview="${s}"]`);
        if (canvas) this._drawPreview(canvas, s, selectedColor);
      });

      // Species click
      overlay.querySelectorAll('.species-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          selectedSpecies = btn.dataset.species;
          render();
        });
      });

      // Color click
      overlay.querySelectorAll('.color-swatch').forEach(swatch => {
        swatch.addEventListener('click', () => {
          selectedColor = swatch.dataset.color;
          render();
        });
      });

      // Accessory toggle
      overlay.querySelectorAll('.accessory-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const acc = btn.dataset.acc;
          if (selectedAccessories.includes(acc)) {
            selectedAccessories = selectedAccessories.filter(a => a !== acc);
          } else {
            selectedAccessories.push(acc);
          }
          render();
        });
      });

      // Submit
      document.getElementById('cc-submit').addEventListener('click', () => {
        this._saveCharacter(selectedSpecies, selectedColor, selectedAccessories);
      });
    };

    render();
  }

  _drawPreview(canvas, species, color) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 48, 48);
    ctx.save();
    ctx.translate(24, 28);

    const hexToRgb = (hex) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return { r, g, b };
    };
    const darken = (hex, amt = 40) => {
      const { r, g, b } = hexToRgb(hex);
      return `rgb(${Math.max(0, r - amt)},${Math.max(0, g - amt)},${Math.max(0, b - amt)})`;
    };

    ctx.fillStyle = color;

    switch (species) {
      case 'blob':
        ctx.beginPath(); ctx.ellipse(0, 0, 18, 16, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-6, -4, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(6, -4, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#220044'; ctx.beginPath(); ctx.arc(-5, -4, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(7, -4, 2.5, 0, Math.PI * 2); ctx.fill();
        break;
      case 'tentacle':
        for (let i = -2; i <= 2; i++) {
          ctx.fillStyle = darken(color);
          ctx.beginPath(); ctx.ellipse(i * 5, 11, 3, 7, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = color;
          ctx.beginPath(); ctx.ellipse(i * 5, 10, 3, 7, 0, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(0, -2, 13, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-5, -4, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(5, -4, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#003322'; ctx.beginPath(); ctx.arc(-4, -4, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(6, -4, 2, 0, Math.PI * 2); ctx.fill();
        break;
      case 'crystal':
        ctx.beginPath(); ctx.moveTo(-14, 12); ctx.lineTo(14, 12); ctx.lineTo(0, -14); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath(); ctx.moveTo(-14, 12); ctx.lineTo(-3, 12); ctx.lineTo(-6, -4); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.fillRect(-7, -2, 5, 5); ctx.fillRect(2, -2, 5, 5);
        ctx.fillStyle = '#001133'; ctx.fillRect(-6, -1, 3, 3); ctx.fillRect(3, -1, 3, 3);
        break;
      case 'bug':
        ctx.beginPath(); ctx.ellipse(0, 2, 14, 18, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath(); ctx.ellipse(-8, 0, 8, 12, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(8, 0, 8, 12, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = darken(color); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(-4, -12); ctx.lineTo(-8, -18); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(4, -12); ctx.lineTo(8, -18); ctx.stroke();
        ctx.fillStyle = darken(color); ctx.beginPath(); ctx.arc(-8, -19, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(8, -19, 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(-5, -5, 5, 4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(5, -5, 5, 4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#220000'; ctx.beginPath(); ctx.arc(-5, -5, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(5, -5, 2, 0, Math.PI * 2); ctx.fill();
        break;
    }

    ctx.restore();
  }

  _accLabel(acc) {
    const labels = { antenna: '📡 Antenna', hat: '🎩 Hat', glasses: '🕶 Glasses', bow: '🎀 Bow', crown: '👑 Crown', scarf: '🧣 Scarf' };
    return labels[acc] || acc;
  }

  async _saveCharacter(species, color, accessories) {
    const errorEl = document.getElementById('cc-error');
    const submitBtn = document.getElementById('cc-submit');

    errorEl?.classList.remove('visible');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Saving...'; }

    try {
      const res = await fetch(`${SERVER_URL}/api/character`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify({ species, color, accessories })
      });
      const data = await res.json();

      if (!res.ok) {
        if (errorEl) { errorEl.textContent = data.error || 'Failed to save'; errorEl.classList.add('visible'); }
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Enter the Universe 🚀'; }
        return;
      }

      document.getElementById('ui-overlay').classList.add('hidden');
      this._startGame(data.character);
    } catch {
      if (errorEl) { errorEl.textContent = 'Connection error'; errorEl.classList.add('visible'); }
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Enter the Universe 🚀'; }
    }
  }

  _startGame(character) {
    document.getElementById('app').style.display = 'flex';
    document.getElementById('loading-screen').classList.add('hidden');

    this.scene.start('HubPlanetScene', {
      token: this.token,
      username: this.username,
      userId: this.userId,
      character
    });
  }
}
