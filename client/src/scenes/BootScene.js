/**
 * BootScene — first scene. Checks for existing JWT, routes to auth or game.
 */
export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Nothing to preload yet — all graphics are procedural
  }

  create() {
    const token = localStorage.getItem('alienjam_token');
    const username = localStorage.getItem('alienjam_username');
    const userId = localStorage.getItem('alienjam_userId');

    if (token && username && userId) {
      // Try to use existing session
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
