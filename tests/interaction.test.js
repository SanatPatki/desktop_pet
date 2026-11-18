import test from 'node:test';
import assert from 'node:assert/strict';
import { GRID_HEIGHT, GRID_WIDTH, PIXEL_SIZE } from '../src/pet/sprites.js';
import { isCursorTouchingPet } from '../src/pet/interaction.js';

function frameWithPixel(x, y) {
  const hit = new Uint8Array(GRID_WIDTH * GRID_HEIGHT);
  hit[y * GRID_WIDTH + x] = 1;
  return { hit };
}

test('cursor touching a sprite pixel counts as petting', () => {
  const frame = frameWithPixel(5, 5);
  const touching = isCursorTouchingPet(
    { x: 5 * PIXEL_SIZE + 2, y: 5 * PIXEL_SIZE + 2 },
    { x: 0, y: 0, direction: 1 },
    frame,
  );
  assert.equal(touching, true);
});

test('nearby transparent pixels inside tolerance still count', () => {
  const frame = frameWithPixel(5, 5);
  const touching = isCursorTouchingPet(
    { x: 6 * PIXEL_SIZE, y: 6 * PIXEL_SIZE },
    { x: 0, y: 0, direction: 1 },
    frame,
  );
  assert.equal(touching, true);
});

test('distant cursor does not count', () => {
  const frame = frameWithPixel(5, 5);
  const touching = isCursorTouchingPet(
    { x: 0, y: 0 },
    { x: 0, y: 0, direction: 1 },
    frame,
  );
  assert.equal(touching, false);
});
