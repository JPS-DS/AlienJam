/**
 * BootScene — preloads all assets, then routes to auth or game.
 */
export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Backgrounds (256x256 tileable)
    this.load.image('bg_hub',    '/assets/game/backgrounds/hub.png');
    this.load.image('bg_cave',   '/assets/game/backgrounds/cave.png');
    this.load.image('bg_market', '/assets/game/backgrounds/market.png');
    this.load.image('bg_blue',   '/assets/game/backgrounds/blue.png');

    // Props
    this.load.image('ufoGreen',      '/assets/game/props/ufoGreen.png');
    this.load.image('ufoRed',        '/assets/game/props/ufoRed.png');
    this.load.image('ufoBlue',       '/assets/game/props/ufoBlue.png');
    this.load.image('ufoYellow',     '/assets/game/props/ufoYellow.png');
    this.load.image('shipManned',    '/assets/game/props/shipManned.png');
    this.load.image('dome',          '/assets/game/props/dome.png');
    this.load.image('meteorBrown',   '/assets/game/props/meteorBrown.png');
    this.load.image('meteorGrey',    '/assets/game/props/meteorGrey.png');
    this.load.image('meteorBrownSm', '/assets/game/props/meteorBrownSm.png');

    // FX
    this.load.image('star1',   '/assets/game/fx/star1.png');
    this.load.image('star2',   '/assets/game/fx/star2.png');
    this.load.image('star3',   '/assets/game/fx/star3.png');
    this.load.image('starGold','/assets/game/fx/starGold.png');

    // Loading bar
    const { width, height } = this.scale;
    const bar = this.add.graphics();
    this.load.on('progress', (v) => {
      bar.clear();
      bar.fillStyle(0x1a1a2e, 1);
      bar.fillRect(0, 0, width, height);
      bar.fillStyle(0x5b21b6, 1);
      bar.fillRect(width / 2 - 150, height / 2 - 6, 300 * v, 12);
      bar.lineStyle(1, 0x3d3d6e, 1);
      bar.strokeRect(width / 2 - 150, height / 2 - 6, 300, 12);
    });
    this.load.on('complete', () => bar.destroy());
  }

  create() {
    const token    = localStorage.getItem('alienjam_token');
    const username = localStorage.getItem('alienjam_username');
    const userId   = localStorage.getItem('alienjam_userId');

    if (token && username && userId) {
      this.scene.start('CharCreateScene', {
        token,
        username,
        userId: parseInt(userId),
        fromBoot: true
      });
    } else {
      this.scene.start('AuthScene');
    }
  }
}
