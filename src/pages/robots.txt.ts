// @spec SITE-CONT-LAUNCH-001
import type { APIRoute } from 'astro';
import { readFileSync } from 'node:fs';
import YAML from 'yaml';

export const launched: boolean = YAML.parse(readFileSync('data/launch.yaml', 'utf8')).launched === true;

export const GET: APIRoute = ({ site }) =>
  new Response(
    launched ? `User-agent: *\nAllow: /\nSitemap: ${new URL('/sitemap-index.xml', site).href}\n` : 'User-agent: *\nDisallow: /\n',
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
