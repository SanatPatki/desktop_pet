import { PET_HEIGHT, PET_WIDTH } from './sprites.js';
import { clampToBounds, moveToward, pickTarget } from './movement.js';

const SPEED = 38;
const EDGE_MARGIN = 28;
const PET_RELEASE_DELAY = 0.35;

export class PetEngine {
  constructor({ width = 800, height = 600, random = Math.random } = {}) {
    this.bounds = { width, height };
    this.petSize = { width: PET_WIDTH, height: PET_HEIGHT };
    this.random = random;
    this.x = (width - PET_WIDTH) / 2;
    this.y = (height - PET_HEIGHT) / 2;
    this.target = null;
    this.mode = 'idle';
    this.direction = 1;
    this.pause = 0.6;
    this.time = 0;
    this.petting = false;
    this.petRelease = 0;
  }

  setBounds(width, height) {
    this.bounds = { width, height };
    clampToBounds(this, this.petSize, this.bounds, EDGE_MARGIN);
  }

  update(deltaTime, { cursor = null, petting = false } = {}) {
    const dt = Math.min(Math.max(deltaTime, 0), 0.1);
    this.time += dt;

    if (petting) {
      this.petting = true;
      this.petRelease = 0;
      this.mode = 'pet';
      this.target = null;
      if (cursor) {
        this.direction = cursor.x < this.x + PET_WIDTH / 2 ? -1 : 1;
      }
      return this.snapshot();
    }

    if (this.mode === 'pet') {
      this.petRelease += dt;
      if (this.petRelease >= PET_RELEASE_DELAY) {
        this.petting = false;
        this.mode = 'idle';
        this.pause = 0.5;
        this.target = null;
      }
      return this.snapshot();
    }

    if (!this.target) {
      this.pause -= dt;
      if (this.pause <= 0) {
        this.target = pickTarget(this.bounds, this.petSize, EDGE_MARGIN, this.random);
        this.mode = 'walk';
      }
    } else {
      const arrived = moveToward(this, this.target, SPEED, dt);
      this.direction = this.target.x >= this.x ? 1 : -1;
      if (arrived) {
        this.target = null;
        this.mode = 'idle';
        this.pause = 0.8 + this.random() * 2.8;
      }
    }

    clampToBounds(this, this.petSize, this.bounds, EDGE_MARGIN);
    return this.snapshot();
  }

  snapshot() {
    return {
      x: this.x,
      y: this.y,
      direction: this.direction,
      mode: this.mode,
      time: this.time,
      petting: this.petting,
    };
  }
}
