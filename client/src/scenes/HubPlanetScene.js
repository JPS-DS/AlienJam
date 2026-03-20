import AlienPlayer from '../objects/AlienPlayer.js';
import RemotePlayer from '../objects/RemotePlayer.js';
import ChatPanel from '../ui/ChatPanel.js';
import EmoteWheel from '../ui/EmoteWheel.js';
import { connectSocket } from '../socket.js';

const AREA_ID = 'hub';
const WORLD_W = 1600;
const WORLD_H = 900;

export default class HubPlanetScene extends Phaser.Scene {
  constructor() {
    super('HubPlanetScene');
  }

  init(data) {
    this.token = data.token;
    this.username = data.username;
    this.userId = data.userId;
    this.character = data.character;
    this.remotePlayers = new Map();
  }

  create() {
    this._buildWorld();
    this._buildPortals();
    this._buildAreaNav();

    // Connect socket
    this.socket = connectSocket(this.token);
    this.socket.on('connect', () => this._onSocketConnect());
    this.socket.on('disconnect', () => this._onSocketDisconnect());

    // Setup UI
    this.chatPanel = new ChatPanel(this.socket, AREA_ID);
    this.emoteWheel = new EmoteWheel(this.socket);

    // Socket event listeners
    this._bindSocketEvents();

    // Camera follow
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);

