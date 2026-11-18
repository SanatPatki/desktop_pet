import { PetEngine } from '../pet/engine.js';
import { createHeartSprite, HeartParticles } from '../pet/hearts.js';
import { isCursorTouchingPet } from '../pet/interaction.js';
import { createSprites, PET_WIDTH, PET_HEIGHT } from '../pet/sprites.js';

const canvas = document.getElementById('pet-canvas');
const context = canvas.getContext('2d');
const sprites = createSprites();
const engine = new PetEngine({ width: window.innerWidth, height: window.innerHeight });
const heartSprite = createHeartSprite();
const heartParticles = new HeartParticles();

let character = 'dragon';
let cursor = null;
let lastRender = null;
let lastFrameTime = performance.now();

function resizeCanvas() {
  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = Math.floor(window.innerWidth * pixelRatio);
  canvas.height = Math.floor(window.innerHeight * pixelRatio);
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  context.imageSmoothingEnabled = false;
  engine.setBounds(window.innerWidth, window.innerHeight);
}

const FLAP_PERIOD = 6;
const FLAP_BURST = 0.8;

function currentFrame(state) {
  const creature = sprites[character];
  if (state.mode === 'pet') {
    return creature.pet[0];
  }
  const frames = state.mode === 'walk' ? creature.walk : creature.idle;
  const bursting = state.mode === 'idle' && state.time % FLAP_PERIOD < FLAP_BURST;
  const interval = state.mode === 'walk' ? 0.11 : bursting ? 0.09 : 0.26;
  return frames[Math.floor(state.time / interval) % frames.length];
}

function bobFor(state) {
  if (state.mode === 'walk') {
    return Math.round(Math.abs(Math.sin(state.time / 110)));
  }
  return Math.round(Math.sin(state.time / (state.mode === 'pet' ? 450 : 320)));
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

function drawHearts(hearts) {
  for (const heart of hearts) {
    context.globalAlpha = Math.max(0, heart.life / heart.maxLife);
    context.drawImage(heartSprite, Math.round(heart.x), Math.round(heart.y));
  }
  context.globalAlpha = 1;
}

function render(state, bob, frame, hearts) {
  context.clearRect(0, 0, window.innerWidth, window.innerHeight);
  drawFrame(frame, state.x, state.y + bob, state.direction);
  drawHearts(hearts);
}

function loop(now) {
  const delta = Math.min((now - lastFrameTime) / 1000, 0.1);
  lastFrameTime = now;

  const petting = lastRender
    ? isCursorTouchingPet(cursor, lastRender.position, lastRender.frame)
    : false;
  const state = engine.update(delta, { cursor, petting });
  const bob = bobFor(state);
  const frame = currentFrame(state);
  const hearts = heartParticles.update(delta, {
    petting,
    origin: { x: state.x, y: state.y + bob, width: PET_WIDTH },
  });

  render(state, bob, frame, hearts);
  lastRender = {
    position: { x: state.x, y: state.y + bob, direction: state.direction },
    frame,
  };
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

window.desktopPet?.onCursor?.((point) => {
  cursor = point;
});

window.desktopPet?.onState?.((state) => {
  if (state?.character === 'dragon' || state?.character === 'phoenix') {
    character = state.character;
  }
});

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
loadState();
requestAnimationFrame(loop);
