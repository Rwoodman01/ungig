// Generates PWA icons from the Gifted mascot mark (Giff face).
// Uses sharp to resize and pad safely for maskable icons.

import { mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = resolve(__dirname, '..', 'public', 'icons');
const GIFF_FACE = resolve(__dirname, '..', 'public', 'giff', 'face.png');

const BG = '#F9F8F5';

function insetFor(size, { maskable }) {
  // For maskable icons, keep a larger safe margin.
  // W3C guidance: keep critical artwork inside ~80% of the viewport.
  return maskable ? Math.floor(size * 0.20) : Math.floor(size * 0.12);
}

async function makeIcon({ size, maskable }) {
  const inset = insetFor(size, { maskable });
  const content = size - inset * 2;

  // Render a padded square background and center the Giff face inside.
  const face = await sharp(GIFF_FACE)
    .resize(content, content, { fit: 'contain' })
    .png()
    .toBuffer();

  return await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BG,
    },
  })
    .composite([{ input: face, left: inset, top: inset }])
    .png()
    .toBuffer();
}

function ensureDir(p) {
  if (!existsSync(p)) mkdirSync(p, { recursive: true });
}

ensureDir(ICONS_DIR);

const targets = [
  { file: 'icon-192.png', size: 192, maskable: false },
  { file: 'icon-512.png', size: 512, maskable: false },
  { file: 'icon-maskable-512.png', size: 512, maskable: true },
  { file: 'apple-touch-icon.png', size: 180, maskable: false },
];

for (const { file, size, maskable } of targets) {
  const out = resolve(ICONS_DIR, file);
  const buf = await makeIcon({ size, maskable });
  await sharp(buf).toFile(out);
  console.log(`wrote ${file} (${size}x${size})`);
}
