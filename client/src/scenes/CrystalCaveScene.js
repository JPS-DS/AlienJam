import AlienPlayer from '../objects/AlienPlayer.js';
import RemotePlayer from '../objects/RemotePlayer.js';
import ChatPanel from '../ui/ChatPanel.js';
import EmoteWheel from '../ui/EmoteWheel.js';
import { connectSocket } from '../socket.js';

const AREA_ID = 'crystal_cave';
const WORLD_W = 1600;
const WORLD_H = 900;

export default class CrystalCaveScene extends Phaser.Scene {
  constructor() { super('CrystalCaveScene'); }

  init(data) {
    this.token = data.token; this.username = data.username;
    this.userId = data.userId; this.character = data.character;
    this.remotePlayers = new Map();
  }

  create() {
    this._buildWorld();
    this._buildPortals();
    this._buildAreaNav();

    this.socket = connectSocket(this.token);
    this.socket.on('connect', () => this.chatPanel?.addSystemMessage('Entered Crystal Cave', AREA_ID));

    this.chatPanel = new ChatPanel(this.socket, AREA_ID);
    this.chatPanel.setActiveArea(AREA_ID);
    this.emoteWheel = new EmoteWheel(this.socket);
    this._bindSocketEvents();

    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.fadeIn(500);

    this.moveIndicator = this.add.star(0, 0, 5, 4, 10, 0x00BFFF, 0.8).setDepth(0).setVisible(false);
    this.input.on('pointerdown', (p) => {
      if (p.rightButtonDown()) return;
      this.moveIndicator.setPosition(p.worldX, p.worldY).setVisible(true);
      this.tweens.add({ targets: this.moveIndicator, scaleX: 0, scaleY: 0, alpha: 0, duration: 500, onComplete: () => this.moveIndicator.setVisible(false).setScale(1).setAlpha(0.8) });
    });
  }

