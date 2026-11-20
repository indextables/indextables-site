import snapshot from '../../upstream/snapshot/specs.json';
import { readFileSync } from 'node:fs';

const specs = (snapshot as any).specs as Record<string, { m: string; h: string; f: string }>;
export const commit: string = (snapshot as any).commit;
export const short = commit.slice(0, 7);
export const repo = 'https://github.com/indextables/indextables';

export function resolve(cite: string): string[] {
  if (specs[cite]) return [cite];
  return Object.keys(specs).filter((id) => id.startsWith(cite + '-'));
}
export function statusOf(cite: string): 'implemented' | 'gap' | 'deferred' | 'unknown' {
  const ids = resolve(cite);
  if (!ids.length) return 'unknown';
  if (ids.some((id) => specs[id].m === 'gap')) return 'gap';
  if (ids.every((id) => specs[id].m === 'deferred')) return 'deferred';
  return 'implemented';
}
export function hrefOf(cite: string): string {
  const ids = resolve(cite);
  return ids.length ? `${repo}/blob/${commit}/${specs[ids[0]].f}` : repo;
}
export const ENGINE = { spark: 'Spark', datafusion: 'DataFusion' } as const;
