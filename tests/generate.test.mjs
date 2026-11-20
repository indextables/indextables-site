import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// The parser is exercised on a registry excerpt in the upstream form.
const SRC = `
  private val read: Seq[KeySpec] = Seq(
    k("read.mode", Enum(Seq("fast", "exact", "complete")), Some("fast")),
    k("read.defaultLimit", Int, Some("250"), min = One),
    k("s3.pathStyleAccess", Bool, Some("false"), aliases = Seq("aws.pathStyleAccess", "aws.forcePathStyle")),
    k("read.search.maxConcurrent", Int, min = One, processScoped = true),
    k("merge.skipSplitThreshold", Double, Some("0.45"), min = Zero, max = One).copy(minExclusive = true),
    fam("acceleration.column.", Policy)) ++
    Seq("region", "endpoint").map(n => k(s"companion.parquet.aws.$n", Str))
  private val noOps: Seq[KeySpec] =
    noop("indexing.json.mode", "bloom.filters.enabled")
  private val CredentialReason = Some("x")
`;

// @spec SITE-GEN-CFG-001, SITE-GEN-CFG-003
test('registry parse extracts name, type, default, aliases, range and scope', async () => {
  const text = readFileSync(new URL('../scripts/generate.mjs', import.meta.url), 'utf8');
  const fn = text.slice(text.indexOf('export function parseRegistry'), text.indexOf('const UNITS'));
  const groups = text.slice(text.indexOf('const GROUPS = {'), text.indexOf('export function parseRegistry'));
  const { parseRegistry } = await import('data:text/javascript,' + encodeURIComponent(groups + fn));
  const { keys, noops } = parseRegistry(SRC);
  const by = Object.fromEntries(keys.map((k) => [k.name, k]));
  assert.equal(by['read.mode'].default, 'fast');
  assert.match(by['read.mode'].type, /fast.*exact.*complete/);
  assert.equal(by['read.defaultLimit'].min, '1');
  assert.deepEqual(by['s3.pathStyleAccess'].aliases, ['aws.pathStyleAccess', 'aws.forcePathStyle']);
  assert.equal(by['read.search.maxConcurrent'].process, true);
  assert.equal(by['read.search.maxConcurrent'].default, null);
  assert.equal(by['merge.skipSplitThreshold'].exclusive, true);
  assert.equal(by['merge.skipSplitThreshold'].max, '1');
  assert.equal(by['acceleration.column.'].family, true);
  assert.ok(by['companion.parquet.aws.<name>']);
  assert.deepEqual(noops, ['indexing.json.mode', 'bloom.filters.enabled']);
});

// @spec SITE-GEN-RUN-002, SITE-CONT-CLASS-002
test('committed generated pages carry the generator comment and the pinned commit', () => {
  const lock = readFileSync(new URL('../upstream/lock.yaml', import.meta.url), 'utf8').match(/commit: (\w+)/)[1];
  for (const p of ['configuration', 'availability', 'specifications']) {
    const t = readFileSync(new URL(`../src/content/docs/reference/${p}.mdx`, import.meta.url), 'utf8');
    assert.match(t, /class: generated/);
    assert.ok(t.includes(`@${lock.slice(0, 7)}. Do not edit.`), p);
  }
});
