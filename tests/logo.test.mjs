import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as lib from '../scripts/lib.mjs';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const built = existsSync(join(dist, 'index.html'));

function filesUnder(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? filesUnder(path) : [path];
  });
}

// @spec SITE-UI-LOGO-002
test('built site contains no SVG files', { skip: !built && 'run the build first' }, () => {
  assert.deepEqual(filesUnder(dist).filter((path) => path.endsWith('.svg')), []);
});

// @spec SITE-UI-LOGO-002
test('built home page uses the raster favicon and theme logos', { skip: !built && 'run the build first' }, () => {
  const html = readFileSync(join(dist, 'index.html'), 'utf8');
  assert.match(html, /<link\b(?=[^>]*\brel=["'](?:shortcut )?icon["'])(?=[^>]*\bhref=["']\/favicon\.ico["'])[^>]*>/i);
  assert.match(html, /<img\b(?=[^>]*\bsrc=["']\/logo\.png["'])[^>]*>/i);
  assert.match(html, /<img\b(?=[^>]*\bsrc=["']\/logo-dark\.png["'])[^>]*>/i);
});

// @spec SITE-UI-LOGO-002
test('built favicon is an ICO container with three images', { skip: !built && 'run the build first' }, () => {
  const path = join(dist, 'favicon.ico');
  assert.ok(existsSync(path), 'dist/favicon.ico is missing');
  const icon = readFileSync(path);
  assert.deepEqual(icon.subarray(0, 4), Buffer.from([0x00, 0x00, 0x01, 0x00]));
  assert.equal(icon.readUInt16LE(4), 3);
});

// @spec SITE-UI-LOGO-003
test('staleLogos returns only sources whose content hash changed', () => {
  const sources = {
    'src/assets/logo.svg': '<svg>same</svg>',
    'src/assets/logo-dark.svg': '<svg>changed</svg>',
  };
  const record = {
    'src/assets/logo.svg': lib.sha256(sources['src/assets/logo.svg']),
    'src/assets/logo-dark.svg': lib.sha256('<svg>before</svg>'),
  };
  assert.deepEqual(lib.staleLogos(record, (source) => sources[source]), ['src/assets/logo-dark.svg']);
});
