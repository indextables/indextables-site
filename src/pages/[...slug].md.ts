// @spec SITE-MD-PAGE-001
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { toMarkdown } from '../lib/markdown';

export async function getStaticPaths() {
  const docs = await getCollection('docs');
  return docs.map((entry) => ({ params: { slug: entry.id === '' ? 'index' : entry.id }, props: { entry } }));
}
export const GET: APIRoute = ({ props }) =>
  new Response(toMarkdown(props.entry as any), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
