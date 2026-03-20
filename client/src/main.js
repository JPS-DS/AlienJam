import Phaser from 'phaser';
import BootScene from './scenes/BootScene.js';
import AuthScene from './scenes/AuthScene.js';
import CharCreateScene from './scenes/CharCreateScene.js';
import HubPlanetScene from './scenes/HubPlanetScene.js';
import CrystalCaveScene from './scenes/CrystalCaveScene.js';
import NeonMarketScene from './scenes/NeonMarketScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: window.innerWidth - 280, // subtract chat panel width
  height: window.innerHeight,
  backgroundColor: '#0a0a1a',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [
    BootScene,
    AuthScene,
    CharCreateScene,
    HubPlanetScene,
    CrystalCaveScene,
    NeonMarketScene
  ]
};

// Hide loading screen once Phaser is ready
const game = new Phaser.Game(config);

game.events.on('ready', () => {
  document.getElementById('loading-screen').classList.add('hidden');
});

// Handle window resize
window.addEventListener('resize', () => {
  const chatWidth = document.getElementById('chat-panel')?.offsetWidth || 280;
  game.scale.resize(window.innerWidth - chatWidth, window.innerHeight);
});

export default game;
