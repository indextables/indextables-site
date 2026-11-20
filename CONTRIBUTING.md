# Contributing

This repository is the IndexTables website and documentation. The product lives in [indextables/indextables](https://github.com/indextables/indextables); report product bugs there.

## Before you change anything

Read `AGENTS.md`. The site is managed with Linked-Intent Development: a change starts in the design (`docs/high-level-design.md`, `docs/intent/`), then the requirements beside it, then checks and tests, then content or code.

- **A documentation page** states only what the product's requirements say. Cite the requirement groups the page rests on in its frontmatter (`lid.cites`), then run `npm run check -- --stamp`.
- **A generated page** (configuration, availability, specifications) is never edited by hand. Change the generator or its input in `data/`, and regenerate.
- **A 0.5.x page** (the blog posts and everything under `/0.5/`) is a historical record and is not rewritten.

## Checks

```bash
npm ci
npm run check
npm run build
npm run check -- --dist
npm test
```

All four must pass. Open a pull request against `main`; the site is published from `main` only.

## Licence

Contributions are accepted under the Apache License 2.0, the licence of this repository.
