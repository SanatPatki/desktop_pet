export const GRID_WIDTH = 24;
export const GRID_HEIGHT = 18;
export const PIXEL_SIZE = 4;
export const PET_WIDTH = GRID_WIDTH * PIXEL_SIZE;
export const PET_HEIGHT = GRID_HEIGHT * PIXEL_SIZE;

const PALETTES = {
  dragon: {
    outline: '#20312b',
    body: '#3d9d63',
    bodyDark: '#2c7a4b',
    belly: '#bfe8c9',
    wing: '#f4a261',
    wingDark: '#d97b3f',
    wingLight: '#ffd166',
    horn: '#f8f3d9',
    eye: '#ffe066',
    pupil: '#1d1b16',
    blush: '#f4a261',
  },
  phoenix: {
    outline: '#4a1d1d',
    body: '#e63946',
    bodyDark: '#b4232f',
    belly: '#f4a261',
    wing: '#ffb703',
    wingDark: '#fb8500',
    wingLight: '#ffd60a',
    flame: '#fff3b0',
    beak: '#ff9f1c',
    eye: '#fff6d8',
    pupil: '#3a0d0d',
    blush: '#ffb703',
  },
};

function pointInPolygon(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    const intersects = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersects) {
      inside = !inside;
    }
  }
  return inside;
}

function createPixelCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width = GRID_WIDTH * PIXEL_SIZE;
  canvas.height = GRID_HEIGHT * PIXEL_SIZE;

  const context = canvas.getContext('2d');
  context.imageSmoothingEnabled = false;

  const hit = new Uint8Array(GRID_WIDTH * GRID_HEIGHT);

  function set(x, y, color) {
    const gridX = Math.round(x);
    const gridY = Math.round(y);
    if (gridX < 0 || gridY < 0 || gridX >= GRID_WIDTH || gridY >= GRID_HEIGHT || !color) {
      return;
    }
    context.fillStyle = color;
    context.fillRect(gridX * PIXEL_SIZE, gridY * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
    hit[gridY * GRID_WIDTH + gridX] = 1;
  }

  function rect(x, y, width, height, color) {
    for (let yy = y; yy < y + height; yy += 1) {
      for (let xx = x; xx < x + width; xx += 1) {
        set(xx, yy, color);
      }
    }
  }

  function ellipse(cx, cy, rx, ry, color) {
    rx = Math.max(1, Math.round(rx));
    ry = Math.max(1, Math.round(ry));
    for (let y = -ry; y <= ry; y += 1) {
      for (let x = -rx; x <= rx; x += 1) {
        if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1) {
          set(cx + x, cy + y, color);
        }
      }
    }
  }

  function polygon(points, color) {
    const xs = points.map(([x]) => x);
    const ys = points.map(([, y]) => y);
    const minX = Math.max(0, Math.floor(Math.min(...xs)));
    const maxX = Math.min(GRID_WIDTH - 1, Math.ceil(Math.max(...xs)));
    const minY = Math.max(0, Math.floor(Math.min(...ys)));
    const maxY = Math.min(GRID_HEIGHT - 1, Math.ceil(Math.max(...ys)));

    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        if (pointInPolygon(x + 0.5, y + 0.5, points)) {
          set(x, y, color);
        }
      }
    }
  }

  function line(x0, y0, x1, y1, color) {
    let x = Math.round(x0);
    let y = Math.round(y0);
    const dx = Math.abs(Math.round(x1) - x);
    const dy = -Math.abs(Math.round(y1) - y);
    const sx = x < Math.round(x1) ? 1 : -1;
    const sy = y < Math.round(y1) ? 1 : -1;
    let error = dx + dy;

    while (true) {
      set(x, y, color);
      if (x === Math.round(x1) && y === Math.round(y1)) {
        break;
      }
      const doubled = 2 * error;
      if (doubled >= dy) {
        error += dy;
        x += sx;
      }
      if (doubled <= dx) {
        error += dx;
        y += sy;
      }
    }
  }

  return { canvas, context, hit, set, rect, ellipse, polygon, line };
}

