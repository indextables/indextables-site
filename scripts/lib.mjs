// Shared logic for the upstream link: snapshot, citation resolution, fingerprints, drift.
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import YAML from 'yaml';

export const ROOT = new URL('..', import.meta.url).pathname;
export const LOCK = join(ROOT, 'upstream/lock.yaml');
export const SNAPSHOT = join(ROOT, 'upstream/snapshot/specs.json');
export const DOCS = join(ROOT, 'src/content/docs');
const MARK = { x: 'implemented', ' ': 'gap', D: 'deferred' };
const sha = (s, n = 12) => createHash('sha256').update(s).digest('hex').slice(0, n);

export function walk(dir, test, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, test, out);
    else if (test(p)) out.push(p);
  }
  return out.sort();
}

// @spec SITE-LINK-SNAP-001, SITE-LINK-SNAP-002, SITE-LINK-SNAP-003
export function buildSnapshot(upstreamDir) {
  const intent = join(upstreamDir, 'docs/intent');
  const specs = {};
  for (const f of walk(intent, (p) => p.endsWith('-specs.md'))) {
    const rel = relative(upstreamDir, f);
    for (const m of readFileSync(f, 'utf8').matchAll(/^- \[(x| |D)\] \*\*([A-Z0-9-]+)\*\*: (.*)$/gm)) {
      if (specs[m[2]]) throw new Error(`duplicate upstream spec ID ${m[2]}`);
      specs[m[2]] = { m: MARK[m[1]], h: sha(m[3].trim()), f: rel };
    }
  }
  const sections = {};
  const designs = walk(intent, (p) => p.endsWith('-design.md'));
  designs.push(join(upstreamDir, 'docs/high-level-design.md'));
  for (const f of designs) {
    if (!existsSync(f)) continue;
    const rel = relative(join(upstreamDir, 'docs'), f).replace(/^intent\//, '');
    const parts = readFileSync(f, 'utf8').split(/^(?=##+ )/m);
    for (const part of parts) {
      const h = part.match(/^##+ (.*)$/m);
      if (h) sections[`${rel}#${h[1].trim()}`] = sha(part);
    }
  }
  return { specs, sections };
}

export const readLock = () => YAML.parse(readFileSync(LOCK, 'utf8')).upstream;
export const readSnapshot = () => JSON.parse(readFileSync(SNAPSHOT, 'utf8'));

// A citation is a full spec ID or a prefix that ends at a hyphen boundary.
// @spec SITE-LINK-CITE-001, SITE-LINK-CITE-002
export function resolveCitation(cite, specs) {
  if (specs[cite]) return [cite];
  const p = cite + '-';
  return Object.keys(specs).filter((id) => id.startsWith(p)).sort();
}

// @spec SITE-LINK-FP-001
export function fingerprint(lid, snap) {
  const lines = [];
  for (const c of [...(lid.cites ?? [])].sort()) {
    for (const id of resolveCitation(c, snap.specs)) lines.push(`${id} ${snap.specs[id].m} ${snap.specs[id].h}`);
  }
  for (const d of [...(lid.docs ?? [])].sort()) lines.push(`${d} ${snap.sections[d] ?? 'missing'}`);
  return sha(lines.join('\n'));
}

export function splitFrontmatter(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) return { data: {}, body: text, raw: '' };
  return { data: YAML.parse(m[1]) ?? {}, body: text.slice(m[0].length), raw: m[1] };
}

export function pages() {
  return walk(DOCS, (p) => /\.mdx?$/.test(p)).map((file) => {
    const text = readFileSync(file, 'utf8');
    return { file, rel: relative(ROOT, file), text, ...splitFrontmatter(text) };
  });
}

export function status(cite, specs) {
  const ids = resolveCitation(cite, specs);
  if (!ids.length) return 'unknown';
  if (ids.some((id) => specs[id].m === 'gap')) return 'gap';
  if (ids.every((id) => specs[id].m === 'deferred')) return 'deferred';
  return 'implemented';
}

// @spec SITE-LINK-DRIFT-001, SITE-LINK-DRIFT-002, SITE-LINK-DRIFT-003
export function drift(oldSnap, newSnap, pageList) {
  const changed = new Set(), removed = new Set(), added = new Set();
  for (const [id, s] of Object.entries(oldSnap.specs)) {
    const n = newSnap.specs[id];
    if (!n) removed.add(id);
    else if (n.h !== s.h || n.m !== s.m) changed.add(id);
  }
  for (const id of Object.keys(newSnap.specs)) if (!oldSnap.specs[id]) added.add(id);
  const affected = [];
  for (const p of pageList) {
    const lid = p.data.lid;
    if (!lid) continue;
    const reasons = [];
    for (const c of lid.cites ?? []) {
      const before = new Set(resolveCitation(c, oldSnap.specs));
      const after = resolveCitation(c, newSnap.specs);
      for (const id of before) {
        if (removed.has(id)) reasons.push(`removed ${id}`);
        else if (changed.has(id)) reasons.push(`changed ${id}`);
      }
      for (const id of after) if (!before.has(id)) reasons.push(`added ${id}`);
    }
    for (const d of lid.docs ?? []) if (oldSnap.sections[d] !== newSnap.sections[d]) reasons.push(`design section ${d}`);
    if (reasons.length) affected.push({ page: p.rel, class: lid.class, reasons });
  }
  return { changed: changed.size, removed: removed.size, added: added.size, affected };
}
