// @spec SITE-CONT-FEED-001
import type { APIRoute } from 'astro';
import { posts, esc, TITLE } from '../../lib/feed';

export const GET: APIRoute = async ({ site }) => {
  const items = await posts(site!);
  const home = new URL('/blog/', site).href;
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/">
<channel>
<title>${TITLE}</title>
<link>${home}</link>
<description>${TITLE}</description>
<language>en</language>
${items.length ? `<lastBuildDate>${items[0].date.toUTCString()}</lastBuildDate>\n` : ''}${items.map((p) => `<item>
<title>${esc(p.title)}</title>
<link>${p.link}</link>
<guid isPermaLink="false">${p.id}</guid>
<pubDate>${p.date.toUTCString()}</pubDate>
<description>${esc(p.summary)}</description>
${p.authors.map((a) => `<dc:creator>${esc(a)}</dc:creator>`).join('\n')}
${p.tags.map((t) => `<category>${esc(t)}</category>`).join('\n')}
</item>`).join('\n')}
</channel>
</rss>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