function drawWing(painter, palette, lift, kind) {
  const outer = [
    [12, 8],
    [9, 3 - lift],
    [5, 4 - lift],
    [4, 6 - lift],
    [7, 8],
    [10, 9],
    [12, 8],
  ];
  const inner = [
    [11, 8],
    [9, 4 - lift],
    [6, 5 - lift],
    [6, 7 - lift],
    [8, 8],
    [10, 9],
  ];

  painter.polygon(outer, palette.outline);
  painter.polygon(inner, palette.wing);
  painter.polygon(
    [
      [10, 8],
      [8, 5 - lift],
      [7, 7 - lift],
      [9, 9],
    ],
    palette.wingLight,
  );
  painter.line(12, 8, 5, 4 - lift, palette.wingDark);
  painter.line(12, 8, 7, 8, palette.wingDark);
  painter.line(12, 8, 4, 6 - lift, palette.wingDark);

  if (kind === 'phoenix') {
    painter.polygon(
      [
        [4, 6 - lift],
        [2, 4 - lift],
        [5, 5 - lift],
        [4, 7 - lift],
      ],
      palette.flame,
    );
  }
}

function drawLegs(painter, palette, phase) {
  const footOffset = phase ? 1 : 0;
  for (const [x, direction] of [
    [8, -1],
    [16, 1],
  ]) {
    painter.rect(x, 14, 2, 3, palette.outline);
    painter.rect(x + (direction === 1 ? 0 : 0), 15, 1, 2, palette.bodyDark);
    painter.rect(x + footOffset, 17, 3, 1, palette.outline);
  }
}

function drawDragonTail(painter, palette) {
  painter.ellipse(4, 12, 3, 1, palette.outline);
  painter.ellipse(4, 12, 2, 1, palette.body);
  painter.ellipse(7, 11, 3, 1, palette.outline);
  painter.ellipse(7, 11, 2, 1, palette.body);
  painter.ellipse(10, 10, 3, 1, palette.outline);
  painter.ellipse(10, 10, 2, 1, palette.bodyDark);

  painter.polygon(
    [
      [1, 10],
      [3, 7],
      [5, 9],
      [3, 12],
    ],
    palette.outline,
  );
  painter.polygon(
    [
      [2, 10],
      [3, 8],
      [4, 10],
      [3, 11],
    ],
    palette.wing,
  );
}

function drawDragonBody(painter, palette) {
  painter.ellipse(12, 11, 8, 5, palette.outline);
  painter.ellipse(12, 11, 7, 4, palette.body);
  painter.ellipse(12, 12, 5, 2, palette.belly);

  painter.polygon(
    [
      [8, 8],
      [9, 6],
      [10, 8],
    ],
    palette.horn,
  );
  painter.polygon(
    [
      [12, 7],
      [13, 5],
      [14, 7],
    ],
    palette.horn,
  );
  painter.polygon(
    [
      [15, 8],
      [16, 6],
      [17, 8],
    ],
    palette.horn,
  );
}

function drawDragonHead(painter, palette, eyes) {
  painter.ellipse(16, 9, 4, 3, palette.outline);
  painter.ellipse(16, 9, 3, 2, palette.body);
  painter.ellipse(19, 8, 5, 3, palette.outline);
  painter.ellipse(19, 8, 4, 2, palette.body);

  painter.polygon(
    [
      [16, 5],
      [18, 2],
      [19, 5],
      [17, 6],
    ],
    palette.horn,
  );
  painter.polygon(
    [
      [15, 6],
      [16, 3],
      [17, 6],
    ],
    palette.horn,
  );

  painter.polygon(
    [
      [20, 7],
      [23, 8],
      [23, 10],
      [20, 10],
    ],
    palette.outline,
  );
  painter.polygon(
    [
      [21, 7],
      [22, 8],
      [22, 10],
      [21, 10],
    ],
    palette.body,
  );
  painter.set(22, 8, palette.outline);

  if (eyes === 'happy') {
    painter.rect(20, 7, 2, 1, palette.outline);
    painter.set(18, 9, palette.blush);
    painter.set(17, 10, palette.blush);
  } else {
    painter.rect(20, 6, 2, 2, palette.eye);
    painter.rect(21, 6, 1, 2, palette.pupil);
    painter.rect(19, 5, 3, 1, palette.outline);
  }
}

