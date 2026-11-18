import { PetEngine } from '../pet/engine.js';
import { createSprites, PET_WIDTH, PET_HEIGHT } from '../pet/sprites.js';

const canvas = document.getElementById('pet-canvas');
const context = canvas.getContext('2d');
const sprites = createSprites();
const engine = new PetEngine({ width: window.innerWidth, height: window.innerHeight });

let character = 'dragon';
let lastFrameTime = performance.now();

function resizeCanvas() {
  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = Math.floor(window.innerWidth * pixelRatio);
  canvas.height = Math.floor(window.innerHeight * pixelRatio);
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.imageSmoothingEnabled = false;
  engine.setBounds(window.innerWidth, window.innerHeight);
}

function currentFrame(state) {
  const creature = sprites[character];
  if (state.mode === 'pet') {
    return creature.pet[0];
  }
  if (state.mode === 'walk') {
    return creature.walk[Math.floor(state.time / 160) % creature.walk.length];
  }
  return creature.idle[Math.floor(state.time / 650) % creature.idle.length];
}

function drawFrame(frame, x, y, direction) {
  const drawX = Math.round(x);
  const drawY = Math.round(y);

  if (direction >= 0) {
    context.drawImage(frame.canvas, drawX, drawY);
    return;
  }

  context.save();
  context.translate(drawX + PET_WIDTH, drawY);
  context.scale(-1, 1);
  context.drawImage(frame.canvas, 0, 0);
  context.restore();
}

function render(state) {
  context.clearRect(0, 0, window.innerWidth, window.innerHeight);

  const bob = state.mode === 'walk'
    ? Math.round(Math.abs(Math.sin(state.time / 110)))
    : Math.round(Math.sin(state.time / (state.mode === 'pet' ? 450 : 320)));

  drawFrame(currentFrame(state), state.x, state.y + bob, state.direction);
}

function loop(now) {
  const delta = Math.min((now - lastFrameTime) / 1000, 0.1);
  lastFrameTime = now;
  render(engine.update(delta));
  requestAnimationFrame(loop);
}

async function loadState() {
  try {
    const state = await window.desktopPet?.getState?.();
    if (state?.character === 'dragon' || state?.character === 'phoenix') {
      character = state.character;
    }
  } catch {
    character = 'dragon';
  }
}

window.desktopPet?.onState?.((state) => {
  if (state?.character === 'dragon' || state?.character === 'phoenix') {
    character = state.character;
  }
});

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
loadState();
requestAnimationFrame(loop);
