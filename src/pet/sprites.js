export const GRID_WIDTH = 28;
export const GRID_HEIGHT = 20;
export const PIXEL_SIZE = 4;
export const PET_WIDTH = GRID_WIDTH * PIXEL_SIZE;
export const PET_HEIGHT = GRID_HEIGHT * PIXEL_SIZE;

const PALETTES = {
  dragon: {
    outline: '#17251f',
    body: '#2f9e5f',
    shade: '#237a4b',
    belly: '#f4d35e',
    wing: '#6d4c9f',
    wingShade: '#4c3573',
    wingLight: '#f4a261',
    accent: '#ffd166',
    horn: '#f8f3d9',
    eye: '#4cc9f0',
    pupil: '#10232b',
    blush: '#f4a261',
    detail: '#1d4d38',
    highlight: '#ffffff',
  },
  phoenix: {
    outline: '#3a1420',
    body: '#d62828',
    shade: '#a4161a',
    belly: '#ffb703',
    wing: '#ff9f1c',
    wingShade: '#e85d04',
    wingLight: '#ffd60a',
    flame: '#fff3b0',
    beak: '#ff9f1c',
    eye: '#fff6d8',
    pupil: '#3a0d0d',
    blush: '#ffb703',
    detail: '#7f1d1d',
    highlight: '#ffffff',
  },
};

