// @spec SITE-CONT-FEED-001
import type { APIRoute } from 'astro';
import { posts, esc, TITLE } from '../../lib/feed';

export const GET: APIRoute = async ({ site }) => {
  const items = await posts(site!);
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
<id>${new URL('/blog', site).href}</id>
<title>${TITLE}</title>
<updated>${(items[0]?.date ?? new Date(0)).toISOString()}</updated>
<link rel="alternate" href="${new URL('/blog/', site).href}"/>
<link rel="self" href="${new URL('/blog/atom.xml', site).href}"/>
${items.map((p) => `<entry>
<title>${esc(p.title)}</title>
<id>${p.id}</id>
<link href="${p.link}"/>
<updated>${p.date.toISOString()}</updated>
<summary>${esc(p.summary)}</summary>
${p.authors.map((a) => `<author><name>${esc(a)}</name></author>`).join('\n')}
${p.tags.map((t) => `<category term="${esc(t)}"/>`).join('\n')}
</entry>`).join('\n')}
</feed>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/atom+xml; charset=utf-8' } });
};
