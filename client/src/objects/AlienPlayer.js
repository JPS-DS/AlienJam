/**
 * AlienPlayer — the local player character.
 * Drawn procedurally with Phaser Graphics (no external art required for MVP).
 * Species: blob | tentacle | crystal | bug
 */
export default class AlienPlayer extends Phaser.GameObjects.Container {
  constructor(scene, x, y, characterData) {
    super(scene, x, y);
    this.characterData = characterData;
    this.targetX = x;
    this.targetY = y;
    this.isMoving = false;
    this._moveTween = null;

    this._buildSprite();
    this._buildNameTag();
    this._buildShadow();

    scene.add.existing(this);

    // Point-and-click movement
    scene.input.on('pointerdown', this._onPointerDown, this);

    // Hover cursor
    this.setInteractive(new Phaser.Geom.Circle(0, 0, 28), Phaser.Geom.Circle.Contains);
  }

  _buildShadow() {
    const shadow = this.scene.add.ellipse(0, 22, 44, 12, 0x000000, 0.25);
    this.addAt(shadow, 0);
    this.shadow = shadow;
  }

  _buildSprite() {
    const gfx = this.scene.add.graphics();
    this._drawAlien(gfx);
    this.add(gfx);
    this.alienGfx = gfx;
  }

  _drawAlien(gfx) {
    const { species, color } = this.characterData;
    const c = Phaser.Display.Color.HexStringToColor(color).color;
    const darkC = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.HexStringToColor(color),
      { r: 0, g: 0, b: 0 },
      10, 3
    );
    const dark = Phaser.Display.Color.GetColor(darkC.r, darkC.g, darkC.b);

    gfx.clear();

    switch (species) {
      case 'blob':
        // Squishy round blob with glow eyes
        gfx.fillStyle(dark, 1);
        gfx.fillEllipse(2, 2, 50, 46); // shadow
        gfx.fillStyle(c, 1);
        gfx.fillEllipse(0, 0, 50, 46);
        // Eyes
        gfx.fillStyle(0xffffff, 1);
        gfx.fillCircle(-10, -8, 8);
        gfx.fillCircle(10, -8, 8);
        gfx.fillStyle(0x220044, 1);
        gfx.fillCircle(-9, -8, 5);
        gfx.fillCircle(11, -8, 5);
        gfx.fillStyle(0xffffff, 1);
        gfx.fillCircle(-7, -10, 2);
        gfx.fillCircle(13, -10, 2);
        break;

      case 'tentacle':
        // Round head + tentacle legs
        for (let i = -2; i <= 2; i++) {
          const tx = i * 10;
          gfx.fillStyle(dark, 1);
          gfx.fillEllipse(tx + 1, 24, 8, 16);
          gfx.fillStyle(c, 1);
          gfx.fillEllipse(tx, 23, 8, 16);
        }
        gfx.fillStyle(dark, 1);
        gfx.fillCircle(1, -5, 22);
        gfx.fillStyle(c, 1);
        gfx.fillCircle(0, -6, 22);
        // Eyes
        gfx.fillStyle(0xffffff, 1);
        gfx.fillCircle(-8, -8, 7);
        gfx.fillCircle(8, -8, 7);
        gfx.fillStyle(0x003322, 1);
        gfx.fillCircle(-7, -8, 4);
        gfx.fillCircle(9, -8, 4);
        gfx.fillStyle(0xffffff, 1);
        gfx.fillCircle(-5, -10, 1.5);
        gfx.fillCircle(11, -10, 1.5);
        break;

      case 'crystal':
        // Geometric/crystalline shape
        gfx.fillStyle(dark, 1);
        gfx.fillTriangle(-22, 20, 22, 20, 0, -28);
        gfx.fillStyle(c, 0.9);
        gfx.fillTriangle(-20, 18, 20, 18, 0, -26);
        gfx.fillStyle(c, 0.6);
        gfx.fillTriangle(-10, 18, 10, 18, 0, -10);
        // Facets
        gfx.fillStyle(0xffffff, 0.3);
        gfx.fillTriangle(-20, 18, -5, 18, -10, -10);
        // Eyes (gem-like)
        gfx.fillStyle(0xffffff, 1);
        gfx.fillRect(-10, -4, 7, 7);
        gfx.fillRect(3, -4, 7, 7);
        gfx.fillStyle(0x001133, 1);
        gfx.fillRect(-9, -3, 5, 5);
        gfx.fillRect(4, -3, 5, 5);
        break;

      case 'bug':
        // Oval body + antenna
        gfx.fillStyle(dark, 1);
        gfx.fillEllipse(1, 1, 38, 50);
        gfx.fillStyle(c, 1);
        gfx.fillEllipse(0, 0, 38, 50);
        // Wing patches
        gfx.fillStyle(0xffffff, 0.2);
        gfx.fillEllipse(-16, -5, 20, 28);
        gfx.fillEllipse(16, -5, 20, 28);
        // Antennae
        gfx.lineStyle(2, dark, 1);
        gfx.strokePoints([
          new Phaser.Geom.Point(-8, -20),
          new Phaser.Geom.Point(-14, -34),
          new Phaser.Geom.Point(-10, -38)
        ], false);
        gfx.strokePoints([
          new Phaser.Geom.Point(8, -20),
          new Phaser.Geom.Point(14, -34),
          new Phaser.Geom.Point(10, -38)
        ], false);
        gfx.fillStyle(dark, 1);
        gfx.fillCircle(-10, -38, 4);
        gfx.fillCircle(10, -38, 4);
        // Eyes
        gfx.fillStyle(0xffffff, 1);
        gfx.fillEllipse(-9, -8, 12, 10);
        gfx.fillEllipse(9, -8, 12, 10);
        gfx.fillStyle(0x220000, 1);
        gfx.fillCircle(-8, -8, 4);
        gfx.fillCircle(10, -8, 4);
        break;
    }

