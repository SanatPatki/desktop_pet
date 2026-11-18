import electron from 'electron';

const { nativeImage } = electron;
import { deflateSync } from 'node:zlib';

const SIZE = 16;

function drawIconPixels() {
  const pixels = new Uint8Array(SIZE * SIZE * 4);

  function put(x, y, r, g, b, a = 255) {
    if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) {
      return;
    }
    const offset = (y * SIZE + x) * 4;
    pixels[offset] = r;
    pixels[offset + 1] = g;
    pixels[offset + 2] = b;
    pixels[offset + 3] = a;
  }

  for (let y = 1; y < SIZE - 1; y += 1) {
    for (let x = 1; x < SIZE - 1; x += 1) {
      const distance = Math.abs(x - 7.5) + Math.abs(y - 7.5);
      if (distance > 6) {
        continue;
      }

      const edge = distance > 5;
      const t = (y - 1) / (SIZE - 3);
      let r = Math.round(255 + (230 - 255) * t);
      let g = Math.round(214 + (57 - 214) * t);
      let b = Math.round(10 + (70 - 10) * t);
      if (edge) {
        r = 74;
        g = 29;
        b = 29;
      }
      put(x, y, r, g, b);
    }
  }

  put(6, 7, 58, 13, 13);
  put(9, 7, 58, 13, 13);
  put(7, 11, 255, 243, 176);

  return pixels;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function encodePng(width, height, rgba) {
  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y += 1) {
    const rowOffset = y * (1 + width * 4);
    raw[rowOffset] = 0;
    Buffer.from(rgba.buffer, rgba.byteOffset + y * width * 4, width * 4).copy(raw, rowOffset + 1);
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 6, 0, 0, 0], 8);

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', header),
    pngChunk('IDAT', deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

export function createTrayIcon() {
  const png = encodePng(SIZE, SIZE, drawIconPixels());
  return nativeImage.createFromDataURL(`data:image/png;base64,${png.toString('base64')}`);
}