function drawPhoenixTail(painter, palette) {
  painter.polygon(
    [
      [1, 12],
      [5, 8],
      [8, 10],
      [6, 14],
    ],
    palette.outline,
  );
  painter.polygon(
    [
      [2, 12],
      [5, 9],
      [7, 11],
      [5, 13],
    ],
    palette.wing,
  );
  painter.polygon(
    [
      [4, 11],
      [6, 9],
      [7, 11],
      [5, 12],
    ],
    palette.flame,
  );
}

function drawPhoenixBody(painter, palette) {
  painter.ellipse(12, 11, 8, 5, palette.outline);
  painter.ellipse(12, 11, 7, 4, palette.body);
  painter.ellipse(12, 12, 5, 2, palette.belly);
}

function drawPhoenixHead(painter, palette, eyes) {
  painter.ellipse(16, 9, 4, 3, palette.outline);
  painter.ellipse(16, 9, 3, 2, palette.body);
  painter.ellipse(18, 8, 5, 3, palette.outline);
  painter.ellipse(18, 8, 4, 2, palette.body);

  painter.polygon(
    [
      [14, 6],
      [15, 2],
      [17, 6],
    ],
    palette.wing,
  );
  painter.polygon(
    [
      [16, 5],
      [18, 1],
      [20, 5],
    ],
    palette.flame,
  );
  painter.polygon(
    [
      [20, 7],
      [23, 8],
      [23, 10],
      [20, 9],
    ],
    palette.beak,
  );
  painter.set(23, 8, palette.outline);

  if (eyes === 'happy') {
    painter.rect(19, 7, 2, 1, palette.outline);
    painter.set(17, 9, palette.blush);
    painter.set(16, 10, palette.blush);
  } else {
    painter.rect(19, 6, 2, 2, palette.eye);
    painter.rect(20, 6, 1, 2, palette.pupil);
    painter.rect(18, 5, 3, 1, palette.outline);
  }
}

function drawDragon(painter, pose) {
  drawDragonTail(painter, PALETTES.dragon);
  drawWing(painter, PALETTES.dragon, pose.wingLift, 'dragon');
  drawLegs(painter, PALETTES.dragon, pose.legPhase);
  drawDragonBody(painter, PALETTES.dragon);
  drawDragonHead(painter, PALETTES.dragon, pose.eyes);
}

function drawPhoenix(painter, pose) {
  drawPhoenixTail(painter, PALETTES.phoenix);
  drawWing(painter, PALETTES.phoenix, pose.wingLift, 'phoenix');
  drawLegs(painter, PALETTES.phoenix, pose.legPhase);
  drawPhoenixBody(painter, PALETTES.phoenix);
  drawPhoenixHead(painter, PALETTES.phoenix, pose.eyes);
}

const DRAWERS = {
  dragon: drawDragon,
  phoenix: drawPhoenix,
};

const frameCache = new Map();

function createFrame(character, pose) {
  const key = JSON.stringify({ character, pose });
  if (frameCache.has(key)) {
    return frameCache.get(key);
  }

  const painter = createPixelCanvas();
  DRAWERS[character](painter, {
    wingLift: 0,
    legPhase: 0,
    eyes: 'open',
    ...pose,
  });

  const frame = {
    canvas: painter.canvas,
    hit: painter.hit,
    width: painter.canvas.width,
    height: painter.canvas.height,
  };
  frameCache.set(key, frame);
  return frame;
}

export function createSprites() {
  return {
    dragon: {
      idle: [createFrame('dragon', { wingLift: 0 }), createFrame('dragon', { wingLift: 1 })],
      walk: [createFrame('dragon', { wingLift: 0, legPhase: 0 }), createFrame('dragon', { wingLift: 1, legPhase: 1 })],
      pet: [createFrame('dragon', { wingLift: 0, eyes: 'happy' })],
    },
    phoenix: {
      idle: [createFrame('phoenix', { wingLift: 0 }), createFrame('phoenix', { wingLift: 1 })],
      walk: [createFrame('phoenix', { wingLift: 0, legPhase: 0 }), createFrame('phoenix', { wingLift: 1, legPhase: 1 })],
      pet: [createFrame('phoenix', { wingLift: 0, eyes: 'happy' })],
    },
  };
}