  _buildWorld() {
    // Tiled black space background
    this.add.tileSprite(0, 0, WORLD_W, WORLD_H, 'bg_cave').setOrigin(0, 0).setDepth(-10);

    // Star scatter (sparse, cave-like atmosphere)
    const starKeys = ['star1', 'star2', 'star3'];
    [[80,60],[200,40],[450,100],[700,30],[950,80],[1200,50],[1450,110],
     [130,200],[500,180],[850,160],[1300,200],[50,380],[600,350],[1150,370]
    ].forEach(([x, y], i) => {
      const s = this.add.image(x, y, starKeys[i % 3])
        .setDepth(-5).setAlpha(0.2 + Math.random() * 0.3).setTint(0x00BFFF).setScale(0.5 + Math.random() * 0.5);
      this.tweens.add({ targets: s, alpha: 0.05, duration: 1000 + Math.random() * 1500, yoyo: true, repeat: -1, delay: Math.random() * 2000 });
    });

    const gfx = this.add.graphics().setDepth(1);

    // Stalactite ceiling
    const stalactites = [
      [100, 80], [220, 60], [380, 100], [540, 65], [700, 90], [860, 55],
      [1020, 105], [1180, 70], [1360, 90], [1520, 60]
    ];
    stalactites.forEach(([x, h]) => {
      const w = 30 + (x % 20);
      gfx.fillStyle(0x050a14, 1);
      gfx.fillTriangle(x - w/2, 0, x + w/2, 0, x, h);
      gfx.fillStyle(0x004466, 0.5);
      gfx.fillTriangle(x - w/4, 0, x + w/4, 0, x, h * 0.65);
      // Drip glow
      gfx.fillStyle(0x00BFFF, 0.25);
      gfx.fillCircle(x, h + 4, 5);
    });

    // Ground
    gfx.fillStyle(0x050d1a, 0.95);
    gfx.fillRect(0, WORLD_H - 100, WORLD_W, 100);
    gfx.fillStyle(0x00BFFF, 0.5);
    gfx.fillRect(0, WORLD_H - 102, WORLD_W, 3);

    // Crystal clusters
    [
      [140, WORLD_H - 100, 0x00BFFF], [360, WORLD_H - 100, 0x9B59B6],
      [620, WORLD_H - 100, 0x00FFFF], [900, WORLD_H - 100, 0x3399FF],
      [1160, WORLD_H - 100, 0x6600FF], [1440, WORLD_H - 100, 0x00BFFF]
    ].forEach(([x, y, color]) => this._drawCrystalCluster(gfx, x, y, color));

    // Crystal platforms
    [[300, 560, 170, 0x00BFFF], [820, 490, 180, 0x9B59B6], [1310, 530, 170, 0x00FFFF]].forEach(([x, y, w, color]) => {
      gfx.fillStyle(0x050d1a, 0.95);
      gfx.fillRoundedRect(x - w/2, y, w, 26, 5);
      gfx.fillStyle(color, 0.6);
      gfx.fillRoundedRect(x - w/2, y, w, 4, { tl: 5, tr: 5, bl: 0, br: 0 });
      gfx.fillStyle(color, 0.15);
      gfx.fillRoundedRect(x - w/2 + 4, y + 6, w - 8, 16, 3);
    });

    // Underground glowing lake
    gfx.fillStyle(0x003366, 0.65);
    gfx.fillEllipse(WORLD_W / 2, WORLD_H - 48, 640, 58);
    gfx.fillStyle(0x0066ff, 0.25);
    gfx.fillEllipse(WORLD_W / 2, WORLD_H - 54, 420, 38);

    // Floating manned UFO as cave mystery element
    const shipImg = this.add.image(WORLD_W / 2, 200, 'shipManned')
      .setDepth(2).setScale(0.55).setTint(0x00BFFF).setAlpha(0.7);
    this.tweens.add({ targets: shipImg, y: 218, duration: 2500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: shipImg, x: WORLD_W / 2 + 40, duration: 5000, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    this.add.text(WORLD_W / 2, 28, '💎  CRYSTAL CAVE', {
      fontSize: '22px', fontStyle: 'bold', fill: '#67e8f9',
      stroke: '#0a0a1a', strokeThickness: 6,
      shadow: { blur: 14, color: '#00BFFF', fill: true }
    }).setOrigin(0.5, 0).setDepth(10);

    this.localPlayer = new AlienPlayer(this, WORLD_W / 2, WORLD_H - 180, { ...this.character, username: this.username });
    this.localPlayer.setDepth(5);
    this.cameras.main.startFollow(this.localPlayer, true, 0.08, 0.08);
  }

  _drawCrystalCluster(gfx, x, y, color) {
    const sizes = [[0,-65,14,65],[-20,-48,11,48],[22,-54,13,54],[-36,-32,9,32],[36,-38,10,38]];
    sizes.forEach(([ox, oy, w, h]) => {
      const cx = x + ox, cy = y + h;
      gfx.fillStyle(color, 0.85);
      gfx.fillTriangle(cx - w/2, cy, cx + w/2, cy, cx, cy + oy);
      gfx.fillStyle(0xffffff, 0.25);
      gfx.fillTriangle(cx - w/4, cy, cx, cy, cx, cy + oy * 0.55);
      // Glow base
      gfx.fillStyle(color, 0.2);
      gfx.fillEllipse(cx, cy, w * 2, 6);
    });
  }

  _buildPortals() {
    this.portals = [
      { x: 80, y: WORLD_H - 140, label: '🌍 Hub Planet', targetScene: 'HubPlanetScene', area: 'hub', tint: 0xa78bfa },
      { x: WORLD_W - 80, y: WORLD_H - 140, label: '🌆 Neon Market', targetScene: 'NeonMarketScene', area: 'neon_market', tint: 0xFF69B4 }
    ];
    this._buildPortalObjects();
  }

  _buildPortalObjects() {
    this.portals.forEach(portal => {
      const ufo = this.add.image(portal.x, portal.y - 20, 'ufoGreen')
        .setTint(portal.tint).setDepth(3).setScale(0.9);
      this.tweens.add({ targets: ufo, y: portal.y - 32, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: ufo, angle: 360, duration: 8000, repeat: -1, ease: 'Linear' });

      const gfx = this.add.graphics().setDepth(2);
      gfx.lineStyle(3, portal.tint, 0.7);
      gfx.strokeEllipse(portal.x, portal.y + 10, 72, 18);
      gfx.fillStyle(portal.tint, 0.15);
      gfx.fillEllipse(portal.x, portal.y + 10, 72, 18);

      const label = this.add.text(portal.x, portal.y + 30, portal.label, {
        fontSize: '13px', fontStyle: 'bold', fill: '#ffffff', stroke: '#000000', strokeThickness: 4
      }).setOrigin(0.5, 0).setDepth(3);

      ufo.setInteractive();
      ufo.on('pointerover', () => { ufo.setScale(1.05); label.setStyle({ fill: '#a78bfa' }); this.input.setDefaultCursor('pointer'); });
      ufo.on('pointerout',  () => { ufo.setScale(0.9);  label.setStyle({ fill: '#ffffff' }); this.input.setDefaultCursor('default'); });
      ufo.on('pointerdown', () => this._travelTo(portal));
    });
  }

  _buildAreaNav() {
    const nav = document.getElementById('area-nav');
    const areas = [
      { id: 'hub', scene: 'HubPlanetScene', label: '🌍 Hub' },
      { id: 'crystal_cave', scene: 'CrystalCaveScene', label: '💎 Cave' },
      { id: 'neon_market', scene: 'NeonMarketScene', label: '🌆 Market' }
    ];
    nav.innerHTML = areas.map(a => `<button data-scene="${a.scene}" data-area="${a.id}" class="${a.id === AREA_ID ? 'active' : ''}">${a.label}</button>`).join('');
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
      this.chatPanel?.destroy(); this.socket?.off();
      this.scene.start(portal.targetScene, { token: this.token, username: this.username, userId: this.userId, character: this.character });
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
      if (rp) { this.chatPanel?.addSystemMessage(`${rp.playerData.username} left`, AREA_ID); rp.destroy(); this.remotePlayers.delete(id); this.chatPanel?.setOnlineCount(this.remotePlayers.size + 1); }
    });
    this.socket.on('player:moved', ({ id, x, y }) => { if (id !== this.userId) this.remotePlayers.get(id)?.moveTo(x, y); });
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
    this.remotePlayers.set(playerData.id, new RemotePlayer(this, playerData));
  }

  _showLocalChatBubble(text) {
    if (!this.localPlayer) return;
    const display = text.length > 40 ? text.slice(0, 40) + '…' : text;
    const bubble = this.add.text(this.localPlayer.x, this.localPlayer.y - 72, display, {
      fontSize: '12px', fill: '#ffffff', backgroundColor: '#050d1acc',
      padding: { x: 8, y: 5 }, wordWrap: { width: 160 }, align: 'center'
    }).setOrigin(0.5, 1).setDepth(10);
    this.time.delayedCall(4000, () => this.tweens.add({ targets: bubble, alpha: 0, duration: 400, onComplete: () => bubble.destroy() }));
  }

  _showLocalEmote(emoteId) {
    const EMOTE_MAP = { wave:'👋',dance:'💃',laugh:'😂',cry:'😭',heart:'❤️',think:'🤔',zzz:'💤',alien:'👽' };
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
