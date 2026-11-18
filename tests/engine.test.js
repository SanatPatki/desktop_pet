import test from 'node:test';
import assert from 'node:assert/strict';
import { PetEngine } from '../src/pet/engine.js';

test('engine roams toward a picked target', () => {
  const engine = new PetEngine({ width: 800, height: 600, random: () => 0.9 });
  const startX = engine.x;
  let state = engine.update(0.016);

  for (let i = 0; i < 40 && state.mode !== 'walk'; i += 1) {
    state = engine.update(0.05);
  }

  assert.equal(state.mode, 'walk');

  for (let i = 0; i < 20; i += 1) {
    engine.update(0.05);
  }

  assert.notEqual(engine.x, startX);
});

test('engine enters pet mode while being petted', () => {
  const engine = new PetEngine({ width: 800, height: 600 });
  const state = engine.update(0.016, { petting: true, cursor: { x: engine.x + 90, y: engine.y } });
  assert.equal(state.mode, 'pet');
  assert.equal(state.petting, true);
});
