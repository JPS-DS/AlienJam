import AlienPlayer from '../objects/AlienPlayer.js';
import RemotePlayer from '../objects/RemotePlayer.js';
import ChatPanel from '../ui/ChatPanel.js';
import EmoteWheel from '../ui/EmoteWheel.js';
import { connectSocket } from '../socket.js';

const AREA_ID = 'neon_market';
const WORLD_W = 1600;
const WORLD_H = 900;

export default class NeonMarketScene extends Phaser.Scene {
  constructor() { super('NeonMarketScene'); }

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
    this.socket.on('connect', () => this.chatPanel?.addSystemMessage('Welcome to the Neon Market!', AREA_ID));

    this.chatPanel = new ChatPanel(this.socket, AREA_ID);
    this.chatPanel.setActiveArea(AREA_ID);
    this.emoteWheel = new EmoteWheel(this.socket);
    this._bindSocketEvents();

    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.fadeIn(500);

    this.moveIndicator = this.add.star(0, 0, 5, 4, 10, 0xFF69B4, 0.8).setDepth(0).setVisible(false);
    this.input.on('pointerdown', (p) => {
      if (p.rightButtonDown()) return;
      this.moveIndicator.setPosition(p.worldX, p.worldY).setVisible(true);
      this.tweens.add({ targets: this.moveIndicator, scaleX: 0, scaleY: 0, alpha: 0, duration: 500, onComplete: () => this.moveIndicator.setVisible(false).setScale(1).setAlpha(0.8) });
    });
  }

  _buildWorld() {
    // Tiled purple space background
    this.add.tileSprite(0, 0, WORLD_W, WORLD_H, 'bg_market').setOrigin(0, 0).setDepth(-10);

    // Stars - warm toned for market atmosphere
    const starKeys = ['star1', 'star2', 'star3'];
    [[100,55],[250,40],[430,100],[680,28],[940,78],[1210,48],[1480,108],
     [70,195],[480,175],[870,158],[1190,198],[1520,78]
    ].forEach(([x, y], i) => {
      const s = this.add.image(x, y, starKeys[i % 3])
        .setDepth(-5).setAlpha(0.3 + Math.random() * 0.4)
        .setTint(i % 2 === 0 ? 0xFF69B4 : 0xFFD700).setScale(0.5 + Math.random() * 0.6);
      this.tweens.add({ targets: s, alpha: 0.1, duration: 900 + Math.random() * 1400, yoyo: true, repeat: -1, delay: Math.random() * 1800 });
    });

    // Floating UFOs in market sky
    [
      { x: 200, y: 160, key: 'ufoRed',    tint: 0xFF4500, scale: 0.65, speed: 5500 },
      { x: 800, y: 120, key: 'ufoYellow', tint: 0xFFD700, scale: 0.55, speed: 7000 },
      { x: 1400,y: 170, key: 'ufoBlue',   tint: 0xFF69B4, scale: 0.6,  speed: 6200 },
    ].forEach(({ x, y, key, tint, scale, speed }) => {
      const ufo = this.add.image(x, y, key).setDepth(-2).setScale(scale).setTint(tint).setAlpha(0.8);
      this.tweens.add({ targets: ufo, y: y + 16, duration: speed, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this.tweens.add({ targets: ufo, x: x + 55, duration: speed * 1.8, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: Math.random() * 800 });
    });

    const gfx = this.add.graphics().setDepth(1);

    // Distant city skyline silhouette
    const buildings = [
      [0,650,75,250],[75,680,60,220],[135,615,95,285],[230,650,70,250],
      [300,595,88,305],[388,665,62,235],[450,620,82,280],[532,672,55,228],
      [587,600,90,300],[677,640,72,260],[749,615,78,285],[827,660,58,240],
      [885,595,88,305],[973,635,68,265],[1041,575,96,325],[1137,650,63,250],
      [1200,605,82,295],[1282,668,53,232],[1335,585,88,315],[1423,645,72,255],[1495,615,55,285]
    ];
    buildings.forEach(([x, y, w, h]) => {
      gfx.fillStyle(0x0a0015, 1);
      gfx.fillRect(x, y, w, h);
      // Neon-lit windows
      for (let wy = y + 18; wy < y + h - 8; wy += 18) {
        for (let wx = x + 6; wx < x + w - 6; wx += 12) {
          if ((wx * wy) % 3 !== 0) {
            const c = (wx + wy) % 5 === 0 ? 0xFF69B4 : (wx * wy) % 7 === 0 ? 0x00FFFF : (wx + wy) % 4 === 0 ? 0xFFD700 : 0x7B68EE;
            gfx.fillStyle(c, 0.55);
            gfx.fillRect(wx, wy, 7, 9);
          }
        }
      }
    });

    // Ground / street
    gfx.fillStyle(0x0d001a, 0.96);
    gfx.fillRect(0, WORLD_H - 100, WORLD_W, 100);
    // Neon street lines
    gfx.fillStyle(0xFF69B4, 0.5);
    gfx.fillRect(0, WORLD_H - 102, WORLD_W, 3);
    gfx.fillStyle(0x00FFFF, 0.3);
    gfx.fillRect(0, WORLD_H - 106, WORLD_W, 2);

    // Market stalls
    const stalls = [
      { x: 200, color: 0xFF69B4, emoji: '🍄', name: 'Snacks' },
      { x: 500, color: 0x00FFFF, emoji: '🔮', name: 'Items' },
      { x: 800, color: 0xFFD700, emoji: '👗', name: 'Fashion' },
      { x: 1100,color: 0x9B59B6, emoji: '🎮', name: 'Games' },
      { x: 1400,color: 0x00FF88, emoji: '🌿', name: 'Plants' }
    ];
    stalls.forEach(({ x, color, emoji, name }) => {
      // Canopy
      gfx.fillStyle(color, 0.9);
      gfx.fillTriangle(x - 72, WORLD_H - 100, x + 72, WORLD_H - 100, x, WORLD_H - 208);
      gfx.fillStyle(0x000000, 0.3);
      gfx.fillTriangle(x - 72, WORLD_H - 100, x - 30, WORLD_H - 100, x - 50, WORLD_H - 160);
      // Booth body
      gfx.fillStyle(0x0a0015, 0.95);
      gfx.fillRect(x - 60, WORLD_H - 208, 120, 108);
      gfx.lineStyle(2, color, 0.9);
      gfx.strokeRect(x - 60, WORLD_H - 208, 120, 108);
      // Counter
      gfx.fillStyle(color, 0.35);
      gfx.fillRect(x - 60, WORLD_H - 130, 120, 30);
      // Glow sign on top
      gfx.fillStyle(color, 0.15);
      gfx.fillRect(x - 50, WORLD_H - 200, 100, 30);
      // Stall label
      this.add.text(x, WORLD_H - 155, `${emoji} ${name}`, {
        fontSize: '12px', fontStyle: 'bold', fill: '#ffffff', stroke: '#000', strokeThickness: 3
      }).setOrigin(0.5, 0.5).setDepth(3);
    });

    // Neon overhead signs
    [
      { x: 350, y: 210, text: '✨ ALIEN EMPORIUM ✨', color: '#FF69B4' },
      { x: 900, y: 190, text: '🛸 COSMIC BAZAAR 🛸',  color: '#00FFFF' },
      { x: 1300,y: 225, text: '🌌 STAR GOODS 🌌',     color: '#FFD700' }
    ].forEach(({ x, y, text, color }) => {
      const sign = this.add.text(x, y, text, {
        fontSize: '17px', fontStyle: 'bold', fill: color,
        stroke: '#000', strokeThickness: 3,
        shadow: { blur: 14, color, fill: true }
      }).setOrigin(0.5, 0.5).setDepth(3);
      this.tweens.add({ targets: sign, alpha: 0.65, duration: 1200 + Math.random() * 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: Math.random() * 400 });
    });

    this.add.text(WORLD_W / 2, 28, '🌆  NEON MARKET', {
      fontSize: '22px', fontStyle: 'bold', fill: '#f9a8d4',
      stroke: '#0a0a1a', strokeThickness: 6,
      shadow: { blur: 14, color: '#FF69B4', fill: true }
    }).setOrigin(0.5, 0).setDepth(10);

    this.localPlayer = new AlienPlayer(this, WORLD_W / 2, WORLD_H - 180, { ...this.character, username: this.username });
    this.localPlayer.setDepth(5);
    this.cameras.main.startFollow(this.localPlayer, true, 0.08, 0.08);
  }

  _buildPortals() {
    this.portals = [
      { x: 80, y: WORLD_H - 140, label: '🌍 Hub Planet', targetScene: 'HubPlanetScene', area: 'hub', tint: 0xa78bfa },
      { x: WORLD_W - 80, y: WORLD_H - 140, label: '💎 Crystal Cave', targetScene: 'CrystalCaveScene', area: 'crystal_cave', tint: 0x00BFFF }
    ];
    this.portals.forEach(portal => {
      const ufo = this.add.image(portal.x, portal.y - 20, 'ufoRed').setTint(portal.tint).setDepth(3).setScale(0.9);
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
      fontSize: '12px', fill: '#ffffff', backgroundColor: '#0d001acc',
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
