import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildSnapshot, resolveCitation, fingerprint, drift, status, splitFrontmatter } from '../scripts/lib.mjs';

function upstream(specs, design = '# D\n\n## Reads\n\nbody\n') {
  const d = mkdtempSync(join(tmpdir(), 'up-'));
  mkdirSync(join(d, 'docs/intent/spark/read'), { recursive: true });
  writeFileSync(join(d, 'docs/intent/spark/read/read-specs.md'), specs);
  writeFileSync(join(d, 'docs/intent/spark/read/read-design.md'), design);
  return d;
}
const SPECS = `# Specs
- [x] **SPARK-RD-IQ-001**: The binding shall push IndexQuery.
- [ ] **SPARK-RD-IQ-002**: The binding shall validate fields.
- [D] **SPARK-RD-IQV-001**: Deferred thing.
`;

// @spec SITE-LINK-SNAP-001, SITE-LINK-SNAP-003
test('snapshot records marker, hash, file and design sections', () => {
  const s = buildSnapshot(upstream(SPECS));
  assert.equal(s.specs['SPARK-RD-IQ-001'].m, 'implemented');
  assert.equal(s.specs['SPARK-RD-IQ-002'].m, 'gap');
  assert.equal(s.specs['SPARK-RD-IQV-001'].m, 'deferred');
  assert.match(s.specs['SPARK-RD-IQ-001'].h, /^[0-9a-f]{12}$/);
  assert.equal(s.specs['SPARK-RD-IQ-001'].f, 'docs/intent/spark/read/read-specs.md');
  assert.ok(s.sections['spark/read/read-design.md#Reads']);
});

// @spec SITE-LINK-SNAP-002
test('duplicate upstream IDs fail', () => {
  assert.throws(() => buildSnapshot(upstream(SPECS + '- [x] **SPARK-RD-IQ-001**: Again.\n')), /duplicate/);
});

// @spec SITE-LINK-CITE-001, SITE-LINK-CITE-002
test('citations resolve by ID or hyphen-bounded prefix', () => {
  const { specs } = buildSnapshot(upstream(SPECS));
  assert.deepEqual(resolveCitation('SPARK-RD-IQ-001', specs), ['SPARK-RD-IQ-001']);
  assert.deepEqual(resolveCitation('SPARK-RD-IQ', specs), ['SPARK-RD-IQ-001', 'SPARK-RD-IQ-002']);
  assert.deepEqual(resolveCitation('SPARK-RD-I', specs), []);
  assert.equal(status('SPARK-RD-IQ', specs), 'gap');
  assert.equal(status('SPARK-RD-IQV', specs), 'deferred');
  assert.equal(status('SPARK-RD-IQ-001', specs), 'implemented');
});

// @spec SITE-LINK-FP-001
test('fingerprint changes with text, marker, membership and cited section', () => {
  const a = buildSnapshot(upstream(SPECS));
  const lid = { cites: ['SPARK-RD-IQ'], docs: ['spark/read/read-design.md#Reads'] };
  const base = fingerprint(lid, a);
  assert.equal(base, fingerprint(lid, buildSnapshot(upstream(SPECS))));
  assert.notEqual(base, fingerprint(lid, buildSnapshot(upstream(SPECS.replace('push IndexQuery', 'push every IndexQuery')))));
  assert.notEqual(base, fingerprint(lid, buildSnapshot(upstream(SPECS.replace('[ ] **SPARK-RD-IQ-002', '[x] **SPARK-RD-IQ-002')))));
  assert.notEqual(base, fingerprint(lid, buildSnapshot(upstream(SPECS + '- [x] **SPARK-RD-IQ-003**: New.\n'))));
  assert.notEqual(base, fingerprint(lid, buildSnapshot(upstream(SPECS, '# D\n\n## Reads\n\nchanged\n'))));
  assert.equal(base, fingerprint(lid, buildSnapshot(upstream(SPECS.replace('Deferred thing', 'Other')))));
});

// @spec SITE-LINK-DRIFT-001, SITE-LINK-DRIFT-002
test('drift lists only pages whose citations are touched', () => {
  const a = buildSnapshot(upstream(SPECS));
  const b = buildSnapshot(upstream(SPECS.replace('validate fields', 'validate all fields') + '- [x] **SPARK-RD-IQV-002**: New.\n'));
  const pg = (rel, cites) => ({ rel, data: { lid: { class: 'derived', cites } } });
  const d = drift(a, b, [pg('iq.md', ['SPARK-RD-IQ']), pg('one.md', ['SPARK-RD-IQ-001']), pg('iqv.md', ['SPARK-RD-IQV'])]);
  assert.equal(d.changed, 1); assert.equal(d.added, 1); assert.equal(d.removed, 0);
  assert.deepEqual(d.affected.map((x) => x.page), ['iq.md', 'iqv.md']);
  assert.deepEqual(d.affected[0].reasons, ['changed SPARK-RD-IQ-002']);
  assert.deepEqual(d.affected[1].reasons, ['added SPARK-RD-IQV-002']);
});

test('frontmatter splits', () => {
  const r = splitFrontmatter('---\ntitle: A\nlid:\n  class: derived\n---\nbody\n');
  assert.equal(r.data.lid.class, 'derived'); assert.equal(r.body, 'body\n');
});
