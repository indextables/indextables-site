# Plan: keeping indextables-site in sync with the IndexTables arrow

Status: proposal for review. Nothing here is implemented yet.
Companion document: [site-design-proposal.md](site-design-proposal.md).

## 1. Summary

The website is its own Linked-Intent Development (LID) project in `indextables/indextables-site`, with its own HLD, LLDs, EARS specs, checks and content. It is downstream of the product arrow in `indextables/indextables`:

```
indextables/indextables (product arrow)          indextables/indextables-site (site arrow)
HLD → LLDs → EARS → Tests → Code                 HLD → LLDs → EARS → Checks → Content + site code
          │                                                  ▲
          └── pinned commit + cited spec IDs ────────────────┘
```

Three rules define the linkage:

1. **Pinned.** The site records the exact upstream commit it documents. Every statement about product behavior is true of that commit, not of "main, roughly".
2. **Cited.** Every page that describes product behavior names the upstream spec IDs or design-doc sections it is derived from. The citations are machine-readable and are also shown to readers.
3. **Gated.** CI recomputes, for every page, whether the upstream text it cites has changed since the page was last reviewed. A page whose sources changed cannot ship as "current" until it is regenerated or re-reviewed.

Intent flows one way. The site never edits upstream. When writing documentation exposes an ambiguity or an error in the product arrow, the site files an upstream issue and waits for the upstream cascade.

## 2. What was examined

Upstream at commit `e947724` (2026-11-17), LID 1.4.0, Full mode:

| Item | Finding |
|---|---|
| Design tree | 3 roots (`core`, `spark`, `datafusion`), 26 leaf segments under `docs/intent/` |
| EARS specs | About 6,000 IDs in 26 `*-specs.md` files, shaped `ROOT-LEAF-GROUP-NNN` (for example `SPARK-RD-SRC-004`) |
| Status markers | `[x]` implemented, `[ ]` active gap, `[D]` deferred, per spec |
| Overlay | `docs/arrows/index.yaml` with per-segment status and counts |
| Roadmap | `docs/decisions/implementation-roadmap.md` with a `Completed slices:` line |
| User-facing prose that already exists | `README.md`, `docs/cleanroom-vs-legacy.md`, `docs/user/observability-without-plugin.md` |
| Structured tables inside LLDs | The configuration key registry is about 210 Markdown table rows in `config-auth-design.md` |
| Visibility | The repository is currently **private** (see section 11) |

LID itself (1.4.x) defines no cross-repository construct that I could find; its own website lives inside the LID repository as one segment. The cross-repo link below is therefore a convention the site arrow defines for itself. It uses only LID's existing ideas (spec IDs as grep anchors, one-way cascade, pause at segment boundaries).

## 3. The upstream link

### 3.1 Pin

`upstream.lock.yaml` at the repo root:

```yaml
upstream:
  repo: indextables/indextables
  commit: e947724a19d21a233e5d75f7c9466823b43625ec
  lid_version: 1.4.0
  pinned_at: 2026-11-17
  channel: next          # "next" tracks main; a release channel pins a tag
```

CI fetches upstream at that commit with a sparse, blob-filtered clone limited to `README.md`, `docs/` and `pom.xml`. The conformance fixtures and source trees are not needed and are not fetched. A git submodule was considered and rejected: it drags the whole tree into every contributor checkout and makes the pin less visible than a reviewed lock file.

### 3.2 Snapshot

`tools/upstream/snapshot` parses the pinned checkout into `upstream/snapshot.json` (committed, so diffs are reviewable):

- per spec ID: marker, normalized text hash, file, line, section heading
- per design doc: a hash per heading section
- `docs/arrows/index.yaml` and the roadmap's completed-slice list, as data

### 3.3 Citations

Each page carries frontmatter. The site's content schema rejects a build when the block is missing or malformed.

```yaml
---
title: IndexQuery syntax
class: derived                        # generated | derived | authored
site_specs: [SITE-REF-IQ-001, SITE-REF-IQ-002]
upstream:
  specs: [CORE-QRY-IQ, CORE-QRY-IQV, SPARK-RD-IQ-003]   # a group prefix or a single ID
  docs: ["docs/intent/core/query/query-design.md#indexquery"]
reviewed:
  commit: e947724                     # upstream commit this page was last checked against
  fingerprint: 9c1f…                  # hash over the cited spec texts and markers
---
```

