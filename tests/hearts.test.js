import test from 'node:test';
import assert from 'node:assert/strict';
import { HeartParticles } from '../src/pet/hearts.js';

test('hearts spawn while petting and expire', () => {
  const hearts = new HeartParticles(() => 0.5);
  hearts.update(0.2, { petting: true, origin: { x: 10, y: 20, width: 96 } });
  assert.equal(hearts.items.length, 1);

  for (let i = 0; i < 20; i += 1) {
    hearts.update(0.1);
  }
  assert.equal(hearts.items.length, 0);
});