const FLAP_RAISE = [0, 0.55, 1, 0.7];

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

  const grid = new Array(GRID_WIDTH * GRID_HEIGHT).fill(null);
  const hit = new Uint8Array(GRID_WIDTH * GRID_HEIGHT);

  function set(x, y, color) {
    const gridX = Math.round(x);
    const gridY = Math.round(y);
    if (gridX < 0 || gridY < 0 || gridX >= GRID_WIDTH || gridY >= GRID_HEIGHT || !color) {
      return;
    }
    grid[gridY * GRID_WIDTH + gridX] = color;
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
    const targetX = Math.round(x1);
    const targetY = Math.round(y1);
    const dx = Math.abs(targetX - x);
    const dy = -Math.abs(targetY - y);
    const sx = x < targetX ? 1 : -1;
    const sy = y < targetY ? 1 : -1;
    let error = dx + dy;

    while (true) {
      set(x, y, color);
      if (x === targetX && y === targetY) {
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

  function finalize(outlineColor) {
    for (let y = 0; y < GRID_HEIGHT; y += 1) {
      for (let x = 0; x < GRID_WIDTH; x += 1) {
        const index = y * GRID_WIDTH + x;
        if (!hit[index]) {
          continue;
        }
        const boundary =
          x === 0 ||
          y === 0 ||
          x === GRID_WIDTH - 1 ||
          y === GRID_HEIGHT - 1 ||
          !hit[index - 1] ||
          !hit[index + 1] ||
          !hit[index - GRID_WIDTH] ||
          !hit[index + GRID_WIDTH];
        if (boundary) {
          grid[index] = outlineColor;
        }
      }
    }

    for (let y = 0; y < GRID_HEIGHT; y += 1) {
      for (let x = 0; x < GRID_WIDTH; x += 1) {
        const index = y * GRID_WIDTH + x;
        if (!hit[index]) {
          continue;
        }
        context.fillStyle = grid[index] || outlineColor;
        context.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
      }
    }
  }

  return { canvas, hit, set, rect, ellipse, polygon, line, finalize };
}

function feather(p, base, tip, width, color) {
  const dx = tip[0] - base[0];
  const dy = tip[1] - base[1];
  const length = Math.hypot(dx, dy) || 1;
  const nx = (-dy / length) * width;
  const ny = (dx / length) * width;
  p.polygon(
    [
      base,
      [tip[0] + nx, tip[1] + ny],
      [tip[0] - nx, tip[1] - ny],
    ],
    color,
  );
}

function drawDragonTail(p, pal) {
  p.polygon(
    [
      [11, 12],
      [8, 10],
      [5, 11],
      [2, 13],
      [4, 15],
      [10, 15],
    ],
    pal.shade,
  );
  p.polygon(
    [
      [1, 12],
      [3, 9],
      [5, 11],
      [4, 14],
      [2, 14],
    ],
    pal.accent,
  );
  p.line(6, 12, 9, 13, pal.accent);
}

function drawDragonWing(p, pal, flap) {
  const raise = FLAP_RAISE[flap] ?? 0;
  const shoulder = [13, 10];
  const wrist = [7, 6 - raise * 3];
  const tips = [
    [2, 4 - raise * 3],
    [3, 7 - raise * 2],
    [6, 9 - raise * 2],
  ];

  p.polygon([shoulder, wrist, tips[0], tips[1], tips[2], [10, 11], [13, 10]], pal.wing);
  p.polygon([shoulder, wrist, tips[0], tips[1]], pal.wingShade);
  p.polygon([shoulder, [11, 7 - raise], [10, 10]], pal.wingShade);

  p.line(shoulder[0], shoulder[1], wrist[0], wrist[1], pal.wingLight);
  for (const tip of tips) {
    p.line(wrist[0], wrist[1], tip[0], tip[1], pal.wingShade);
    feather(p, wrist, tip, 1, pal.wingLight);
    p.polygon(
      [
        tip,
        [tip[0] + 1, tip[1] + 1],
        [tip[0] - 1, tip[1] + 1],
      ],
      pal.accent,
    );
  }
}

function drawDragonLegs(p, pal, phase) {
  const offset = phase ? 1 : 0;
  p.ellipse(8, 15, 2, 2, pal.body);
  p.rect(7 + offset, 16, 2, 3, pal.shade);
  p.polygon(
    [
      [6 + offset, 18],
      [10 + offset, 18],
      [9 + offset, 17],
      [7 + offset, 17],
    ],
    pal.accent,
  );

  p.ellipse(17, 15, 2, 2, pal.body);
  p.rect(16 - offset, 16, 2, 3, pal.shade);
  p.polygon(
    [
      [15 - offset, 18],
      [19 - offset, 18],
      [18 - offset, 17],
      [16 - offset, 17],
    ],
    pal.accent,
  );
}

function drawDragonBody(p, pal) {
  p.ellipse(12, 13, 6, 4, pal.body);
  p.ellipse(12, 14, 5, 2, pal.shade);
  p.ellipse(13, 14, 4, 1, pal.belly);
  p.line(8, 11, 11, 10, pal.detail);
  p.line(11, 10, 14, 11, pal.detail);
}

function drawDragonNeck(p, pal) {
  p.polygon(
    [
      [15, 11],
      [18, 8],
      [21, 9],
      [19, 12],
    ],
    pal.body,
  );
  p.polygon(
    [
      [17, 12],
      [19, 10],
      [20, 12],
    ],
    pal.shade,
  );
  p.line(16, 10, 19, 9, pal.accent);
  p.line(16, 11, 19, 12, pal.accent);
}

function drawDragonHead(p, pal, eyes) {
  p.ellipse(22, 9, 4, 3, pal.body);
  p.polygon(
    [
      [24, 8],
      [28, 9],
      [28, 11],
      [24, 11],
    ],
    pal.body,
  );
  p.polygon(
    [
      [24, 11],
      [27, 12],
      [24, 12],
    ],
    pal.shade,
  );
  p.set(27, 9, pal.pupil);

  p.polygon(
    [
      [20, 7],
      [18, 3],
      [21, 6],
    ],
    pal.horn,
  );
  p.polygon(
    [
      [22, 6],
      [21, 2],
      [24, 5],
    ],
    pal.horn,
  );
  p.polygon(
    [
      [20, 6],
      [22, 3],
      [24, 6],
    ],
    pal.accent,
  );

  if (eyes === 'happy') {
    p.rect(22, 8, 3, 1, pal.outline);
    p.set(20, 10, pal.blush);
    p.set(19, 11, pal.blush);
  } else {
    p.rect(23, 7, 2, 2, pal.eye);
    p.set(23, 7, pal.highlight);
    p.set(24, 8, pal.pupil);
  }
}

function drawDragon(p, pose) {
  const pal = PALETTES.dragon;
  drawDragonTail(p, pal);
  drawDragonWing(p, pal, pose.flap ?? 0);
  drawDragonLegs(p, pal, pose.legPhase ?? 0);
  drawDragonBody(p, pal);
  drawDragonNeck(p, pal);
  drawDragonHead(p, pal, pose.eyes ?? 'open');
}

function drawPhoenixTail(p, pal) {
  p.polygon(
    [
      [10, 12],
      [6, 10],
      [3, 12],
      [5, 15],
      [9, 15],
    ],
    pal.shade,
  );
  p.polygon(
    [
      [8, 13],
      [5, 11],
      [4, 13],
      [7, 15],
    ],
    pal.wing,
  );
  p.polygon(
    [
      [2, 14],
      [4, 12],
      [6, 14],
      [3, 16],
    ],
    pal.flame,
  );
  p.line(6, 12, 9, 13, pal.wingLight);
}

function drawPhoenixWing(p, pal, flap) {
  const raise = FLAP_RAISE[flap] ?? 0;
  const shoulder = [13, 10];
  const feathers = [
    [[13, 10], [3, 3 - raise * 3], pal.wingLight],
    [[13, 10], [2, 6 - raise * 2], pal.wing],
    [[13, 10], [5, 8 - raise * 2], pal.wingShade],
    [[12, 9], [8, 3 - raise * 3], pal.flame],
    [[12, 9], [9, 5 - raise * 2], pal.wing],
  ];

  p.ellipse(12, 9, 2, 2, pal.wingShade);
  for (const [base, tip, color] of feathers) {
    feather(p, base, tip, 1, color);
    p.line(base[0], base[1], tip[0], tip[1], pal.outline);
    p.polygon(
      [
        tip,
        [tip[0] + 1, tip[1] + 1],
        [tip[0] - 1, tip[1] + 1],
      ],
      pal.flame,
    );
  }
}

function drawPhoenixLegs(p, pal, phase) {
  const offset = phase ? 1 : 0;
  p.rect(7 + offset, 15, 2, 4, pal.wingShade);
  p.polygon(
    [
      [6 + offset, 18],
      [10 + offset, 18],
      [9 + offset, 17],
      [7 + offset, 17],
    ],
    pal.beak,
  );
  p.rect(16 - offset, 15, 2, 4, pal.wingShade);
  p.polygon(
    [
      [15 - offset, 18],
      [19 - offset, 18],
      [18 - offset, 17],
      [16 - offset, 17],
    ],
    pal.beak,
  );
}

function drawPhoenixBody(p, pal) {
  p.ellipse(12, 13, 6, 4, pal.body);
  p.ellipse(12, 14, 5, 2, pal.shade);
  p.ellipse(13, 14, 4, 1, pal.belly);
  p.line(8, 11, 11, 10, pal.detail);
  p.line(11, 10, 14, 11, pal.detail);
}

function drawPhoenixNeck(p, pal) {
  p.polygon(
    [
      [15, 11],
      [18, 8],
      [21, 9],
      [19, 12],
    ],
    pal.body,
  );
  p.polygon(
    [
      [17, 12],
      [19, 10],
      [20, 12],
    ],
    pal.shade,
  );
  p.polygon(
    [
      [16, 11],
      [19, 9],
      [20, 11],
      [18, 13],
    ],
    pal.flame,
  );
}

function drawPhoenixHead(p, pal, eyes) {
  p.ellipse(21, 9, 4, 3, pal.body);
  p.polygon(
    [
      [15, 8],
      [13, 3],
      [16, 7],
    ],
    pal.wing,
  );
  p.polygon(
    [
      [18, 7],
      [17, 0],
      [20, 6],
    ],
    pal.flame,
  );
  p.polygon(
    [
      [21, 6],
      [22, 2],
      [23, 6],
    ],
    pal.wingLight,
  );
  p.polygon(
    [
      [23, 8],
      [28, 9],
      [28, 10],
      [23, 10],
    ],
    pal.beak,
  );
  p.set(27, 9, pal.pupil);

  if (eyes === 'happy') {
    p.rect(21, 8, 3, 1, pal.outline);
    p.set(19, 10, pal.blush);
    p.set(18, 11, pal.blush);
  } else {
    p.rect(22, 7, 2, 2, pal.eye);
    p.set(22, 7, pal.highlight);
    p.set(23, 8, pal.pupil);
  }
}

function drawPhoenix(p, pose) {
  const pal = PALETTES.phoenix;
  drawPhoenixTail(p, pal);
  drawPhoenixWing(p, pal, pose.flap ?? 0);
  drawPhoenixLegs(p, pal, pose.legPhase ?? 0);
  drawPhoenixBody(p, pal);
  drawPhoenixNeck(p, pal);
  drawPhoenixHead(p, pal, pose.eyes ?? 'open');
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
    flap: 0,
    legPhase: 0,
    eyes: 'open',
    ...pose,
  });
  painter.finalize(PALETTES[character].outline);

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
      idle: [0, 1, 2, 3].map((flap) => createFrame('dragon', { flap })),
      walk: [0, 1, 2, 3].map((flap) => createFrame('dragon', { flap, legPhase: flap % 2 })),
      pet: [createFrame('dragon', { flap: 3, eyes: 'happy' })],
    },
    phoenix: {
      idle: [0, 1, 2, 3].map((flap) => createFrame('phoenix', { flap })),
      walk: [0, 1, 2, 3].map((flap) => createFrame('phoenix', { flap, legPhase: flap % 2 })),
      pet: [createFrame('phoenix', { flap: 3, eyes: 'happy' })],
    },
  };
}
