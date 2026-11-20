// Turns a page's source into plain Markdown for agents.
// @spec SITE-MD-PAGE-001, SITE-MD-PAGE-002, SITE-MD-PAGE-003, SITE-MD-PAGE-004
import { short, repo, statusOf } from './upstream';

export function toMarkdown(entry: { id: string; body?: string; data: any }): string {
  const d = entry.data;
  const fm = [
    '---',
    `title: ${JSON.stringify(d.title)}`,
    d.description ? `description: ${JSON.stringify(d.description)}` : null,
    `url: ${urlOf(entry.id)}`,
    d.engine?.length ? `engine: [${d.engine.join(', ')}]` : null,
    `status: ${d.status}`,
    d.legacy ? 'applies_to: IndexTables 0.5.x' : null,
    `page_class: ${d.lid.class}`,
    d.lid.cites.length ? `cites: [${d.lid.cites.join(', ')}]` : null,
    `upstream: ${repo}@${d.lid.reviewed ?? short}`,
    '---',
  ].filter(Boolean).join('\n');
  return `${fm}\n\n# ${d.title}\n\n${body(entry.body ?? '')}\n`;
}

export const urlOf = (id: string) => (id === 'index' || id === '' ? '/' : `/${id}/`);

export function body(src: string): string {
  let out = '';
  let fence = false;
  for (const line of src.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) { fence = !fence; out += line + '\n'; continue; }
    if (fence) { out += line + '\n'; continue; }
    if (/^import .* from ['"].*['"];?\s*$/.test(line)) continue;
    let l = line
      .replace(/<TabItem[^>]*label="([^"]*)"[^>]*>/g, '**$1**\n')
      .replace(/<Spec id="([^"]*)"\s*\/>/g, (_, id) => `[spec ${id}: ${statusOf(id)}]`)
      .replace(/<mark>(.*?)<\/mark>/g, '$1')
      .replace(/<a [^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/g, '[$2]($1)')
      .replace(/<\/?(Tabs|TabItem|Steps|Card|CardGrid|LinkCard|Aside|div|span|b|section|p|iframe|button|Talk|Hero|Fragment)\b[^>]*>/g, '')
      .replace(/\{\/\*.*?\*\/\}/g, '');
    out += l + '\n';
  }
  return out.replace(/\n{3,}/g, '\n\n').trim();
}
