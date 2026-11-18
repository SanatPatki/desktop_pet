export const HEART_WIDTH = 28;
export const HEART_HEIGHT = 24;

const HEART_MAP = [
  '.XX.XX.',
  'XXXXXXX',
  'XXXXXXX',
  '.XXXXX.',
  '..XXX..',
  '...X...',
];

const HEART_COLOR = '#ff5d8f';
const HEART_OUTLINE = '#d6336c';

export function createHeartSprite() {
  const canvas = document.createElement('canvas');
  canvas.width = HEART_WIDTH;
  canvas.height = HEART_HEIGHT;
  const context = canvas.getContext('2d');
  context.imageSmoothingEnabled = false;

  HEART_MAP.forEach((row, y) => {
    [...row].forEach((cell, x) => {
      if (cell !== 'X') {
        return;
      }
      context.fillStyle = HEART_COLOR;
      context.fillRect(x * 4, y * 4, 4, 4);
      if (x === 0 || x === 6 || y === 0 || y === 5) {
        context.fillStyle = HEART_OUTLINE;
        context.fillRect(x * 4, y * 4, 4, 4);
      }
    });
  });

  return canvas;
}

export class HeartParticles {
  constructor(random = Math.random) {
    this.random = random;
    this.items = [];
    this.spawnTimer = 0;
  }

  update(deltaTime, { petting = false, origin = null } = {}) {
    const dt = Math.min(Math.max(deltaTime, 0), 0.1);

    if (petting && origin) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.items.push({
          x: origin.x + 10 + this.random() * Math.max(1, origin.width - 20),
          y: origin.y - 8,
          vx: (this.random() - 0.5) * 12,
          life: 1.1 + this.random() * 0.4,
          maxLife: 1.5,
        });
        this.spawnTimer = 0.12 + this.random() * 0.12;
      }
    }

    for (const heart of this.items) {
      heart.x += heart.vx * dt;
      heart.y -= 28 * dt;
      heart.life -= dt;
    }
    this.items = this.items.filter((heart) => heart.life > 0);
    return this.items;
  }
}
