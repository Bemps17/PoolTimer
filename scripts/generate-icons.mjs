import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');
const svgPath = path.join(publicDir, 'billard_ball_8.svg');

await mkdir(publicDir, { recursive: true });

const svg = await readFile(svgPath);
const background = { r: 10, g: 10, b: 10, alpha: 1 };

async function writeIcon(size, fileName, paddingRatio = 0.08) {
  const padding = Math.round(size * paddingRatio);
  const inner = size - padding * 2;
  await sharp(svg)
    .resize(inner, inner, { fit: 'contain', background })
    .extend({ top: padding, bottom: padding, left: padding, right: padding, background })
    .png()
    .toFile(path.join(publicDir, fileName));
}

await writeIcon(192, 'icon-192.png', 0.08);
await writeIcon(512, 'icon-512.png', 0.08);
await writeIcon(512, 'icon-512-maskable.png', 0.18);
await writeIcon(180, 'apple-touch-icon.png', 0.08);

await writeFile(path.join(publicDir, 'favicon.svg'), svg);

console.log('Icons generated in public/');
