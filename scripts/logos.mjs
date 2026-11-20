#!/usr/bin/env node
// @spec SITE-UI-LOGO-002, SITE-UI-LOGO-003
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, sha256 } from './lib.mjs';

const logoSources = ['src/assets/logo.svg', 'src/assets/logo-dark.svg', 'src/assets/favicon.svg'];
const render = async (source, size) => sharp(Buffer.from(readFileSync(join(ROOT, source), 'utf8')), { density: Math.max(384, size * 3) })
  .resize(size, size)
  .png()
  .toBuffer();

const lightLogo = await render('src/assets/logo.svg', 128);
const darkLogo = await render('src/assets/logo-dark.svg', 128);
const favicon = (await Promise.all([16, 32, 48].map((size) => render('src/assets/favicon.svg', size))))
  .map((image, index) => ({ size: [16, 32, 48][index], image }));

function ico(images) {
  const directory = Buffer.alloc(6 + images.length * 16);
  directory.writeUInt16LE(0, 0);
  directory.writeUInt16LE(1, 2);
  directory.writeUInt16LE(images.length, 4);
  let offset = directory.length;
  for (const [index, { size, image }] of images.entries()) {
    const entry = 6 + index * 16;
    directory.writeUInt8(size, entry);
    directory.writeUInt8(size, entry + 1);
    directory.writeUInt8(0, entry + 2);
    directory.writeUInt8(0, entry + 3);
    directory.writeUInt16LE(1, entry + 4);
    directory.writeUInt16LE(32, entry + 6);
    directory.writeUInt32LE(image.length, entry + 8);
    directory.writeUInt32LE(offset, entry + 12);
    offset += image.length;
  }
  return Buffer.concat([directory, ...images.map(({ image }) => image)]);
}

writeFileSync(join(ROOT, 'public/logo.png'), lightLogo);
writeFileSync(join(ROOT, 'public/logo-dark.png'), darkLogo);
writeFileSync(join(ROOT, 'public/favicon.ico'), ico(favicon));
writeFileSync(join(ROOT, 'public/apple-touch-icon.png'), await render('src/assets/favicon.svg', 180));
writeFileSync(join(ROOT, 'src/assets/logos.json'), `${JSON.stringify(Object.fromEntries(
  logoSources.map((source) => [source, sha256(readFileSync(join(ROOT, source), 'utf8'))]),
), null, 2)}\n`);
