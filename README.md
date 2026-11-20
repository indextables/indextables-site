# indextables-site

The website and documentation for [IndexTables](https://github.com/indextables/indextables): Astro + Starlight, managed with Linked-Intent Development and linked to the product's requirements at a pinned commit.

```bash
npm ci
npm run dev        # local preview
npm run build      # static site in dist/, with a .md for every page, llms.txt and llms-full.txt
npm run check      # citations, fingerprints, links, redirects, generated pages unedited; add `-- --dist` after a build for Markdown parity
npm test
```

Node 22.23 or later.

## Moving to a newer product commit

```bash
git -C ../indextables pull
node scripts/upstream-snapshot.mjs ../indextables --drift    # which pages are affected; writes nothing
node scripts/upstream-snapshot.mjs ../indextables --repin    # move the pin and rewrite the snapshot
node scripts/generate.mjs ../indextables                     # regenerate configuration, availability, specifications
npm run check                                                # lists derived pages whose cited requirements changed
# review and redraft those pages, then:
npm run check -- --stamp
```

Start with `AGENTS.md` and `docs/high-level-design.md`.

## Licence

Apache License 2.0; see `LICENSE`. The blog posts and the `/0.5/` archive come from the Apache-2.0 `indextables_web` repository. See `CONTRIBUTING.md` and `SECURITY.md`.
