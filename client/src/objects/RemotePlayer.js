/**
 * RemotePlayer — other players in the scene.
 * Rendered the same as AlienPlayer but movement is server-driven (tweened).
 */
export default class RemotePlayer extends Phaser.GameObjects.Container {
  constructor(scene, playerData) {
    super(scene, playerData.x, playerData.y);
    this.playerData = playerData;
    this._buildShadow();
    this._buildSprite();
    this._buildNameTag();
    this.chatBubble = null;
    this.emotePopup = null;

    scene.add.existing(this);
    this.setDepth(1);
  }

  _buildShadow() {
    const shadow = this.scene.add.ellipse(0, 22, 44, 12, 0x000000, 0.2);
    this.addAt(shadow, 0);
  }

  _buildSprite() {
    const gfx = this.scene.add.graphics();
    this._drawAlien(gfx);
    this.add(gfx);
    this.alienGfx = gfx;
  }

  _drawAlien(gfx) {
    const { species, color } = this.playerData;
    gfx.clear();

    const c = Phaser.Display.Color.HexStringToColor(color).color;
    const darkC = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.HexStringToColor(color),
      { r: 0, g: 0, b: 0 },
      10, 3
    );
    const dark = Phaser.Display.Color.GetColor(darkC.r, darkC.g, darkC.b);

    switch (species) {
      case 'blob':
        gfx.fillStyle(dark, 1); gfx.fillEllipse(2, 2, 50, 46);
        gfx.fillStyle(c, 1); gfx.fillEllipse(0, 0, 50, 46);
        gfx.fillStyle(0xffffff, 1); gfx.fillCircle(-10, -8, 8); gfx.fillCircle(10, -8, 8);
        gfx.fillStyle(0x220044, 1); gfx.fillCircle(-9, -8, 5); gfx.fillCircle(11, -8, 5);
        gfx.fillStyle(0xffffff, 1); gfx.fillCircle(-7, -10, 2); gfx.fillCircle(13, -10, 2);
        break;
      case 'tentacle':
        for (let i = -2; i <= 2; i++) {
          const tx = i * 10;
          gfx.fillStyle(dark, 1); gfx.fillEllipse(tx + 1, 24, 8, 16);
          gfx.fillStyle(c, 1); gfx.fillEllipse(tx, 23, 8, 16);
        }
        gfx.fillStyle(dark, 1); gfx.fillCircle(1, -5, 22);
        gfx.fillStyle(c, 1); gfx.fillCircle(0, -6, 22);
        gfx.fillStyle(0xffffff, 1); gfx.fillCircle(-8, -8, 7); gfx.fillCircle(8, -8, 7);
        gfx.fillStyle(0x003322, 1); gfx.fillCircle(-7, -8, 4); gfx.fillCircle(9, -8, 4);
        gfx.fillStyle(0xffffff, 1); gfx.fillCircle(-5, -10, 1.5); gfx.fillCircle(11, -10, 1.5);
        break;
      case 'crystal':
        gfx.fillStyle(dark, 1); gfx.fillTriangle(-22, 20, 22, 20, 0, -28);
        gfx.fillStyle(c, 0.9); gfx.fillTriangle(-20, 18, 20, 18, 0, -26);
        gfx.fillStyle(c, 0.6); gfx.fillTriangle(-10, 18, 10, 18, 0, -10);
        gfx.fillStyle(0xffffff, 0.3); gfx.fillTriangle(-20, 18, -5, 18, -10, -10);
        gfx.fillStyle(0xffffff, 1); gfx.fillRect(-10, -4, 7, 7); gfx.fillRect(3, -4, 7, 7);
        gfx.fillStyle(0x001133, 1); gfx.fillRect(-9, -3, 5, 5); gfx.fillRect(4, -3, 5, 5);
        break;
      case 'bug':
        gfx.fillStyle(dark, 1); gfx.fillEllipse(1, 1, 38, 50);
        gfx.fillStyle(c, 1); gfx.fillEllipse(0, 0, 38, 50);
        gfx.fillStyle(0xffffff, 0.2); gfx.fillEllipse(-16, -5, 20, 28); gfx.fillEllipse(16, -5, 20, 28);
        gfx.lineStyle(2, dark, 1);
        gfx.strokePoints([new Phaser.Geom.Point(-8, -20), new Phaser.Geom.Point(-14, -34), new Phaser.Geom.Point(-10, -38)], false);
        gfx.strokePoints([new Phaser.Geom.Point(8, -20), new Phaser.Geom.Point(14, -34), new Phaser.Geom.Point(10, -38)], false);
        gfx.fillStyle(dark, 1); gfx.fillCircle(-10, -38, 4); gfx.fillCircle(10, -38, 4);
        gfx.fillStyle(0xffffff, 1); gfx.fillEllipse(-9, -8, 12, 10); gfx.fillEllipse(9, -8, 12, 10);
        gfx.fillStyle(0x220000, 1); gfx.fillCircle(-8, -8, 4); gfx.fillCircle(10, -8, 4);
        break;
    }
  }

  _buildNameTag() {
    const name = this.scene.add.text(0, 32, this.playerData.username || '', {
      fontSize: '11px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center'
    }).setOrigin(0.5, 0);
    this.add(name);
    this.nameTag = name;
  }

  // Smoothly move toward new position
  moveTo(x, y) {
    const dist = Phaser.Math.Distance.Between(this.x, this.y, x, y);
    const duration = Math.min(2000, Math.max(150, dist * 3));

    this.scene.tweens.add({
      targets: this,
      x,
      y,
      duration,
      ease: 'Quad.easeOut'
    });
  }

  showChatBubble(text) {
    if (this.chatBubble) {
      this.chatBubble.destroy();
      this.chatBubble = null;
    }

    // Truncate long messages in bubble
    const display = text.length > 40 ? text.slice(0, 40) + '…' : text;

    const bubble = this.scene.add.text(0, -72, display, {
      fontSize: '12px',
      fill: '#ffffff',
      backgroundColor: '#1a1a2ecc',
      padding: { x: 8, y: 5 },
      borderRadius: 8,
      stroke: '#3d3d6e',
      strokeThickness: 1,
      wordWrap: { width: 160 },
      align: 'center'
    }).setOrigin(0.5, 1);

    this.add(bubble);
    this.chatBubble = bubble;

    this.scene.time.delayedCall(4000, () => {
      if (this.chatBubble === bubble) {
        this.scene.tweens.add({
          targets: bubble,
          alpha: 0,
          duration: 400,
          onComplete: () => { bubble.destroy(); if (this.chatBubble === bubble) this.chatBubble = null; }
        });
      }
    });
  }

  showEmote(emoteId) {
    const EMOTE_MAP = {
      wave: '👋', dance: '💃', laugh: '😂', cry: '😭',
      heart: '❤️', think: '🤔', zzz: '💤', alien: '👽'
    };
    const emoji = EMOTE_MAP[emoteId] || '?';

    if (this.emotePopup) { this.emotePopup.destroy(); }

    const popup = this.scene.add.text(0, -90, emoji, {
      fontSize: '28px',
      align: 'center'
    }).setOrigin(0.5, 1);

    this.add(popup);
    this.emotePopup = popup;

    this.scene.tweens.add({
      targets: popup,
      y: -110,
      alpha: 0,
      duration: 2000,
      ease: 'Cubic.easeOut',
      onComplete: () => { popup.destroy(); if (this.emotePopup === popup) this.emotePopup = null; }
    });
  }
}
