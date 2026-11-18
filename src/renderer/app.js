import { createSprites, PET_WIDTH, PET_HEIGHT } from '../pet/sprites.js';

const canvas = document.getElementById('pet-canvas');
const context = canvas.getContext('2d');
const sprites = createSprites();

let character = 'dragon';
let animationTime = 0;
let lastFrameTime = performance.now();

function resizeCanvas() {
  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = Math.floor(window.innerWidth * pixelRatio);
  canvas.height = Math.floor(window.innerHeight * pixelRatio);
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.imageSmoothingEnabled = false;
}

function currentFrame() {
  const frames = sprites[character].idle;
  return frames[Math.floor(animationTime / 600) % frames.length];
}

function render() {
  context.clearRect(0, 0, window.innerWidth, window.innerHeight);

  const frame = currentFrame();
  const x = Math.round(window.innerWidth / 2 - PET_WIDTH / 2);
  const y = Math.round(window.innerHeight / 2 - PET_HEIGHT / 2);
  context.drawImage(frame.canvas, x, y);
}

function loop(now) {
  const delta = Math.min((now - lastFrameTime) / 1000, 0.1);
  lastFrameTime = now;
  animationTime += delta * 1000;
  render();
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