Citing a **group** (`CORE-QRY-IQ`) means "this page is responsible for everything in that group", so a spec added to the group later counts as drift. Citing a **single ID** is for a specific claim.

Inside the page body, a component marks individual claims:

```mdx
A read that names no table root fails with `Path is required…` <Spec id="SPARK-RD-SRC-004" />
```

It renders as a small chip that opens the requirement text and links to the spec line at the pinned commit. This is the reader-visible half of the linkage.

### 3.4 Drift

`tools/upstream/drift` compares each page's recorded fingerprint against the snapshot and classifies what it finds:

| Drift kind | Meaning | Default handling |
|---|---|---|
| Text changed | A cited spec's wording changed | Page is stale; redraft or re-review |
| Marker changed | `[ ]` → `[x]`, `[x]` → `[D]`, and so on | Availability badges regenerate; page is stale if it describes the feature |
| Spec removed | A cited ID no longer exists | Build fails until the citation is removed or replaced |
| Spec added to a cited group | New behavior in a group a page owns | Page is stale |
| Uncovered group | A user-facing upstream group no page cites | Reported as a coverage gap; warning, not failure |
| Design section changed | A cited LLD or HLD section changed | Page is flagged for review |

## 4. Three page classes

This is what "applicable portions" means in practice. The class decides how a page is kept in sync.

| Class | How it is produced | How it stays in sync | Examples |
|---|---|---|---|
| **Generated** | A deterministic script, from the snapshot. No AI, no hand edits. | Regenerated on every upstream bump. | Configuration reference, feature availability matrix, error message catalog, specification browser, compatibility matrix, glossary seed, roadmap status |
| **Derived** | Drafted by an agent (or a person) from the cited specs and design docs, then reviewed by you. | Drift gate. Stale pages are redrafted in the sync PR. | Concept pages, how-to guides, SQL command pages, IndexQuery syntax, migration guide |
| **Authored** | Written by a person. | Not gated on specs. A lighter "claims" check applies where the page states product facts. | Blog, Why IndexTables, plain-language explainers, use-case stories, community pages |

Tutorials are a special case of derived: they also contain runnable code. Their check is execution against a built artifact (section 7), which is a stronger guarantee than a citation.

### Generators proposed for the first release

| Generator | Upstream source | Output |
|---|---|---|
| Configuration reference | Key-registry tables in `spark/config-auth/config-auth-design.md` | One searchable page per key family: name, type, default, aliases, scope, availability |
| Availability matrix | Spec markers, `arrows/index.yaml`, completed slices | "Available / Planned / Deferred" badges on every page, and a project status page |
| Error catalog | Specs that state a failure condition (about 800; a minority give the literal message) | Searchable "why did this fail" reference grouped by operation, each entry linking to the page that explains the behavior |
| Specification browser | All `*-specs.md` and design docs | A read-only rendering of the arrow, addressable by spec ID (`/spec/SPARK-RD-SRC-004`) |
| Compatibility matrix | `pom.xml` profiles, README artifact table | Spark, Scala, JDK and platform support table |
| Glossary seed | HLD "Terminology" and LLD "Terms" sections | Glossary entries; plain-language definitions are layered on top as authored text |
| Spec-to-page index | Page frontmatter | For each spec group, the pages that document it; drives coverage reporting |

The configuration generator reads Markdown tables in a design doc. That works today and is covered by a check that fails loudly when the table shape changes. A sturdier source would be a machine-readable export from the product build (the `KeyRegistry` and the SQL command grammar as JSON). That is an upstream change and must go through the upstream arrow; it is listed in section 12 as a request, not assumed.

## 5. The sync workflow

```
 schedule (daily) or manual dispatch
            │
            ▼
 1. resolve newest upstream commit on the channel
 2. if unchanged → stop
 3. rebuild snapshot, run all generators
 4. compute drift report (drift.json + drift-report.md)
 5. open or update ONE rolling PR: "Upstream sync: <old>..<new>"
      • lock bump          • regenerated pages
      • drift report       • checklist of stale derived pages
            │
            ▼
 6. agent step (pluggable): redraft each stale derived page, following docs/lid/sync-workflow.md
            │
            ▼
 7. PR checks (section 6) → you review and merge → deploy
```

Design points:

