// Generates placeholder PWA icons (solid navy with a gold "U") as PNGs.
// Pure Node, no dependencies — uses zlib for PNG encoding.
// Replace public/icons/*.png with your real brand assets before launch.

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = resolve(__dirname, '..', 'public', 'icons');

// Brand palette — jet black background, silver glyph.
const JET = [0x0d, 0x0d, 0x0f];    // #0D0D0F
const SILVER = [0xd5, 0xd7, 0xdc]; // #D5D7DC

function crc32(buf) {
  let c;
  const table = crc32.table ?? (crc32.table = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })());
  c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

// Very rough 5x5 bitmap of the letter "U" (1 = gold pixel).
const U_GLYPH = [
  [1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1],
  [0, 1, 1, 1, 0],
];

function makePng(size, { maskable = false } = {}) {
  const w = size;
  const h = size;

  // Safe area inset for maskable icons (10% padding per side per W3C guidance).
  const inset = maskable ? Math.floor(size * 0.18) : Math.floor(size * 0.12);
  const glyphSize = size - inset * 2;
  const cell = Math.floor(glyphSize / U_GLYPH.length);
  const glyphStartX = Math.floor((size - cell * U_GLYPH[0].length) / 2);
  const glyphStartY = Math.floor((size - cell * U_GLYPH.length) / 2);

  // Row-by-row: each row starts with a filter byte (0 = None) then RGB bytes.
  const rowStride = 1 + w * 3;
  const raw = Buffer.alloc(rowStride * h);
  for (let y = 0; y < h; y++) {
    raw[y * rowStride] = 0;
    for (let x = 0; x < w; x++) {
      let color = JET;
      const gy = Math.floor((y - glyphStartY) / cell);
      const gx = Math.floor((x - glyphStartX) / cell);
      if (
        gy >= 0 && gy < U_GLYPH.length &&
        gx >= 0 && gx < U_GLYPH[0].length &&
        U_GLYPH[gy][gx] === 1
      ) {
        color = SILVER;
      }
      const off = y * rowStride + 1 + x * 3;
      raw[off] = color[0];
      raw[off + 1] = color[1];
      raw[off + 2] = color[2];
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type = RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idat = deflateSync(raw);

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function ensureDir(p) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

ensureDir(ICONS_DIR);

const targets = [
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  { file: 'icon-maskable-512.png', size: 512, maskable: true },
  { file: 'apple-touch-icon.png', size: 180 },
];

for (const { file, size, maskable } of targets) {
  const out = resolve(ICONS_DIR, file);
  writeFileSync(out, makePng(size, { maskable: !!maskable }));
  console.log(`wrote ${file} (${size}x${size})`);
}
