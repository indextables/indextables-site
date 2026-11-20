import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const dist = new URL('../dist/', import.meta.url);
const built = existsSync(dist);

// @spec SITE-MD-PAGE-002, SITE-MD-PAGE-003, SITE-MD-PAGE-004
test('page Markdown has frontmatter, every tab and no component tags', { skip: !built && 'run the build first' }, () => {
  const t = readFileSync(new URL('start/spark.md', dist), 'utf8');
  assert.match(t, /^---\ntitle: "Get started with Spark"/);
  assert.match(t, /\nstatus: available\n/); assert.match(t, /\npage_class: derived\n/);
  assert.match(t, /\ncites: \[.*SPARK-RD-IQ.*\]\n/); assert.match(t, /\nupstream: https:\/\/github.com\/indextables\/indextables@[0-9a-f]{7}\n/);
  for (const tab of ['**PySpark**', '**Scala**', '**Spark SQL**']) assert.ok(t.includes(tab), tab);
  assert.ok(!/^import /m.test(t));
  assert.ok(!/<\/?(Tabs|TabItem|Steps)\b/.test(t));
  assert.ok(t.includes('.option("spark.indextables.indexing.typemap.title", "text")'));
});

// @spec SITE-MD-PAGE-005, SITE-MD-INDEX-001, SITE-MD-INDEX-002, SITE-MD-INDEX-003
test('legacy posts are labelled and the indexes are complete', { skip: !built && 'run the build first' }, () => {
  assert.match(readFileSync(new URL('blog/welcome.md', dist), 'utf8'), /applies_to: IndexTables 0\.5\.x/);
  const idx = readFileSync(new URL('llms.txt', dist), 'utf8');
  assert.match(idx, /## Blog \(written for 0\.5\.x\)/);
  assert.match(idx, /\/guides\/catalogs\/tables-by-name\.md\)/);
  const full = readFileSync(new URL('llms-full.txt', dist), 'utf8');
  assert.ok(full.includes('# Use tables by name'));
  assert.ok(!full.includes('Your Fast Search Data Should Be Yours'));
});

// @spec SITE-UI-TALK-001, SITE-MD-LINK-001, SITE-CONT-LEGACY-001, SITE-CONT-REDIR-001
test('built HTML: no eager YouTube embed, Markdown link, legacy notice, redirects', { skip: !built && 'run the build first' }, () => {
  const home = readFileSync(new URL('index.html', dist), 'utf8');
  assert.ok(!/<iframe[^>]*youtube/.test(home));
  assert.ok(home.includes('youtube-nocookie.com'));
  assert.ok(readFileSync(new URL('start/spark/index.html', dist), 'utf8').includes('href="/start/spark.md"'));
  assert.ok(readFileSync(new URL('blog/welcome/index.html', dist), 'utf8').includes('written for IndexTables 0.5.x'));
  assert.ok(readFileSync(new URL('docs/intro/index.html', dist), 'utf8').includes('/learn/what-is-indextables/'));
});
