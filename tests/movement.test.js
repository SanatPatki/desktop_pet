import test from 'node:test';
import assert from 'node:assert/strict';
import { clampToBounds, moveToward, pickTarget } from '../src/pet/movement.js';

test('pickTarget stays inside bounds with margin', () => {
  const target = pickTarget({ width: 400, height: 300 }, { width: 96, height: 72 }, 20, () => 0.5);
  assert.equal(target.x, 152);
  assert.equal(target.y, 114);
});

test('moveToward moves at the requested speed', () => {
  const position = { x: 0, y: 0 };
  const arrived = moveToward(position, { x: 100, y: 0 }, 50, 1);
  assert.equal(arrived, false);
  assert.equal(position.x, 50);
  assert.equal(position.y, 0);
});

test('clampToBounds keeps the pet inside the viewport', () => {
  const position = { x: -50, y: 999 };
  clampToBounds(position, { width: 96, height: 72 }, { width: 400, height: 300 }, 10);
  assert.equal(position.x, 10);
  assert.equal(position.y, 218);
});