    // Move indicator (click target dot)
    this.moveIndicator = this.add.circle(0, 0, 6, 0xa78bfa, 0.7).setDepth(0).setVisible(false);
    this.input.on('pointerdown', (p) => {
      if (p.rightButtonDown()) return;
      this.moveIndicator.setPosition(p.worldX, p.worldY).setVisible(true);
      this.time.delayedCall(600, () => this.moveIndicator.setVisible(false));
    });
  }

  _buildWorld() {
    const gfx = this.add.graphics();

    // Sky gradient background
    gfx.fillGradientStyle(0x0a0a2e, 0x0a0a2e, 0x1a0a3e, 0x1a0a3e, 1);
    gfx.fillRect(0, 0, WORLD_W, WORLD_H);

    // Stars (random but seeded-looking)
    gfx.fillStyle(0xffffff, 1);
    const stars = [
      [120, 80], [340, 45], [600, 120], [820, 30], [1050, 90], [1300, 55],
      [1500, 140], [80, 200], [450, 180], [900, 160], [1200, 200], [1550, 80],
      [200, 350], [700, 300], [1100, 320], [1400, 280], [50, 480], [500, 450],
      [950, 490], [1350, 460], [250, 650], [750, 620], [1150, 660], [1450, 640]
    ];
    stars.forEach(([x, y]) => {
      const r = (x * y) % 3 === 0 ? 2 : 1;
      gfx.fillCircle(x, y, r);
    });

    // Ground platform
    gfx.fillStyle(0x1a0d3e, 1);
    gfx.fillRect(0, WORLD_H - 120, WORLD_W, 120);
    gfx.fillStyle(0x2d1b69, 1);
    gfx.fillRect(0, WORLD_H - 122, WORLD_W, 6);

    // Central platform
    this._drawPlatform(gfx, WORLD_W / 2 - 200, WORLD_H - 160, 400, 40);

    // Side platforms
    this._drawPlatform(gfx, 150, WORLD_H - 260, 200, 30);
    this._drawPlatform(gfx, WORLD_W - 350, WORLD_H - 260, 200, 30);

    // Floating islands
    this._drawIsland(gfx, 300, 400, 120, 50);
    this._drawIsland(gfx, 1100, 350, 100, 40);
    this._drawIsland(gfx, 700, 250, 140, 55);

    // Alien plants
    this._drawPlant(gfx, 200, WORLD_H - 120, 0x7CFC00);
    this._drawPlant(gfx, 400, WORLD_H - 120, 0xFF69B4);
    this._drawPlant(gfx, 800, WORLD_H - 120, 0x00BFFF);
    this._drawPlant(gfx, 1200, WORLD_H - 120, 0xFFD700);
    this._drawPlant(gfx, 1450, WORLD_H - 120, 0x9B59B6);

    // Hub title sign
    const title = this.add.text(WORLD_W / 2, 40, '🌍 HUB PLANET', {
      fontSize: '20px',
      fill: '#a78bfa',
      stroke: '#000',
      strokeThickness: 4,
      fontStyle: 'bold'
    }).setOrigin(0.5, 0);

    // Spawn local player
    const spawnX = this.character?.x || WORLD_W / 2;
    const spawnY = this.character?.y || (WORLD_H - 180);
    this.localPlayer = new AlienPlayer(this, spawnX, spawnY, {
      ...this.character,
      username: this.username
    });
    this.localPlayer.setDepth(5);
    this.cameras.main.startFollow(this.localPlayer, true, 0.1, 0.1);
  }

  _drawPlatform(gfx, x, y, w, h) {
    gfx.fillStyle(0x2d1b69, 1);
    gfx.fillRoundedRect(x, y, w, h, 8);
    gfx.fillStyle(0x5b21b6, 1);
    gfx.fillRoundedRect(x, y, w, 6, { tl: 8, tr: 8, bl: 0, br: 0 });
  }

  _drawIsland(gfx, x, y, w, h) {
    gfx.fillStyle(0x1a0d3e, 1);
    gfx.fillEllipse(x, y + h / 2, w, h);
    gfx.fillStyle(0x2d1b69, 1);
    gfx.fillEllipse(x, y, w, h * 0.5);
    gfx.fillStyle(0x5b21b6, 0.6);
    gfx.fillEllipse(x, y, w * 0.6, h * 0.2);
  }

  _drawPlant(gfx, x, y, color) {
    const stem = Math.floor((x * 13) % 20) + 30;
    gfx.lineStyle(3, color, 1);
    gfx.strokePoints([
      new Phaser.Geom.Point(x, y),
      new Phaser.Geom.Point(x - 5, y - stem * 0.6),
      new Phaser.Geom.Point(x, y - stem)
    ], false);
    gfx.fillStyle(color, 0.8);
    gfx.fillCircle(x, y - stem, 10);
    gfx.fillStyle(color, 0.4);
    gfx.fillCircle(x - 10, y - stem + 5, 7);
    gfx.fillCircle(x + 8, y - stem + 3, 7);
  }

  _buildPortals() {
    this.portals = [
      {
        x: 100, y: WORLD_H - 160,
        label: '💎 Crystal Cave',
        targetScene: 'CrystalCaveScene',
        area: 'crystal_cave',
        color: 0x00BFFF
      },
      {
        x: WORLD_W - 100, y: WORLD_H - 160,
        label: '🌆 Neon Market',
        targetScene: 'NeonMarketScene',
        area: 'neon_market',
        color: 0xFF69B4
      }
    ];

    this.portals.forEach(portal => {
      const gfx = this.add.graphics();
      this._drawPortal(gfx, portal.color);
      gfx.setPosition(portal.x, portal.y);

      const label = this.add.text(portal.x, portal.y + 45, portal.label, {
        fontSize: '12px', fill: '#ffffff', stroke: '#000', strokeThickness: 3, align: 'center'
      }).setOrigin(0.5, 0);

      // Animate portal glow
      this.tweens.add({
        targets: gfx,
        angle: 360,
        duration: 8000,
        repeat: -1,
        ease: 'Linear'
      });

      // Make clickable
      gfx.setInteractive(new Phaser.Geom.Circle(0, 0, 32), Phaser.Geom.Circle.Contains);
      gfx.on('pointerover', () => { label.setStyle({ fill: '#a78bfa' }); });
      gfx.on('pointerout', () => { label.setStyle({ fill: '#ffffff' }); });
      gfx.on('pointerdown', () => this._travelTo(portal));
      gfx.input.cursor = 'pointer';
    });
  }

  _drawPortal(gfx, color) {
    // Outer ring
    gfx.lineStyle(4, color, 0.8);
    gfx.strokeCircle(0, 0, 32);
    // Inner ring
    gfx.lineStyle(2, color, 0.5);
    gfx.strokeCircle(0, 0, 24);
    // Swirl spokes
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      gfx.lineStyle(2, color, 0.6);
      gfx.strokePoints([
        new Phaser.Geom.Point(0, 0),
        new Phaser.Geom.Point(Math.cos(angle) * 22, Math.sin(angle) * 22)
      ], false);
    }
    // Center glow
    gfx.fillStyle(color, 0.3);
    gfx.fillCircle(0, 0, 16);
  }

  _buildAreaNav() {
    const nav = document.getElementById('area-nav');
    const areas = [
      { id: 'hub', scene: 'HubPlanetScene', label: '🌍 Hub' },
      { id: 'crystal_cave', scene: 'CrystalCaveScene', label: '💎 Cave' },
      { id: 'neon_market', scene: 'NeonMarketScene', label: '🌆 Market' }
    ];

    nav.innerHTML = areas.map(a => `
      <button data-scene="${a.scene}" data-area="${a.id}"
              class="${a.id === AREA_ID ? 'active' : ''}">
        ${a.label}
      </button>
    `).join('');

    nav.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        const portal = this.portals?.find(p => p.area === btn.dataset.area);
        if (portal) this._travelTo(portal);
      });
    });
  }

  _travelTo(portal) {
    if (portal.area === AREA_ID) return;

    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.time.delayedCall(400, () => {
      this.chatPanel?.destroy();
      this.socket?.off();
      this.scene.start(portal.targetScene, {
        token: this.token,
        username: this.username,
        userId: this.userId,
        character: this.character
      });
    });
  }

  _onSocketConnect() {
    console.log('[Socket] Connected to AlienJam server');
    this.chatPanel?.addSystemMessage('Connected to Hub Planet', AREA_ID);
  }

  _onSocketDisconnect() {
    this.chatPanel?.addSystemMessage('Disconnected from server', AREA_ID);
    this.remotePlayers.forEach(rp => rp.destroy());
    this.remotePlayers.clear();
  }

  _bindSocketEvents() {
    // Receive area state (all current players when we join)
    this.socket.on('area:state', ({ players, self }) => {
      players.forEach(p => this._spawnRemotePlayer(p));

      // Sync local player position from server
      if (self && this.localPlayer) {
        this.localPlayer.setPosition(self.x, self.y);
      }

      this.chatPanel?.setOnlineCount(players.length + 1);
    });

    // New player joined this area
    this.socket.on('player:joined', (p) => {
      if (p.id === this.userId) return;
      this._spawnRemotePlayer(p);
      this.chatPanel?.addSystemMessage(`${p.username} arrived`, AREA_ID);

      const count = this.remotePlayers.size + 1;
      this.chatPanel?.setOnlineCount(count);
    });

    // Player left
    this.socket.on('player:left', ({ id }) => {
      const rp = this.remotePlayers.get(id);
      if (rp) {
        this.chatPanel?.addSystemMessage(`${rp.playerData.username} left`, AREA_ID);
        rp.destroy();
        this.remotePlayers.delete(id);
        this.chatPanel?.setOnlineCount(this.remotePlayers.size + 1);
      }
    });

    // Player moved
    this.socket.on('player:moved', ({ id, x, y }) => {
      if (id === this.userId) return;
      const rp = this.remotePlayers.get(id);
      if (rp) rp.moveTo(x, y);
    });

    // Chat received (with speech bubble on player)
    this.socket.on('chat:received', ({ id, text }) => {
      if (id === this.userId) {
        this.localPlayer?.showChatBubble?.(text);
      } else {
        const rp = this.remotePlayers.get(id);
        if (rp) rp.showChatBubble(text);
      }
    });

    // Emote
    this.socket.on('emote:played', ({ id, emoteId }) => {
      if (id === this.userId) {
        this._showLocalEmote(emoteId);
      } else {
        const rp = this.remotePlayers.get(id);
        if (rp) rp.showEmote(emoteId);
      }
    });
  }

  _spawnRemotePlayer(playerData) {
    if (this.remotePlayers.has(playerData.id)) {
      this.remotePlayers.get(playerData.id).destroy();
    }
    const rp = new RemotePlayer(this, playerData);
    this.remotePlayers.set(playerData.id, rp);
  }

  _showLocalEmote(emoteId) {
    const EMOTE_MAP = { wave: '👋', dance: '💃', laugh: '😂', cry: '😭', heart: '❤️', think: '🤔', zzz: '💤', alien: '👽' };
    if (!this.localPlayer) return;
    const emoji = EMOTE_MAP[emoteId] || '?';
    const popup = this.add.text(this.localPlayer.x, this.localPlayer.y - 90, emoji, {
      fontSize: '28px', align: 'center'
    }).setOrigin(0.5, 1).setDepth(10);

    this.tweens.add({
      targets: popup,
      y: this.localPlayer.y - 120,
      alpha: 0,
      duration: 2000,
      ease: 'Cubic.easeOut',
      onComplete: () => popup.destroy()
    });
  }

  // Chat bubble for local player (called from socket handler)
  showChatBubble(text) {
    if (!this.localPlayer) return;
    // Simple text popup above local player
    const display = text.length > 40 ? text.slice(0, 40) + '…' : text;
    const bubble = this.add.text(this.localPlayer.x, this.localPlayer.y - 72, display, {
      fontSize: '12px', fill: '#ffffff', backgroundColor: '#1a1a2ecc',
      padding: { x: 8, y: 5 }, stroke: '#3d3d6e', strokeThickness: 1,
      wordWrap: { width: 160 }, align: 'center'
    }).setOrigin(0.5, 1).setDepth(10);

    this.time.delayedCall(4000, () => {
      this.tweens.add({ targets: bubble, alpha: 0, duration: 400, onComplete: () => bubble.destroy() });
    });
  }

  update() {
    // Keep emote wheel and chat bubble positions updated for local player
    if (this.localPlayer) {
      this.localPlayer.setDepth(this.localPlayer.y);
    }
    this.remotePlayers.forEach(rp => {
      rp.setDepth(rp.y);
    });
  }

  shutdown() {
    this.chatPanel?.destroy();
    this.remotePlayers.forEach(rp => rp.destroy());
    this.remotePlayers.clear();
  }
}
