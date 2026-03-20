import AlienPlayer from '../objects/AlienPlayer.js';
import RemotePlayer from '../objects/RemotePlayer.js';
import ChatPanel from '../ui/ChatPanel.js';
import EmoteWheel from '../ui/EmoteWheel.js';
import { connectSocket } from '../socket.js';

const AREA_ID  = 'hub';
const WORLD_W  = 1600;
const WORLD_H  = 900;

// UFO colors for portals and decoration
const UFO_KEYS   = ['ufoGreen', 'ufoBlue', 'ufoRed', 'ufoYellow'];
const UFO_TINTS  = [0x7CFC00, 0x00BFFF, 0xFF4500, 0xFFD700];

export default class HubPlanetScene extends Phaser.Scene {
  constructor() { super('HubPlanetScene'); }

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
    this.socket.on('connect', () => this._onSocketConnect());
    this.socket.on('disconnect', () => this._onSocketDisconnect());

    this.chatPanel = new ChatPanel(this.socket, AREA_ID);
    this.emoteWheel = new EmoteWheel(this.socket);
    this._bindSocketEvents();

    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.fadeIn(500);

    this.moveIndicator = this.add.star(0, 0, 5, 4, 10, 0xa78bfa, 0.8).setDepth(0).setVisible(false);
    this.input.on('pointerdown', (p) => {
      if (p.rightButtonDown()) return;
      this.moveIndicator.setPosition(p.worldX, p.worldY).setVisible(true);
      this.tweens.add({ targets: this.moveIndicator, scaleX: 0, scaleY: 0, alpha: 0, duration: 500, onComplete: () => this.moveIndicator.setVisible(false).setScale(1).setAlpha(0.8) });
    });
  }

  _buildWorld() {
    // === TILED BACKGROUND ===
    this.add.tileSprite(0, 0, WORLD_W, WORLD_H, 'bg_hub')
      .setOrigin(0, 0)
      .setDepth(-10);

    // === PARALLAX STAR LAYER ===
    this._scatterStars();

    // === FLOATING UFO DECORATIONS (background) ===
    this._spawnDecorativeUFOs();

    // === METEORS ===
    this._spawnMeteors();

    // === GROUND PLATFORM ===
    const gfx = this.add.graphics().setDepth(1);
    gfx.fillStyle(0x1a0d3e, 0.92);
    gfx.fillRect(0, WORLD_H - 110, WORLD_W, 110);
    gfx.fillStyle(0x5b21b6, 0.8);
    gfx.fillRect(0, WORLD_H - 113, WORLD_W, 4);
    // Glow line
    gfx.fillStyle(0xa78bfa, 0.3);
    gfx.fillRect(0, WORLD_H - 114, WORLD_W, 2);

    // === FLOATING PLATFORMS ===
    this._buildPlatform(gfx, WORLD_W / 2 - 200, WORLD_H - 178, 400, 36);
    this._buildPlatform(gfx, 160, WORLD_H - 270, 220, 28);
    this._buildPlatform(gfx, WORLD_W - 380, WORLD_H - 270, 220, 28);

    // === FLOATING ISLANDS ===
    this._buildIsland(gfx, 280, 380, 130, 48);
    this._buildIsland(gfx, 1100, 340, 120, 44);
    this._buildIsland(gfx, 720, 240, 150, 52);

    // === ALIEN PLANTS (using Graphics, enhanced) ===
    [[180, WORLD_H - 110, 0x7CFC00], [420, WORLD_H - 110, 0xFF69B4],
     [760, WORLD_H - 110, 0x00FFCC], [1020, WORLD_H - 110, 0xFFD700],
     [1280, WORLD_H - 110, 0xBF7FFF], [1500, WORLD_H - 110, 0xFF4500]
    ].forEach(([x, y, c]) => this._drawPlant(gfx, x, y, c));

    // === AREA TITLE ===
    const title = this.add.text(WORLD_W / 2, 28, '🌍  HUB PLANET', {
      fontSize: '22px', fontStyle: 'bold', fill: '#c4b5fd',
      stroke: '#0a0a1a', strokeThickness: 6,
      shadow: { blur: 12, color: '#7c3aed', fill: true }
    }).setOrigin(0.5, 0).setDepth(10);

    // Gentle float
    this.tweens.add({ targets: title, y: 34, duration: 2000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    // === LOCAL PLAYER ===
    const spawnX = this.character?.x || WORLD_W / 2;
    const spawnY = this.character?.y || (WORLD_H - 180);
    this.localPlayer = new AlienPlayer(this, spawnX, spawnY, { ...this.character, username: this.username });
    this.localPlayer.setDepth(5);
    this.cameras.main.startFollow(this.localPlayer, true, 0.08, 0.08);
  }

  _scatterStars() {
    const starKeys = ['star1', 'star2', 'star3'];
    const positions = [
      [120,60],[300,40],[560,110],[820,25],[1050,80],[1320,50],[1520,130],
      [80,190],[460,170],[880,155],[1180,195],[1540,75],[200,340],[710,295],
      [1090,315],[1410,275],[55,470],[510,445],[940,485],[1360,455],
      [260,640],[750,615],[1150,655],[1470,635],[400,520],[1000,480]
    ];
    positions.forEach(([x, y], i) => {
      const key = starKeys[i % 3];
      const s = this.add.image(x, y, key)
        .setDepth(-5)
        .setAlpha(0.4 + Math.random() * 0.4)
        .setScale(0.5 + Math.random() * 0.8);
      // Twinkle
      this.tweens.add({
        targets: s, alpha: 0.1, duration: 800 + Math.random() * 1500,
        yoyo: true, repeat: -1, delay: Math.random() * 2000, ease: 'Sine.easeInOut'
      });
    });
  }

  _spawnDecorativeUFOs() {
    const configs = [
      { x: 250, y: 180, key: 'ufoBlue',   tint: 0x00BFFF, scale: 0.7, speed: 6000 },
      { x: 900, y: 130, key: 'ufoGreen',  tint: 0x7CFC00, scale: 0.6, speed: 8000 },
      { x: 1350,y: 200, key: 'ufoYellow', tint: 0xFFD700, scale: 0.65,speed: 7000 },
      { x: 600, y: 280, key: 'shipManned',tint: 0xFF69B4, scale: 0.5, speed: 9000 },
    ];
    configs.forEach(({ x, y, key, tint, scale, speed }) => {
      const ufo = this.add.image(x, y, key)
        .setDepth(-2).setScale(scale).setTint(tint).setAlpha(0.75);
      // Gentle hover
      this.tweens.add({ targets: ufo, y: y + 18, duration: speed, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      // Slow drift left/right
      this.tweens.add({ targets: ufo, x: x + 60, duration: speed * 1.7, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: Math.random() * 1000 });
    });
  }

  _spawnMeteors() {
    const meteors = [
      { x: 1450, y: 200, key: 'meteorBrown', angle: 25, scale: 0.7, alpha: 0.5 },
      { x: 100,  y: 320, key: 'meteorGrey',  angle: -15,scale: 0.5, alpha: 0.4 },
      { x: 1300, y: 500, key: 'meteorBrownSm', angle: 40, scale: 0.6, alpha: 0.45 },
    ];
    meteors.forEach(({ x, y, key, angle, scale, alpha }) => {
      this.add.image(x, y, key)
        .setDepth(-4).setAngle(angle).setScale(scale).setAlpha(alpha);
    });
  }

  _buildPlatform(gfx, x, y, w, h) {
    gfx.fillStyle(0x2d1b69, 0.95);
    gfx.fillRoundedRect(x, y, w, h, 8);
    gfx.fillStyle(0x7c3aed, 0.9);
    gfx.fillRoundedRect(x, y, w, 5, { tl: 8, tr: 8, bl: 0, br: 0 });
    gfx.fillStyle(0xa78bfa, 0.25);
    gfx.fillRoundedRect(x + 4, y + 8, w - 8, h - 12, 4);
  }

  _buildIsland(gfx, x, y, w, h) {
    gfx.fillStyle(0x0d0820, 0.9);
    gfx.fillEllipse(x, y + h * 0.4, w, h * 0.7);
    gfx.fillStyle(0x1e0f45, 0.95);
    gfx.fillEllipse(x, y, w, h * 0.5);
    gfx.fillStyle(0x5b21b6, 0.4);
    gfx.fillEllipse(x, y, w * 0.55, h * 0.2);
  }

  _drawPlant(gfx, x, y, color) {
    const h = 28 + (x % 18);
    gfx.lineStyle(3, color, 0.9);
    // Curved stem
    gfx.beginPath();
    gfx.moveTo(x, y);
    gfx.lineTo(x - 4, y - h * 0.5);
    gfx.lineTo(x + 2, y - h);
    gfx.strokePath();
    // Bulb
    gfx.fillStyle(color, 0.9);
    gfx.fillCircle(x + 2, y - h, 9);
    gfx.fillStyle(color, 0.45);
    gfx.fillCircle(x - 8, y - h + 5, 6);
    gfx.fillCircle(x + 10, y - h + 4, 6);
    // Glow center
    gfx.fillStyle(0xffffff, 0.3);
    gfx.fillCircle(x + 4, y - h - 2, 3);
  }

  _buildPortals() {
    this.portals = [
      { x: 100, y: WORLD_H - 160, label: '💎 Crystal Cave', targetScene: 'CrystalCaveScene', area: 'crystal_cave', tint: 0x00BFFF },
      { x: WORLD_W - 100, y: WORLD_H - 160, label: '🌆 Neon Market', targetScene: 'NeonMarketScene', area: 'neon_market', tint: 0xFF69B4 }
    ];

    this.portals.forEach(portal => {
      // Real UFO as portal icon
      const ufo = this.add.image(portal.x, portal.y - 20, 'ufoBlue')
        .setTint(portal.tint).setDepth(3).setScale(0.9);

      this.tweens.add({ targets: ufo, y: portal.y - 32, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: ufo, angle: 360, duration: 8000, repeat: -1, ease: 'Linear' });

      // Glow ring under UFO
      const gfx = this.add.graphics().setDepth(2);
      gfx.lineStyle(3, portal.tint, 0.7);
      gfx.strokeEllipse(portal.x, portal.y + 10, 72, 18);
      gfx.fillStyle(portal.tint, 0.15);
      gfx.fillEllipse(portal.x, portal.y + 10, 72, 18);

      const label = this.add.text(portal.x, portal.y + 30, portal.label, {
        fontSize: '13px', fontStyle: 'bold', fill: '#ffffff',
        stroke: '#000000', strokeThickness: 4
      }).setOrigin(0.5, 0).setDepth(3);

      // Click zone
      ufo.setInteractive();
      ufo.on('pointerover', () => { ufo.setScale(1.05); label.setStyle({ fill: '#a78bfa' }); this.input.setDefaultCursor('pointer'); });
      ufo.on('pointerout',  () => { ufo.setScale(0.9);  label.setStyle({ fill: '#ffffff' }); this.input.setDefaultCursor('default'); });
      ufo.on('pointerdown', () => this._travelTo(portal));
    });
  }

  _buildAreaNav() {
    const nav = document.getElementById('area-nav');
    const areas = [
      { id: 'hub',         scene: 'HubPlanetScene',   label: '🌍 Hub' },
      { id: 'crystal_cave',scene: 'CrystalCaveScene', label: '💎 Cave' },
      { id: 'neon_market', scene: 'NeonMarketScene',  label: '🌆 Market' }
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

  _onSocketConnect() {
    this.chatPanel?.addSystemMessage('Connected to Hub Planet', AREA_ID);
  }

  _onSocketDisconnect() {
    this.chatPanel?.addSystemMessage('Disconnected from server', AREA_ID);
    this.remotePlayers.forEach(rp => rp.destroy());
    this.remotePlayers.clear();
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
        rp.destroy(); this.remotePlayers.delete(id);
        this.chatPanel?.setOnlineCount(this.remotePlayers.size + 1);
      }
    });
    this.socket.on('player:moved', ({ id, x, y }) => {
      if (id === this.userId) return;
      this.remotePlayers.get(id)?.moveTo(x, y);
    });
    this.socket.on('chat:received', ({ id, text }) => {
      if (id === this.userId) this._showLocalChatBubble(text);
      else this.remotePlayers.get(id)?.showChatBubble(text);
    });
    this.socket.on('emote:played', ({ id, emoteId }) => {
      if (id === this.userId) this._showLocalEmote(emoteId);
      else this.remotePlayers.get(id)?.showEmote(emoteId);
    });
  }

  _spawnRemotePlayer(playerData) {
    if (this.remotePlayers.has(playerData.id)) this.remotePlayers.get(playerData.id).destroy();
    const rp = new RemotePlayer(this, playerData);
    this.remotePlayers.set(playerData.id, rp);
  }

  _showLocalChatBubble(text) {
    if (!this.localPlayer) return;
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

  _showLocalEmote(emoteId) {
    const EMOTE_MAP = { wave:'👋', dance:'💃', laugh:'😂', cry:'😭', heart:'❤️', think:'🤔', zzz:'💤', alien:'👽' };
    if (!this.localPlayer) return;
    const popup = this.add.text(this.localPlayer.x, this.localPlayer.y - 90, EMOTE_MAP[emoteId] || '?', { fontSize: '28px' }).setOrigin(0.5, 1).setDepth(10);
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
