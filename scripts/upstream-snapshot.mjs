#!/usr/bin/env node
// Writes upstream/snapshot/specs.json from an upstream checkout.
//   node scripts/upstream-snapshot.mjs <upstream-dir>            verify the checkout is at the pinned commit, write the snapshot
//   node scripts/upstream-snapshot.mjs <upstream-dir> --repin    move the pin to the checkout's HEAD
//   node scripts/upstream-snapshot.mjs <upstream-dir> --drift    report pages affected by moving to the checkout's HEAD; write nothing
import { execFileSync } from 'node:child_process';
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { buildSnapshot, readLock, readSnapshot, drift, pages, LOCK, SNAPSHOT } from './lib.mjs';

const [dir, flag] = process.argv.slice(2);
if (!dir) { console.error('usage: upstream-snapshot.mjs <upstream-dir> [--repin|--drift]'); process.exit(2); }
const git = (...a) => execFileSync('git', ['-C', dir, ...a], { encoding: 'utf8' }).trim();
const head = git('rev-parse', 'HEAD');
const lock = readLock();
const snap = buildSnapshot(dir);

if (flag === '--drift') {
  const d = drift(readSnapshot(), snap, pages());
  console.log(`# Upstream drift: ${lock.commit.slice(0, 7)} → ${head.slice(0, 7)}\n`);
  console.log(`${d.changed} specs changed, ${d.added} added, ${d.removed} removed. ${d.affected.length} pages affected.\n`);
  for (const a of d.affected) console.log(`- \`${a.page}\` (${a.class}): ${[...new Set(a.reasons)].slice(0, 12).join(', ')}${a.reasons.length > 12 ? ', …' : ''}`);
  process.exit(0);
}
// @spec SITE-LINK-LOCK-002
if (flag !== '--repin' && head !== lock.commit) {
  console.error(`upstream checkout is at ${head}, the lock pins ${lock.commit}; pass --repin to move the pin`);
  process.exit(1);
}
if (flag === '--repin') {
  const text = readFileSync(LOCK, 'utf8')
    .replace(/commit: .*/, `commit: ${head}`)
    .replace(/pinned_at: .*/, `pinned_at: ${git('log', '-1', '--format=%cs')}`);
  writeFileSync(LOCK, text);
}
mkdirSync(dirname(SNAPSHOT), { recursive: true });
writeFileSync(SNAPSHOT, JSON.stringify({ commit: head, ...snap }, null, 0).replace(/("[A-Z0-9-]+":\{)/g, '\n$1') + '\n');
console.log(`snapshot: ${Object.keys(snap.specs).length} specs, ${Object.keys(snap.sections).length} design sections at ${head.slice(0, 7)}`);
