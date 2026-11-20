# IndexTables Site

The website and documentation for IndexTables, published at www.indextables.io from `main` only. The product lives in [`indextables/indextables`](https://github.com/indextables/indextables) and is built with Linked-Intent Development (LID). This site is built the same way, and its pages cite the product's requirement IDs at one pinned commit.

## LID
- Mode: Full
- Version: 1.4.0 (the version the product repository records; the two move together)

## LID Tooling
- `npm run check` (`scripts/site-check.mjs`): fails on a `@spec` citation in `scripts/`, `src/` or `tests/` that resolves to no ID in `docs/intent/**/*-specs.md`; on a page citation that resolves to no upstream requirement in `upstream/snapshot/specs.json`; on a page whose stored fingerprint differs from the snapshot; and, after a build, on a page with no Markdown output or whose Markdown lacks a citation. Runs in CI.
- `npm test`: unit tests of the link, generator and Markdown logic.
- `node scripts/upstream-snapshot.mjs <upstream-dir> [--drift|--repin]` and `node scripts/generate.mjs <upstream-dir>`: see `docs/intent/upstream-link/` and `docs/intent/generators/`.

## Linked-Intent Development (MANDATORY)

All changes flow through the arrow of intent in one direction:

```
HLD → LLDs → EARS → Tests → Code
```

- **All changes**: consult the `linked-intent-dev` skill if your harness provides it; otherwise read `docs/lid/workflow.md` before making changes.
- **Bug fixes**: walk the arrow like any other change. Find where behavior diverged from intent and cascade from there.

Each phase's output is inspected, by the user or an inspector they name, before the next begins; ambiguous spec readings go back to the user. **Docs carry current intent, written to be read cold**: no narration of how they changed.

**Memory vs. intent.** Durable knowledge a fresh agent needs to build this site correctly belongs in the arrow, not in private agent memory.

### Two arrows

This repository has its own arrow (`SITE-…` IDs) for how the site works. Site *content* is downstream of the product's arrow: a page's frontmatter cites upstream requirement IDs, and `upstream/lock.yaml` pins the commit they are read at.

- Never state product behavior that the pinned upstream `docs/high-level-design.md` or `docs/intent/**` does not state. Upstream designs and specs are the source of truth; where the upstream README disagrees with them, the specs win.
- Never hand-edit a `generated` page. Change the generator or its input.
- Never write a default value, a latency, a request count or a speed-up on an authored or derived page. Defaults live only on the generated configuration reference; measurements wait for upstream benchmarks.
- A page about an area upstream marks as still changing carries `status: changing` and states only what is settled.

### Navigation

| What you need | Where to look |
|---|---|
| High-level design | `docs/high-level-design.md` |
| Design tree and EARS specs | `docs/intent/<segment>/` (`<segment>-design.md`, `<segment>-specs.md`) |
| Arrow overlay | `docs/arrows/index.yaml` |
| Upstream pin and snapshot | `upstream/lock.yaml`, `upstream/snapshot/specs.json` |
| Pages | `src/content/docs/` |
| Proposals the design came from | `docs/proposals/` |

### Page frontmatter

```yaml
lid:
  class: derived            # generated | derived | authored
  cites: [SPARK-RD-IQ, CORE-QRY-IQ]   # upstream IDs or ID prefixes
  docs: [spark/read/read-design.md#IndexQuery]   # optional upstream design sections
  reviewed: a865437         # upstream commit the page was last checked against
  fingerprint: 1f0c9a2e7b3d # written by `npm run check -- --stamp`
engine: [spark, datafusion]
status: available           # available | planned | deferred | changing
```

### Code annotations

Annotate scripts, components and tests with `@spec` comments citing site EARS IDs: `// @spec SITE-LINK-FP-001`.
