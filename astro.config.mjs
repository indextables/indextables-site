import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import { readFileSync } from 'node:fs';
import YAML from 'yaml';

// @spec SITE-CONT-REDIR-001
const redirects = Object.fromEntries(
  Object.entries(YAML.parse(readFileSync(new URL('./data/redirects.yaml', import.meta.url), 'utf8'))).map(([from, to]) => [from + '/', to]),
);

const dir = (label, directory, collapsed = true) => ({ label, collapsed, items: [{ autogenerate: { directory } }] });

export default defineConfig({
  site: 'https://www.indextables.io',
  trailingSlash: 'always',
  redirects,
  vite: { resolve: { alias: { '@c': new URL('./src/components', import.meta.url).pathname } } },
  integrations: [
    starlight({
      title: 'IndexTables',
      description: 'Fast search and retrieval on lakehouse tables, inside your query engine.',
      logo: { light: './src/assets/logo.svg', dark: './src/assets/logo-dark.svg', alt: '' },
      favicon: '/favicon.svg',
      // @spec SITE-UI-FONT-001
      customCss: ['@fontsource-variable/fraunces/opsz.css', '@fontsource-variable/inter/wght.css', '@fontsource-variable/jetbrains-mono/wght.css', './src/styles/theme.css'],
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/indextables/indextables' }],
      components: {
        SiteTitle: './src/components/SiteTitle.astro',
        PageTitle: './src/components/PageTitle.astro',
        Footer: './src/components/Footer.astro',
      },
      head: [
        { tag: 'link', attrs: { rel: 'alternate', type: 'text/plain', href: '/llms.txt', title: 'llms.txt' } },
        { tag: 'link', attrs: { rel: 'alternate', type: 'application/rss+xml', href: '/blog/rss.xml', title: 'IndexTables Blog (RSS)' } },
        { tag: 'link', attrs: { rel: 'alternate', type: 'application/atom+xml', href: '/blog/atom.xml', title: 'IndexTables Blog (Atom)' } },
      ],
      sidebar: [
        dir('Why IndexTables', 'why'),
        dir('Learn', 'learn'),
        dir('Get started', 'start', false),
        {
          label: 'Guides',
          items: [
            dir('Tables', 'guides/tables'),
            dir('Query', 'guides/query'),
            dir('Companions', 'guides/companions'),
            dir('Catalogs', 'guides/catalogs'),
            dir('Storage and credentials', 'guides/storage'),
            dir('Maintenance', 'guides/maintenance'),
            dir('Operations', 'guides/operations'),
            dir('DataFusion', 'guides/datafusion'),
            dir('Migrate from 0.5.x', 'guides/migrate'),
          ],
        },
        dir('Concepts', 'concepts'),
        dir('Reference', 'reference'),
        dir('Blog', 'blog'),
      ],
    }),
  ],
});
