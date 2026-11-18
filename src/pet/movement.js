export function pickTarget(bounds, size, margin = 32, random = Math.random) {
  const minX = margin;
  const minY = margin;
  const maxX = Math.max(minX, bounds.width - size.width - margin);
  const maxY = Math.max(minY, bounds.height - size.height - margin);

  return {
    x: minX + random() * (maxX - minX),
    y: minY + random() * (maxY - minY),
  };
}

export function moveToward(position, target, speed, deltaTime) {
  const dx = target.x - position.x;
  const dy = target.y - position.y;
  const distance = Math.hypot(dx, dy);

  if (distance === 0) {
    return true;
  }

  const step = Math.min(distance, speed * deltaTime);
  position.x += (dx / distance) * step;
  position.y += (dy / distance) * step;
  return distance - step <= 0.001;
}

export function clampToBounds(position, size, bounds, margin = 12) {
  const minX = margin;
  const minY = margin;
  const maxX = Math.max(minX, bounds.width - size.width - margin);
  const maxY = Math.max(minY, bounds.height - size.height - margin);

  position.x = Math.min(Math.max(position.x, minX), maxX);
  position.y = Math.min(Math.max(position.y, minY), maxY);
}
