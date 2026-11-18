import { GRID_HEIGHT, GRID_WIDTH, PIXEL_SIZE } from './sprites.js';

export function isCursorTouchingPet(cursor, pet, frame, tolerance = 1) {
  if (!cursor || !pet || !frame?.hit) {
    return false;
  }

  const localX = cursor.x - pet.x;
  const localY = cursor.y - pet.y;
  if (localX < 0 || localY < 0 || localX >= GRID_WIDTH * PIXEL_SIZE || localY >= GRID_HEIGHT * PIXEL_SIZE) {
    return false;
  }

  let gridX = Math.floor(localX / PIXEL_SIZE);
  const gridY = Math.floor(localY / PIXEL_SIZE);
  if (pet.direction < 0) {
    gridX = GRID_WIDTH - 1 - gridX;
  }

  for (let dy = -tolerance; dy <= tolerance; dy += 1) {
    for (let dx = -tolerance; dx <= tolerance; dx += 1) {
      const x = gridX + dx;
      const y = gridY + dy;
      if (x >= 0 && y >= 0 && x < GRID_WIDTH && y < GRID_HEIGHT && frame.hit[y * GRID_WIDTH + x]) {
        return true;
      }
    }
  }

  return false;
}
