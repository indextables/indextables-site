import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const dist = new URL('../dist/', import.meta.url);
const built = existsSync(dist);

// @spec SITE-UI-NAV-002
test('the home page has the menu button and the full site navigation', { skip: !built && 'run the build first' }, () => {
  for (const page of ['index.html', 'start/spark/index.html']) {
    const html = readFileSync(new URL(page, dist), 'utf8');
    assert.ok(html.includes('popovertarget="starlight__sidebar"'), `${page}: menu button`);
    const pane = html.slice(html.indexOf('id="starlight__sidebar"'));
    assert.ok(html.includes('id="starlight__sidebar"'), `${page}: menu pane`);
    for (const href of ['/start/datafusion/', '/guides/catalogs/tables-by-name/', '/reference/configuration/']) assert.ok(pane.includes(`href="${href}"`), `${page}: ${href}`);
  }
});
