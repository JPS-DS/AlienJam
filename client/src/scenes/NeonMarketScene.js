import AlienPlayer from '../objects/AlienPlayer.js';
import RemotePlayer from '../objects/RemotePlayer.js';
import ChatPanel from '../ui/ChatPanel.js';
import EmoteWheel from '../ui/EmoteWheel.js';
import { connectSocket } from '../socket.js';

const AREA_ID = 'neon_market';
const WORLD_W = 1600;
const WORLD_H = 900;

export default class NeonMarketScene extends Phaser.Scene {
  constructor() {
    super('NeonMarketScene');
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

    this.socket = connectSocket(this.token);
    this.socket.on('connect', () => {
      this.chatPanel?.addSystemMessage('Welcome to the Neon Market!', AREA_ID);
    });

    this.chatPanel = new ChatPanel(this.socket, AREA_ID);
    this.chatPanel.setActiveArea(AREA_ID);
    this.emoteWheel = new EmoteWheel(this.socket);

    this._bindSocketEvents();

    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);

    this.moveIndicator = this.add.circle(0, 0, 6, 0xFF69B4, 0.7).setDepth(0).setVisible(false);
    this.input.on('pointerdown', (p) => {
      if (p.rightButtonDown()) return;
      this.moveIndicator.setPosition(p.worldX, p.worldY).setVisible(true);
      this.time.delayedCall(600, () => this.moveIndicator.setVisible(false));
    });
  }

  _buildWorld() {
    const gfx = this.add.graphics();

    // Cyberpunk night sky
    gfx.fillGradientStyle(0x0d001a, 0x0d001a, 0x1a0030, 0x1a0030, 1);
    gfx.fillRect(0, 0, WORLD_W, WORLD_H);

    // Distant city skyline
    const buildings = [
      [0, 600, 80, 300], [80, 650, 60, 250], [140, 580, 100, 320], [240, 620, 70, 280],
      [310, 560, 90, 340], [400, 640, 65, 260], [465, 590, 85, 310], [550, 660, 55, 240],
      [605, 570, 95, 330], [700, 630, 75, 270], [775, 600, 80, 300], [855, 650, 60, 250],
      [915, 580, 90, 320], [1005, 620, 70, 280], [1075, 560, 100, 340], [1175, 640, 65, 260],
      [1240, 590, 85, 310], [1325, 660, 55, 240], [1380, 570, 90, 330], [1470, 630, 75, 270],
      [1545, 600, 55, 300]
    ];

    buildings.forEach(([x, y, w, h]) => {
      gfx.fillStyle(0x0a0015, 1);
      gfx.fillRect(x, y, w, h);
      // Random lit windows
      for (let wy = y + 20; wy < y + h - 10; wy += 20) {
        for (let wx = x + 8; wx < x + w - 8; wx += 14) {
          if ((wx * wy) % 3 !== 0) {
            const winColor = [(wx * wy) % 7 === 0 ? 0xFF69B4 : (wx + wy) % 5 === 0 ? 0x00FFFF : 0xFFD700][0];
            gfx.fillStyle(winColor, 0.6);
            gfx.fillRect(wx, wy, 8, 10);
          }
        }
      }
    });

    // Ground / street
    gfx.fillStyle(0x0d001a, 1);
    gfx.fillRect(0, WORLD_H - 100, WORLD_W, 100);

    // Neon street lights
    gfx.fillStyle(0xFF69B4, 0.4);
    gfx.fillRect(0, WORLD_H - 104, WORLD_W, 3);
    gfx.fillStyle(0x00FFFF, 0.3);
    gfx.fillRect(0, WORLD_H - 108, WORLD_W, 2);

    // Market stalls
    const stalls = [
      { x: 200, color: 0xFF69B4, label: '🍄 Snacks' },
      { x: 500, color: 0x00FFFF, label: '🔮 Items' },
      { x: 800, color: 0xFFD700, label: '👗 Fashion' },
      { x: 1100, color: 0x9B59B6, label: '🎮 Games' },
      { x: 1400, color: 0x00FF88, label: '🌿 Plants' }
    ];

    stalls.forEach(({ x, color, label }) => {
      // Stall roof
      gfx.fillStyle(color, 0.9);
      gfx.fillTriangle(x - 70, WORLD_H - 100, x + 70, WORLD_H - 100, x, WORLD_H - 200);
      // Stall body
      gfx.fillStyle(0x0d001a, 1);
      gfx.fillRect(x - 60, WORLD_H - 200, 120, 100);
      // Glow border
      gfx.lineStyle(2, color, 0.8);
      gfx.strokeRect(x - 60, WORLD_H - 200, 120, 100);
      // Label
      this.add.text(x, WORLD_H - 150, label, {
        fontSize: '13px', fill: '#ffffff', stroke: '#000', strokeThickness: 3, align: 'center'
      }).setOrigin(0.5, 0.5);
    });

    // Overhead neon signs
    const signs = [
      { x: 350, y: 200, text: '✨ ALIEN EMPORIUM ✨', color: '#FF69B4' },
      { x: 900, y: 180, text: '🛸 COSMIC BAZAAR 🛸', color: '#00FFFF' },
      { x: 1300, y: 220, text: '🌌 STAR GOODS 🌌', color: '#FFD700' }
    ];

    signs.forEach(({ x, y, text, color }) => {
      this.add.text(x, y, text, {
        fontSize: '16px', fill: color, stroke: '#000', strokeThickness: 3,
        fontStyle: 'bold', shadow: { blur: 10, color, fill: true }
      }).setOrigin(0.5, 0.5);
    });

    // Area label
    this.add.text(WORLD_W / 2, 30, '🌆 NEON MARKET', {
      fontSize: '20px', fill: '#FF69B4', stroke: '#000', strokeThickness: 4, fontStyle: 'bold'
    }).setOrigin(0.5, 0);

    // Spawn player
    this.localPlayer = new AlienPlayer(this, WORLD_W / 2, WORLD_H - 180, {
      ...this.character, username: this.username
    });
    this.localPlayer.setDepth(5);
    this.cameras.main.startFollow(this.localPlayer, true, 0.1, 0.1);
  }

  _buildPortals() {
    this.portals = [
      { x: 80, y: WORLD_H - 140, label: '🌍 Hub Planet', targetScene: 'HubPlanetScene', area: 'hub', color: 0xa78bfa },
      { x: WORLD_W - 80, y: WORLD_H - 140, label: '💎 Crystal Cave', targetScene: 'CrystalCaveScene', area: 'crystal_cave', color: 0x00BFFF }
    ];

    this.portals.forEach(portal => {
      const gfx = this.add.graphics();
      gfx.lineStyle(4, portal.color, 0.8);
      gfx.strokeCircle(0, 0, 32);
      gfx.lineStyle(2, portal.color, 0.5);
      gfx.strokeCircle(0, 0, 24);
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        gfx.lineStyle(2, portal.color, 0.6);
        gfx.strokePoints([new Phaser.Geom.Point(0, 0), new Phaser.Geom.Point(Math.cos(angle) * 22, Math.sin(angle) * 22)], false);
      }
      gfx.fillStyle(portal.color, 0.3);
      gfx.fillCircle(0, 0, 16);
      gfx.setPosition(portal.x, portal.y);

      const label = this.add.text(portal.x, portal.y + 45, portal.label, {
        fontSize: '12px', fill: '#ffffff', stroke: '#000', strokeThickness: 3, align: 'center'
      }).setOrigin(0.5, 0);

      this.tweens.add({ targets: gfx, angle: 360, duration: 8000, repeat: -1, ease: 'Linear' });

      gfx.setInteractive(new Phaser.Geom.Circle(0, 0, 32), Phaser.Geom.Circle.Contains);
      gfx.on('pointerover', () => label.setStyle({ fill: '#a78bfa' }));
      gfx.on('pointerout', () => label.setStyle({ fill: '#ffffff' }));
      gfx.on('pointerdown', () => this._travelTo(portal));
      gfx.input.cursor = 'pointer';
    });
  }

  _buildAreaNav() {
    const nav = document.getElementById('area-nav');
    const areas = [
      { id: 'hub', scene: 'HubPlanetScene', label: '🌍 Hub' },
      { id: 'crystal_cave', scene: 'CrystalCaveScene', label: '💎 Cave' },
      { id: 'neon_market', scene: 'NeonMarketScene', label: '🌆 Market' }
    ];
    nav.innerHTML = areas.map(a => `
      <button data-scene="${a.scene}" data-area="${a.id}" class="${a.id === AREA_ID ? 'active' : ''}">${a.label}</button>
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
        token: this.token, username: this.username, userId: this.userId, character: this.character
      });
    });
  }

  _bindSocketEvents() {
    this.socket.on('area:state', ({ players, self }) => {
      players.forEach(p => this._spawnRemotePlayer(p));
      if (self && this.localPlayer) this.localPlayer.setPosition(self.x, self.y);
      this.chatPanel?.setOnlineCount(players.length + 1);
    });
    this.socket.on('player:joined', (p) => {
      if (p.id === this.userId) return;
      this._spawnRemotePlayer(p);
      this.chatPanel?.addSystemMessage(`${p.username} arrived`, AREA_ID);
      this.chatPanel?.setOnlineCount(this.remotePlayers.size + 1);
    });
    this.socket.on('player:left', ({ id }) => {
      const rp = this.remotePlayers.get(id);
      if (rp) {
        this.chatPanel?.addSystemMessage(`${rp.playerData.username} left`, AREA_ID);
        rp.destroy();
        this.remotePlayers.delete(id);
        this.chatPanel?.setOnlineCount(this.remotePlayers.size + 1);
      }
    });
    this.socket.on('player:moved', ({ id, x, y }) => {
      if (id === this.userId) return;
      this.remotePlayers.get(id)?.moveTo(x, y);
    });
    this.socket.on('chat:received', ({ id, text }) => {
      if (id === this.userId) return;
      this.remotePlayers.get(id)?.showChatBubble(text);
    });
    this.socket.on('emote:played', ({ id, emoteId }) => {
      if (id === this.userId) { this._showLocalEmote(emoteId); return; }
      this.remotePlayers.get(id)?.showEmote(emoteId);
    });
  }

  _spawnRemotePlayer(playerData) {
    if (this.remotePlayers.has(playerData.id)) this.remotePlayers.get(playerData.id).destroy();
    const rp = new RemotePlayer(this, playerData);
    this.remotePlayers.set(playerData.id, rp);
  }

  _showLocalEmote(emoteId) {
    const EMOTE_MAP = { wave: '👋', dance: '💃', laugh: '😂', cry: '😭', heart: '❤️', think: '🤔', zzz: '💤', alien: '👽' };
    if (!this.localPlayer) return;
    const popup = this.add.text(this.localPlayer.x, this.localPlayer.y - 90, EMOTE_MAP[emoteId] || '?', {
      fontSize: '28px', align: 'center'
    }).setOrigin(0.5, 1).setDepth(10);
    this.tweens.add({ targets: popup, y: this.localPlayer.y - 120, alpha: 0, duration: 2000, ease: 'Cubic.easeOut', onComplete: () => popup.destroy() });
  }

  update() {
    if (this.localPlayer) this.localPlayer.setDepth(this.localPlayer.y);
    this.remotePlayers.forEach(rp => rp.setDepth(rp.y));
  }

  shutdown() {
    this.chatPanel?.destroy();
    this.remotePlayers.forEach(rp => rp.destroy());
    this.remotePlayers.clear();
  }
}