- **One rolling PR**, not one per upstream commit. Upstream merges many times a day; the site should present you with one reviewable unit.
- **Polling first.** A scheduled job in the site repo needs no change upstream and no cross-repo write credential. An upstream `repository_dispatch` trigger can be added later for faster turnaround.
- **The agent step is a contract, not a vendor.** The workflow calls one configurable command. The contract is written down in `docs/lid/sync-workflow.md` and `AGENTS.md`: read `drift.json`; for each stale page, read the cited upstream specs at the new pin and the page's site specs; decide whether the site spec itself must change (if yes, stop and ask, because that is a site-intent change); otherwise update the page, its inline `<Spec>` chips and its `reviewed` block; never touch generated pages; never change a claim without a citation. Any agent that reads `AGENTS.md` can run it. With no agent configured, the PR still opens with the mechanical changes and a checklist, and the stale pages can be handled by hand or by an agent you start yourself.
- **Nothing merges without you.** The agent pushes commits to the PR branch only.
- **Site-intent changes pause.** If an upstream change means the site needs a new page, a restructured section or a changed promise, the agent does not improvise. It records the proposal in the PR, and the change walks the site arrow (site LLD → site EARS → checks → content) with your review at each phase, as LID requires.

### Releases and versions

Before the first cleanroom release the site documents one channel, `next`, pinned to a commit on upstream `main`, and labels itself as pre-release. From the first release on, each documented version is a site tag plus an upstream tag in the lock file; CI builds each version from its own tag into `/docs/<version>/`. A version's content is never copied forward by hand, so an old version cannot drift from the commit it claims to describe.

## 6. Checks (the site arrow's "tests")

All run on every PR. All are plain scripts; none needs an AI.

| Check | Fails when |
|---|---|
| `citations-resolve` | A cited upstream ID, group or doc section does not exist at the pinned commit |
| `fingerprints-current` | A derived page's recorded fingerprint differs from the snapshot, and the page is not explicitly marked "known stale" with a reason and a visible banner |
| `availability-honest` | A page presents a feature as available while a cited spec is `[ ]` or `[D]` and the page has no "Planned" marking |
| `generated-clean` | A generated page differs from generator output (someone edited it by hand) |
| `site-spec-check` | An `@spec` in site code or a `site_specs` entry in a page resolves to no site EARS ID; reports site specs nothing implements |
| `coverage-report` | Never fails; reports upstream user-facing groups that no page cites, against a reviewed allowlist of internal-only groups |
| `tutorial-run` | A tutorial's code blocks do not run, or their output differs from what the page shows |
| `build`, `links`, `a11y`, `perf-budget` | The site does not build, has broken internal links, fails accessibility checks, or exceeds the page-weight budget |

## 7. Executable tutorials

Getting-started and tutorial pages keep their code in files under `examples/`, included into the page at build time. A CI job runs them in local Spark against the artifact for the pinned upstream version and compares the output with what the page shows. Until a published artifact exists, the job builds upstream at the pinned commit on a schedule rather than on every PR, because that build is heavy.

## 8. The site's own arrow

Proposed design tree (`docs/intent/` in this repo). IDs are path-concatenated per LID.

| Segment | Prefix | Owns |
|---|---|---|
| `upstream-link` | `SITE-LINK` | Pin, snapshot, citations, drift classification, the checks in section 6 |
| `sync-workflow` | `SITE-SYNC` | The scheduled job, the rolling PR, the agent contract, release channels |
| `generators` | `SITE-GEN` | One group per generator |
| `content-model` | `SITE-CM` | Page classes, frontmatter schema, availability badges, the `<Spec>` chip |
| `information-architecture` | `SITE-IA` | Navigation, the page inventory, audience paths, redirects from the old site |
| `docs-content` | `SITE-DOC` | Per-area coverage obligations: which upstream groups each documentation area must cover |
| `learn-content` | `SITE-LEARN` | Plain-language guides, tutorials, the executable-tutorial rule |
| `blog` | `SITE-BLOG` | Migration of existing posts, authorship, the pre-cleanroom banner |
| `visual-design` | `SITE-VIS` | Design tokens, typography, components, accessibility and performance budgets |
| `build-deploy` | `SITE-BLD` | Framework, search, versioned builds, hosting, domain |

How LID's phases map onto a documentation site:

| LID phase | In this repo |
|---|---|
| HLD | `docs/high-level-design.md`: who the site is for, what it promises, the sync model |
| LLD | One design doc per segment above |
| EARS | For example: "`SITE-DOC-QRY-003`: The IndexQuery syntax page shall document every operator specified in `CORE-QRY-IQ`." |
| Tests | The checks in section 6 and the tutorial runner |
| Code | Site code and generators carry `@spec`; content pages carry `site_specs` in frontmatter |

