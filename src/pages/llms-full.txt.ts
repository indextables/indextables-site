// @spec SITE-MD-INDEX-003
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { toMarkdown } from '../lib/markdown';

export const GET: APIRoute = async () => {
  const docs = (await getCollection('docs'))
    .filter((d) => d.id !== 'blog' && !d.id.startsWith('blog/') && !d.data.legacy && d.id !== 'index' && d.id !== '')
    .sort((a, b) => a.id.localeCompare(b.id));
  return new Response(docs.map((d) => toMarkdown(d as any)).join('\n\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
