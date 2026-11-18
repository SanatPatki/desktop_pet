export const GRID_WIDTH = 40;
export const GRID_HEIGHT = 30;
export const PIXEL_SIZE = 4;
export const PET_WIDTH = GRID_WIDTH * PIXEL_SIZE;
export const PET_HEIGHT = GRID_HEIGHT * PIXEL_SIZE;

const PALETTES = {
  dragon: {
    outline: '#101a17',
    body: '#2fbf71',
    shade: '#1d8a52',
    belly: '#ffe08a',
    wing: '#7b5cff',
    wingShade: '#5a3fd4',
    wingLight: '#ffd166',
    horn: '#fff3d6',
    eye: '#4cc9f0',
    pupil: '#0c1f28',
    blush: '#ff9f6e',
    claw: '#ffd166',
  },
  phoenix: {
    outline: '#2a0d12',
    body: '#ef3b4d',
    shade: '#b81f33',
    belly: '#ffcf5c',
    wing: '#ff8c1a',
    wingShade: '#d9480f',
    wingLight: '#ffd23f',
    flame: '#fff3b0',
    beak: '#ffb703',
    eye: '#fff6d8',
    pupil: '#3a0d0d',
    blush: '#ffb703',
    claw: '#ffb703',
  },
};

const FLAP_RAISE = [0, 0.5, 1, 1.2, 0.7, 0.2];

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
    const boundary = new Uint8Array(GRID_WIDTH * GRID_HEIGHT);
    for (let y = 0; y < GRID_HEIGHT; y += 1) {
      for (let x = 0; x < GRID_WIDTH; x += 1) {
        const index = y * GRID_WIDTH + x;
        if (!hit[index]) {
          continue;
        }
        const edge =
          x === 0 ||
          y === 0 ||
          x === GRID_WIDTH - 1 ||
          y === GRID_HEIGHT - 1 ||
          !hit[index - 1] ||
          !hit[index + 1] ||
          !hit[index - GRID_WIDTH] ||
          !hit[index + GRID_WIDTH];
        if (edge) {
          boundary[index] = 1;
        }
      }
    }

    for (let y = 0; y < GRID_HEIGHT; y += 1) {
      for (let x = 0; x < GRID_WIDTH; x += 1) {
        const index = y * GRID_WIDTH + x;
        if (!hit[index]) {
          continue;
        }
        const nearEdge =
          boundary[index] ||
          (x > 0 && boundary[index - 1]) ||
          (x < GRID_WIDTH - 1 && boundary[index + 1]) ||
          (y > 0 && boundary[index - GRID_WIDTH]) ||
          (y < GRID_HEIGHT - 1 && boundary[index + GRID_WIDTH]);
        if (nearEdge) {
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

function drawTail(p, pal, bodyColor, shadeColor, tipColor, flame) {
  p.polygon(
    [
      [9, 19],
      [4, 15],
      [1, 18],
      [2, 22],
      [6, 24],
      [12, 23],
    ],
    bodyColor,
  );
  p.polygon(
    [
      [8, 22],
      [4, 19],
      [3, 22],
      [7, 24],
    ],
    shadeColor,
  );
  p.polygon(
    [
      [1, 17],
      [3, 13],
      [6, 17],
      [4, 20],
      [1, 20],
    ],
    tipColor,
  );
  if (flame) {
    p.polygon(
      [
        [3, 24],
        [1, 20],
        [4, 18],
        [6, 21],
        [5, 25],
      ],
      tipColor === pal.flame ? pal.flame : pal.wingLight,
    );
    p.set(2, 23, pal.flame ?? pal.wingLight);
  }
}

function drawDragon(p, pose) {
  const pal = PALETTES.dragon;
  const flap = pose.flap ?? 0;
  const raise = FLAP_RAISE[flap] ?? 0;
  const step = pose.legPhase ? 1 : 0;

  drawTail(p, pal, pal.body, pal.shade, pal.claw, false);

  p.ellipse(13 + step, 26, 2, 1, pal.shade);
  p.rect(12 + step, 26, 3, 3, pal.shade);
  p.polygon(
    [
      [11 + step, 28],
      [16 + step, 28],
      [15 + step, 27],
      [12 + step, 27],
    ],
    pal.claw,
  );

  const shoulder = [15, 17];
  const elbow = [10, 11 - raise * 5];
  const tips = [
    [3, 7 - raise * 5],
    [4, 11 - raise * 4],
    [8, 15 - raise * 3],
  ];
  p.polygon([shoulder, elbow, tips[0], tips[1], tips[2], [13, 19], shoulder], pal.wing);
  p.polygon([shoulder, elbow, tips[0]], pal.wingShade);
  p.polygon([elbow, tips[0], tips[1]], pal.wingShade);
  p.polygon([tips[0], [tips[0][0] + 2, tips[0][1] + 2], [tips[0][0] - 2, tips[0][1] + 1]], pal.wingLight);
  p.polygon([tips[1], [tips[1][0] + 2, tips[1][1] + 2], [tips[1][0] - 1, tips[1][1] + 2]], pal.wingLight);
  p.line(shoulder[0], shoulder[1], elbow[0], elbow[1], pal.wingLight);

  p.ellipse(16, 21, 10, 6, pal.body);
  p.ellipse(16, 23, 9, 3, pal.shade);
  p.ellipse(17, 22, 7, 3, pal.belly);

  p.ellipse(24 - step, 26, 2, 1, pal.shade);
  p.rect(23 - step, 26, 3, 3, pal.shade);
  p.polygon(
    [
      [22 - step, 28],
      [27 - step, 28],
      [26 - step, 27],
      [23 - step, 27],
    ],
    pal.claw,
  );

  p.polygon(
    [
      [23, 19],
      [28, 13],
      [31, 14],
      [29, 20],
    ],
    pal.body,
  );
  p.polygon(
    [
      [25, 20],
      [28, 16],
      [30, 18],
    ],
    pal.shade,
  );

  p.polygon(
    [
      [28, 10],
      [25, 4],
      [30, 10],
    ],
    pal.horn,
  );
  p.polygon(
    [
      [30, 9],
      [29, 2],
      [33, 8],
    ],
    pal.horn,
  );
  p.polygon(
    [
      [27, 10],
      [29, 5],
      [31, 10],
    ],
    pal.claw,
  );

  p.ellipse(32, 14, 5, 4, pal.body);
  p.polygon(
    [
      [35, 13],
      [40, 15],
      [40, 18],
      [35, 18],
    ],
    pal.body,
  );
  p.polygon(
    [
      [35, 18],
      [39, 19],
      [35, 19],
    ],
    pal.shade,
  );
  p.set(39, 16, pal.pupil);

  if (pose.eyes === 'happy') {
    p.rect(31, 14, 4, 1, pal.outline);
    p.set(30, 17, pal.blush);
    p.set(29, 18, pal.blush);
  } else {
    p.rect(32, 12, 3, 3, pal.eye);
    p.set(32, 12, '#ffffff');
    p.set(33, 13, pal.pupil);
    p.rect(31, 10, 4, 1, pal.horn);
  }
}

function drawPhoenix(p, pose) {
  const pal = PALETTES.phoenix;
  const flap = pose.flap ?? 0;
  const raise = FLAP_RAISE[flap] ?? 0;
  const step = pose.legPhase ? 1 : 0;

  drawTail(p, pal, pal.wingShade, pal.shade, pal.flame, true);

  p.rect(12 + step, 26, 3, 3, pal.wingShade);
  p.polygon(
    [
      [11 + step, 28],
      [16 + step, 28],
      [15 + step, 27],
      [12 + step, 27],
    ],
    pal.claw,
  );

  const shoulder = [15, 17];
  const feathers = [
    [[15, 17], [3, 6 - raise * 5], pal.wingLight],
    [[15, 17], [2, 10 - raise * 4], pal.wing],
    [[15, 17], [7, 15 - raise * 3], pal.wingShade],
    [[14, 16], [10, 6 - raise * 5], pal.flame],
    [[14, 16], [12, 10 - raise * 4], pal.wing],
  ];
  p.ellipse(14, 16, 3, 3, pal.wingShade);
  for (const [base, tip, color] of feathers) {
    feather(p, base, tip, 2, color);
  }
  p.polygon([feathers[0][1], [feathers[0][1][0] + 2, feathers[0][1][1] + 2], [feathers[0][1][0] - 2, feathers[0][1][1] + 1]], pal.flame);
  p.polygon([feathers[3][1], [feathers[3][1][0] + 2, feathers[3][1][1] + 2], [feathers[3][1][0] - 2, feathers[3][1][1] + 1]], pal.wingLight);

  p.ellipse(16, 21, 10, 6, pal.body);
  p.ellipse(16, 23, 9, 3, pal.shade);
  p.ellipse(17, 22, 7, 3, pal.belly);

  p.rect(23 - step, 26, 3, 3, pal.wingShade);
  p.polygon(
    [
      [22 - step, 28],
      [27 - step, 28],
      [26 - step, 27],
      [23 - step, 27],
    ],
    pal.claw,
  );

  p.polygon(
    [
      [23, 19],
      [28, 13],
      [31, 14],
      [29, 20],
    ],
    pal.body,
  );
  p.polygon(
    [
      [25, 20],
      [28, 16],
      [30, 18],
    ],
    pal.shade,
  );
  p.polygon(
    [
      [25, 18],
      [28, 14],
      [30, 17],
    ],
    pal.flame,
  );

  p.polygon(
    [
      [27, 11],
      [23, 4],
      [28, 11],
    ],
    pal.wing,
  );
  p.polygon(
    [
      [29, 10],
      [27, 1],
      [32, 9],
    ],
    pal.flame,
  );
  p.polygon(
    [
      [31, 9],
      [31, 3],
      [34, 8],
    ],
    pal.wingLight,
  );

  p.ellipse(32, 14, 5, 4, pal.body);
  p.polygon(
    [
      [35, 13],
      [40, 15],
      [40, 18],
      [35, 18],
    ],
    pal.beak,
  );
  p.set(39, 16, pal.pupil);
  p.set(36, 16, pal.pupil);

  if (pose.eyes === 'happy') {
    p.rect(31, 14, 4, 1, pal.outline);
    p.set(30, 17, pal.blush);
    p.set(29, 18, pal.blush);
  } else {
    p.rect(32, 12, 3, 3, pal.eye);
    p.set(32, 12, '#ffffff');
    p.set(33, 13, pal.pupil);
  }
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
      idle: [0, 1, 2, 3, 4, 5].map((flap) => createFrame('dragon', { flap })),
      walk: [0, 1, 2, 3, 4, 5].map((flap) => createFrame('dragon', { flap, legPhase: flap % 2 })),
      pet: [createFrame('dragon', { flap: 2, eyes: 'happy' })],
    },
    phoenix: {
      idle: [0, 1, 2, 3, 4, 5].map((flap) => createFrame('phoenix', { flap })),
      walk: [0, 1, 2, 3, 4, 5].map((flap) => createFrame('phoenix', { flap, legPhase: flap % 2 })),
      pet: [createFrame('phoenix', { flap: 2, eyes: 'happy' })],
    },
  };
}
