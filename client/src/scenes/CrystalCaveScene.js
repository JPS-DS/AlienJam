import AlienPlayer from '../objects/AlienPlayer.js';
import RemotePlayer from '../objects/RemotePlayer.js';
import ChatPanel from '../ui/ChatPanel.js';
import EmoteWheel from '../ui/EmoteWheel.js';
import { connectSocket } from '../socket.js';

const AREA_ID = 'crystal_cave';
const WORLD_W = 1600;
const WORLD_H = 900;

export default class CrystalCaveScene extends Phaser.Scene {
  constructor() {
    super('CrystalCaveScene');
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
      this.chatPanel?.addSystemMessage('Entered Crystal Cave', AREA_ID);
    });

    this.chatPanel = new ChatPanel(this.socket, AREA_ID);
    this.chatPanel.setActiveArea(AREA_ID);
    this.emoteWheel = new EmoteWheel(this.socket);

    this._bindSocketEvents();

    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);

    this.moveIndicator = this.add.circle(0, 0, 6, 0x00BFFF, 0.7).setDepth(0).setVisible(false);
    this.input.on('pointerdown', (p) => {
      if (p.rightButtonDown()) return;
      this.moveIndicator.setPosition(p.worldX, p.worldY).setVisible(true);
      this.time.delayedCall(600, () => this.moveIndicator.setVisible(false));
    });
  }

  _buildWorld() {
    const gfx = this.add.graphics();

    // Dark cave background
    gfx.fillGradientStyle(0x000814, 0x000814, 0x001a2e, 0x001a2e, 1);
    gfx.fillRect(0, 0, WORLD_W, WORLD_H);

    // Cave stalactites (top)
    const stalactites = [
      [100, 0, 40, 80], [250, 0, 30, 60], [420, 0, 50, 100], [580, 0, 35, 70],
      [750, 0, 45, 90], [920, 0, 30, 55], [1080, 0, 55, 110], [1250, 0, 35, 65],
      [1420, 0, 40, 85], [1550, 0, 25, 50]
    ];

    stalactites.forEach(([x, y, w, h]) => {
      gfx.fillStyle(0x0a0a1a, 1);
      gfx.fillTriangle(x - w / 2, y, x + w / 2, y, x, y + h);
      // Crystal glow
      gfx.fillStyle(0x0066aa, 0.3);
      gfx.fillTriangle(x - w / 4, y, x + w / 4, y, x, y + h * 0.6);
    });

    // Ground
    gfx.fillStyle(0x0a1628, 1);
    gfx.fillRect(0, WORLD_H - 100, WORLD_W, 100);
    gfx.fillStyle(0x00BFFF, 0.3);
    gfx.fillRect(0, WORLD_H - 104, WORLD_W, 4);

    // Crystal formations
    const crystalSets = [
      { x: 150, y: WORLD_H - 100, color: 0x00BFFF },
      { x: 400, y: WORLD_H - 100, color: 0x9B59B6 },
      { x: 700, y: WORLD_H - 100, color: 0x00FFFF },
      { x: 950, y: WORLD_H - 100, color: 0x3399FF },
      { x: 1200, y: WORLD_H - 100, color: 0x6600FF },
      { x: 1450, y: WORLD_H - 100, color: 0x00BFFF }
    ];

    crystalSets.forEach(({ x, y, color }) => {
      this._drawCrystalCluster(gfx, x, y, color);
    });

    // Glowing underground lake
    gfx.fillStyle(0x003366, 0.6);
    gfx.fillEllipse(WORLD_W / 2, WORLD_H - 50, 600, 60);
    gfx.fillStyle(0x0066ff, 0.2);
    gfx.fillEllipse(WORLD_W / 2, WORLD_H - 55, 400, 40);

    // Floating crystal platforms
    [[300, 550, 160, 0x00BFFF], [800, 480, 180, 0x9B59B6], [1300, 520, 160, 0x00FFFF]].forEach(([x, y, w, color]) => {
      gfx.fillStyle(0x0a1628, 1);
      gfx.fillRoundedRect(x - w / 2, y, w, 28, 6);
      gfx.fillStyle(color, 0.5);
      gfx.fillRoundedRect(x - w / 2, y, w, 5, { tl: 6, tr: 6, bl: 0, br: 0 });
    });

    // Area label
    this.add.text(WORLD_W / 2, 30, '💎 CRYSTAL CAVE', {
      fontSize: '20px', fill: '#00BFFF', stroke: '#000', strokeThickness: 4, fontStyle: 'bold'
    }).setOrigin(0.5, 0);

    // Spawn player
    const spawnX = WORLD_W / 2;
    const spawnY = WORLD_H - 180;
    this.localPlayer = new AlienPlayer(this, spawnX, spawnY, {
      ...this.character, username: this.username
    });
    this.localPlayer.setDepth(5);
    this.cameras.main.startFollow(this.localPlayer, true, 0.1, 0.1);
  }

  _drawCrystalCluster(gfx, x, y, color) {
    const sizes = [[0, -60, 16, 60], [-18, -45, 12, 45], [20, -50, 14, 50], [-35, -30, 10, 30], [35, -35, 11, 35]];
    sizes.forEach(([ox, oy, w, h]) => {
      const cx = x + ox;
      const cy = y + oy + h;
      gfx.fillStyle(color, 0.8);
      gfx.fillTriangle(cx - w / 2, cy, cx + w / 2, cy, cx, cy + oy);
      gfx.fillStyle(0xffffff, 0.2);
      gfx.fillTriangle(cx - w / 4, cy, cx, cy, cx, cy + oy * 0.6);
    });
  }

  _buildPortals() {
    this.portals = [
      { x: 80, y: WORLD_H - 140, label: '🌍 Hub Planet', targetScene: 'HubPlanetScene', area: 'hub', color: 0xa78bfa },
      { x: WORLD_W - 80, y: WORLD_H - 140, label: '🌆 Neon Market', targetScene: 'NeonMarketScene', area: 'neon_market', color: 0xFF69B4 }
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