An `upstream-map.yaml` beside `docs/arrows/index.yaml` records, for each upstream segment, its audience and the site area that covers it. Initial classification:

| Upstream segment | Audience on the site | Site area |
|---|---|---|
| `spark/read`, `core/query`, `core/search`, `core/aggregation` | Analysts, engineers | Querying guides, IndexQuery reference, read modes |
| `spark/write`, `core/field-model`, `core/split-build` | Data engineers | Writing and indexing guides, field type reference |
| `spark/maintenance`, `spark/operations` | Operators | Maintenance guides, SQL command reference |
| `spark/config-auth`, `core/storage` | Operators | Configuration reference, storage and credentials guides |
| `spark/catalog`, `core/catalog-entry` | Engineers, operators | Catalog guides |
| `spark/streaming` | Data engineers | Streaming guide |
| `spark/companion-sync`, `core/companion-format`, `core/source-readers` | Lakehouse operators | Companion guides |
| `core/cache`, `spark/memory` | Operators | Caching, prewarm and memory guides |
| `core/observability` | Operators | Observability guides, metrics reference |
| `datafusion/adapter` | Rust and DataFusion developers, platform builders | DataFusion quickstart, DataFusion guides and reference, Comet page; the engine column of the availability matrix |
| `core/table-format`, `core/split-format`, `core/partition-encoding`, `core/table-log` | Platform builders, the curious | Concepts, plus a format specification section |
| `spark/native-boundary` | Contributors | Internals; specification browser only |

## 9. What is deliberately not automated

- Choosing what the site promises and how it is organized. That is site intent and is reviewed by you.
- Blog posts and positioning pages.
- Merging.
- Fixing upstream. Problems found while documenting become upstream issues labelled `intent-gap`.

## 10. Rollout

Site generation starts once upstream `scripts/spec-check.py` reports no active-gap (`[ ]`) spec. The first pin is that commit, so the first drafting pass runs against settled intent and drift detection begins from a stable baseline.

| Step | Result |
|---|---|
| 1. Gate | Upstream reports zero active-gap specs; that commit is recorded in `upstream.lock.yaml` |
| 2. Bootstrap | LID installed in this repo (`AGENTS.md`, vendored workflow doc, HLD drafted from the approved proposals) |
| 3. Link core | Lock file, snapshot, citation schema, `citations-resolve` and `fingerprints-current` checks |
| 4. Generators | Configuration reference, per-engine availability matrix, specification browser, error catalog |
| 5. First content | Getting started for Spark and DataFusion, and core guides, drafted against the pin with citations |
| 6. Sync job | Scheduled job and rolling PR, without an agent step |
| 7. Agent step | Plug in the chosen agent once you decide which |
| 8. Versions | Switch from `next` to tagged versions at the first cleanroom release |

## 11. Risks and open items

| Item | Why it matters | Proposed handling |
|---|---|---|
| Upstream is private today | A public site would publish spec text and link to pages the public cannot open; CI needs a read credential | Until upstream is public: CI uses a read-only deploy key, spec chips show the requirement text but do not link out, and the specification browser is not published. Flip one setting when upstream opens. |
| Upstream churn | Specs change many times a day during the cleanroom build | Generation waits for zero active-gap specs (section 10); after that, the rolling PR and group-level citations keep the number of stale pages proportional to real change |
| Citation granularity | Too coarse makes every page stale constantly; too fine misses new behavior | Group citations by default, single IDs for specific claims; tune with real drift data after the first content step |
| Parsing design-doc tables | A reformatted table breaks a generator | Shape check fails loudly; longer term, the upstream export in section 12 |
| Agent drafting quality | A fluent but wrong paragraph is worse than a missing one | Claims need a `<Spec>` chip or sit under a page-level citation; `availability-honest`; tutorials execute; you review |

## 12. Requests to the upstream arrow (optional, for later)

These would make the link sturdier. Each is an upstream intent change and would be raised as an issue there.

1. A machine-readable export of the configuration key registry and the SQL command grammar, produced by the build.
2. A `docs/user/` convention for prose upstream wants published verbatim, so the site can include it instead of paraphrasing it.
3. A dispatch event on merges to `main` and on release tags, to replace polling.
