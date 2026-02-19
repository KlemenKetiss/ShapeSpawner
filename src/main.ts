import { Game } from './core/Game';
import { createControls } from './ui/Controls';

async function startSetup() {
  const canvasContainer = document.getElementById('canvas-container');
  if (!canvasContainer) {
    throw new Error('Missing #canvas-container element.');
  }

  // Bind HTML elements to 
  const controls = createControls({
    spawnValueId: 'spawn-value',
    gravityValueId: 'gravity-value',
    spawnMinusId: 'spawn-minus',
    spawnPlusId: 'spawn-plus',
    gravityMinusId: 'gravity-minus',
    gravityPlusId: 'gravity-plus',
  });
  controls.bind();

  const game = new Game({
    container: canvasContainer,
    getSpawnRate: controls.getSpawnRate,
    getGravity: controls.getGravity,
    hudCountId: 'hud-count',
    hudAreaId: 'hud-area',
  });
  await game.init();
}

startSetup().catch((err) => {
  console.error(err);
});