    // Draw accessories
    this._drawAccessories(gfx, c);
  }

  _drawAccessories(gfx, bodyColor) {
    const acc = this.characterData.accessories || [];

    if (acc.includes('hat')) {
      gfx.fillStyle(0x1a0033, 1);
      gfx.fillRect(-18, -46, 36, 8);
      gfx.fillRect(-12, -66, 24, 24);
    }
    if (acc.includes('crown')) {
      gfx.fillStyle(0xFFD700, 1);
      gfx.fillTriangle(-16, -42, -10, -52, -4, -42);
      gfx.fillTriangle(-4, -42, 2, -54, 8, -42);
      gfx.fillTriangle(8, -42, 14, -52, 20, -42);
      gfx.fillRect(-18, -42, 38, 8);
    }
    if (acc.includes('glasses')) {
      gfx.lineStyle(2, 0x222222, 1);
      gfx.strokeCircle(-9, -8, 9);
      gfx.strokeCircle(9, -8, 9);
      gfx.strokePoints([
        new Phaser.Geom.Point(-18, -8),
        new Phaser.Geom.Point(-22, -6)
      ], false);
      gfx.strokePoints([
        new Phaser.Geom.Point(18, -8),
        new Phaser.Geom.Point(22, -6)
      ], false);
      gfx.strokePoints([
        new Phaser.Geom.Point(0, -8),
        new Phaser.Geom.Point(0, -8)
      ], false);
    }
    if (acc.includes('bow')) {
      gfx.fillStyle(0xff69b4, 1);
      gfx.fillTriangle(-20, -34, -6, -40, -6, -28);
      gfx.fillTriangle(6, -34, 20, -40, 20, -28);
      gfx.fillCircle(0, -34, 5);
    }
    if (acc.includes('antenna')) {
      gfx.lineStyle(2, 0x00ffff, 1);
      gfx.strokePoints([
        new Phaser.Geom.Point(0, -24),
        new Phaser.Geom.Point(0, -44)
      ], false);
      gfx.fillStyle(0x00ffff, 1);
      gfx.fillCircle(0, -46, 5);
    }
    if (acc.includes('scarf')) {
      gfx.fillStyle(0xff4444, 1);
      gfx.fillRect(-22, 12, 44, 10);
      gfx.fillRect(-6, 22, 8, 16);
    }
  }

  _buildNameTag() {
    const name = this.scene.add.text(0, 32, this.characterData.username || '', {
      fontSize: '11px',
      fill: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center'
    }).setOrigin(0.5, 0);
    this.add(name);
    this.nameTag = name;
  }

  _onPointerDown(pointer) {
    if (pointer.rightButtonDown()) return; // right-click = emote wheel

    const scene = this.scene;
    const worldX = pointer.worldX;
    const worldY = pointer.worldY;

    this.moveTo(worldX, worldY, true);
  }

  moveTo(x, y, emitSocket = false) {
    this.targetX = x;
    this.targetY = y;

    const dist = Phaser.Math.Distance.Between(this.x, this.y, x, y);
    const duration = Math.min(2500, Math.max(200, dist * 3.5));

    if (this._moveTween) this._moveTween.stop();

    this._moveTween = this.scene.tweens.add({
      targets: this,
      x,
      y,
      duration,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.isMoving = false;
        if (emitSocket) {
          const socket = this.scene.socket;
          if (socket) socket.emit('player:stopped', { x, y });
        }
      }
    });

    this.isMoving = true;

    if (emitSocket) {
      const socket = this.scene.socket;
      if (socket) socket.emit('player:move', { x, y });
    }

    // Squish/stretch animation while moving
    this.scene.tweens.add({
      targets: this,
      scaleX: 0.9,
      scaleY: 1.1,
      duration: 150,
      yoyo: true,
      ease: 'Quad.easeInOut'
    });
  }

  updateCharacter(data) {
    this.characterData = { ...this.characterData, ...data };
    this.alienGfx.clear();
    this._drawAlien(this.alienGfx);
    if (data.username) this.nameTag.setText(data.username);
  }

  destroy() {
    this.scene?.input?.off('pointerdown', this._onPointerDown, this);
    super.destroy();
  }
}
