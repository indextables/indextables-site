// @spec SITE-MD-INDEX-001, SITE-MD-INDEX-002
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { short } from '../lib/upstream';

const GROUPS: [string, string][] = [
  ['start/', 'Get started'], ['learn/', 'Learn'], ['why/', 'Why IndexTables'], ['guides/', 'Guides'],
  ['concepts/', 'Concepts'], ['reference/', 'Reference'], ['blog/', 'Blog (written for 0.5.x)'],
];
export const GET: APIRoute = async ({ site }) => {
  const docs = (await getCollection('docs')).sort((a, b) => a.id.localeCompare(b.id));
  const abs = (id: string) => new URL(`/${id === '' ? 'index' : id}.md`, site).href;
  let out = `# IndexTables\n\n> Fast search and retrieval on lakehouse tables, inside Apache Spark and Apache DataFusion. Full-text search, exact match, range lookups and aggregates are answered from an index in object storage. A table is either standalone (IndexTables stores data and index) or a companion (an index over an existing Delta, Iceberg or Parquet table).\n\nEvery page is Markdown at its address plus \`.md\`. Statements cite requirement IDs of github.com/indextables/indextables at commit ${short}. The whole documentation in one file: ${new URL('/llms-full.txt', site).href}\n`;
  for (const [prefix, label] of GROUPS) {
    const items = docs.filter((d) => d.id.startsWith(prefix));
    if (!items.length) continue;
    out += `\n## ${label}\n\n`;
    for (const d of items) out += `- [${d.data.title}](${abs(d.id)})${d.data.description ? `: ${d.data.description}` : ''}\n`;
  }
  return new Response(out, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
