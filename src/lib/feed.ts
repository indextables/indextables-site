// @spec SITE-CONT-FEED-001
import { getCollection } from 'astro:content';

export const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export const TITLE = 'IndexTables Blog';

// Entry ids are the post addresses of the 0.5.x site (no trailing slash), so feed readers do not show old posts as new.
export async function posts(site: URL) {
  return (await getCollection('docs'))
    .filter((d) => d.id.startsWith('blog/') && d.data.date)
    .sort((a, b) => +b.data.date! - +a.data.date!)
    .map((d) => ({
      id: new URL(`/${d.id}`, site).href,
      link: new URL(`/${d.id}/`, site).href,
      title: d.data.title,
      summary: d.data.description ?? '',
      date: d.data.date!,
      authors: d.data.authors,
      tags: d.data.tags,
    }));
}
