# Proposal: design, layout and content of the new IndexTables website

Status: proposal for review. Nothing here is implemented yet.
Companion documents: [lid-sync-plan.md](lid-sync-plan.md) and the clickable mockup in [mockup/index.html](mockup/index.html).

## 1. Goals

1. One site that serves a first-time visitor, a data engineer mid-task, an operator at 2 a.m. and a platform builder reading the format specification, without any of them wading through the others' material.
2. Complete documentation of the cleanroom product, with every behavioral statement traceable to the product arrow in `indextables/indextables`.
3. Honest about status. A reader can always tell whether something is available, planned or deferred.
4. A look and structure clearly different from the current indextables.io.
5. Managed with LID, and cheap to keep correct (see the sync plan).

Non-goals: documenting 0.5.x (a migration guide covers the move), hosted playgrounds, user accounts, a forum.

## 2. What is wrong with the current site, concretely

Observed in `indextables_web` (Docusaurus classic preset, 36 doc pages, 6 posts):

| Observation | Consequence | Response in this proposal |
|---|---|---|
| One sidebar ordered by product structure (Core Concepts, Configuration, Query Guide, SQL Commands, Advanced, Cloud, Reference) | A reader must already know the product to find a task | Navigation organized by what the reader is trying to do, with role entry points |
| "Advanced Topics" and "Configuration" are catch-alls | Caching is split across three sections | Topics grouped by job: write, query, operate, deploy |
| Reference pages are hand-written | They drift from the code | Reference is generated from the arrow |
| Home page leads with a manifesto | A visitor cannot tell in ten seconds what the product does | Home page leads with one plain sentence and a runnable example |
| No status signalling | Planned and shipped features read the same | Availability badges generated from spec markers |
| Stock Docusaurus look, Google-blue palette | Indistinguishable from hundreds of projects | A distinct visual identity (section 7) |

## 3. Audiences

The product HLD names four users, and its DataFusion binding brings a fifth: the developer who embeds DataFusion. The site adds two more who never appear in a product design: the evaluator and the newcomer.

| Audience | Arrives asking | Lands on |
|---|---|---|
| Evaluator (architect, lead, manager) | "What is this, and should we care?" | Why IndexTables |
| Newcomer (knows SQL, not search) | "What is full-text search on a lakehouse?" | Learn |
| Data engineer | "How do I build and maintain a table?" | Get started, then Guides: Write, Maintain |
| Analyst or application developer | "How do I search?" | Get started, then Guides: Query |
| Lakehouse operator | "How do I run this safely, and add search to Delta/Iceberg/Parquet?" | Guides: Operate, Companions, Deploy |
| Rust or DataFusion developer | "How do I query these tables from my own process?" | Get started: DataFusion, then Guides: DataFusion |
| Platform builder | "How does it work inside, and how do I embed it?" | Concepts, Comet, Specification |

## 4. Framework: comparison and recommendation

| | Astro + Starlight | Docusaurus 3 | MkDocs Material | Sphinx (PyData theme) |
|---|---|---|---|---|
| Used by | Astro, Cloudflare, many newer projects | Current site; many open-source projects | Apache Iceberg | Apache DataFusion; Apache Spark's API docs |
| Output | Static HTML, almost no JavaScript by default | React app, hydrated on every page | Static HTML | Static HTML |
| Custom landing and marketing pages | Full freedom (plain Astro pages beside the docs) | Possible, in React | Limited to theme overrides | Limited |
| Custom components in content (spec chips, tabs, badges) | MDX, any UI framework or none | MDX, React | Markdown extensions and macros; harder | Directives; hardest |
| Frontmatter validated by schema at build | Built in (content collections) | Not built in | Not built in | Not built in |
| Search without a hosted service | Built in (Pagefind) | Plugin | Built in | Built in |
| Versioned docs | Community plugin, or one build per tag | Built in and mature | Plugin (`mike`) | Per-branch builds |
| Blog | Astro content collection or plugin | Built in and mature | Plugin | Weak |
| Will it feel different from the old site | Yes | Only with heavy restyling | Yes, but will look like Iceberg's | Yes, but dated |

**Recommendation: Astro with Starlight for the documentation area, and plain Astro pages for the home page, Why, Learn and the blog.**

Reasons, in order of weight:

1. **Schema-validated frontmatter is the LID link.** The sync plan depends on every page declaring its class, site specs and upstream citations. Astro rejects a build when a page's frontmatter does not match the schema, so the rule is enforced by the build itself and not by a separate linter.
2. **Design freedom.** The home page and the plain-language guides need layouts a documentation theme does not provide. In Astro they are ordinary pages sharing one design system with the docs.
3. **Speed.** Pages ship as HTML with little or no JavaScript. That matters most to the reader who arrives from a search engine on a slow connection.
4. **Components.** Spec chips, availability badges, synced language tabs and the error lookup are small components in MDX.

What it costs: versioned docs are weaker than Docusaurus's. The sync plan already builds each version from its own tag and upstream pin, which does not depend on a framework versioning feature, so the weakness does not bite. If you would rather keep the mature built-in versioning and blog, Docusaurus is the fallback, and the citation schema would then be enforced by a separate check.

Versions checked on 2026-11-17: Astro 7.4, Starlight 0.43, Docusaurus 3.10, MkDocs Material 9.8.

## 5. Information architecture

### 5.1 Top navigation

```
[IndexTables]   Why   Learn   Get started   Guides   Concepts   Reference   Blog        [search /]  [version]  [GitHub]  [theme]
```

| Item | Purpose | Reader |
|---|---|---|
| Why | What it is, where it fits, when not to use it | Evaluator |
| Learn | Plain-language explainers and illustrated introductions | Newcomer |
| Get started | Working result in minutes, one path per environment | Everyone hands-on |
| Guides | Task-oriented how-to pages, grouped by job | Engineers, analysts, operators |
| Concepts | How it works and why it behaves as it does | Anyone going deeper |
| Reference | Exhaustive, generated, searchable facts | Anyone mid-task |
| Blog | Releases, design essays | Community |

The footer and a "Project" menu carry Community, Status and roadmap, How this project is built (LID), Specification, Releases and Contributing.

This follows the tutorials / how-to / explanation / reference split that most well-regarded documentation uses, with two additions the product needs: a plain-language tier above it and a specification tier below it.

### 5.2 Home page, top to bottom

1. **One sentence and one example.** "Full-text search on lakehouse tables, inside your query engine. No search cluster." The sub-line names Apache Spark and Apache DataFusion. Beside it, a tabbed example (Spark SQL, PySpark, Scala, DataFusion) that searches a table.
2. **Choose your path.** Six cards by role, each going to a different starting page.
3. **How it works in three steps.** Write an index beside your data; commit it in a transaction log; executors search it directly from object storage.
4. **Watch the talk.** The 36-minute conference presentation (section 5.5), with a short chapter list beside it.
5. **What you can do today.** The availability matrix, generated, with planned items marked as planned.
6. **Documentation you can check.** A short explanation that every reference statement cites a numbered requirement, with a live spec chip to click.
7. **Latest from the blog** and the footer.

### 5.3 Page inventory

Class: G = generated, D = derived from cited specs, A = authored (see the sync plan). "Old site" names the page of the current site whose topic is carried over; content is rewritten against the cleanroom arrow, not copied.

**Why**

| Page | Class | Upstream source | Old site |
|---|---|---|---|
| What is IndexTables | A | HLD Problem, Approach | why-indextables |
| Use cases (log and event search, security investigation, text search on lakehouse tables) | A | HLD Target Users | home page |
| How it compares (search servers; plain Parquet scans; Delta and Iceberg alone) | A | HLD Non-Goals, Tenets | why-indextables |
| When not to use it | A | HLD Non-Goals | new |
| Talks and videos | A | none (section 5.5) | new |
| Design principles | D | HLD Tenets | new |
| FAQ | A + D | HLD, README | new |

**Learn** (plain language, illustrated, no prior search knowledge assumed)

| Page | Class | Upstream source |
|---|---|---|
| IndexTables in plain English | A | HLD Problem |
| Search for SQL people: what an inverted index is | A | `core/field-model`, `core/search` concepts only |
| Where the index lives: splits and the log, with pictures | A | `core/split-format`, `core/table-log` concepts only |
| Exact answers and fast answers | D | `spark/read` MODE, LIM |
| Standard tables and companions: which do I need? | D | HLD, `core/companion-format` |
| What it costs to run: storage, compute, caching | A | `core/cache`, HLD Goals |
| A guided tour: from a DataFrame to a search result | D, executable | README quick start |
| Glossary | G + A | HLD Terminology, LLD Terms |

**Get started**

| Page | Class | Upstream source | Old site |
|---|---|---|---|
| Quickstart with Spark: local Spark in five minutes | D, executable | README quick start; `spark/write` , `spark/read` SRC | getting-started/quickstart |
| Quickstart with DataFusion: search a table from a Rust process | D, executable | `datafusion/adapter` FAC, IQ, PROV | new |
| Install: artifacts, Spark and Scala versions, platforms | G + D | `pom.xml`, README artifacts | getting-started/installation |
| Your first table: types, text fields, partitions | D, executable | `spark/write`, `core/field-model` | getting-started/first-index |
| Your first searches: IndexQuery in ten examples | D, executable | `core/query` IQ, `spark/read` IQ | query-guide/indexquery-syntax |
| Run it on your platform: S3-compatible storage, Databricks, EMR | D | `core/storage`, `spark/config-auth` | cloud/* |
| Coming from 0.5.x | D | `docs/cleanroom-vs-legacy.md` | new |
| What next | A | — | new |

**Guides** (each page answers one "how do I" question)

| Group | Pages | Class | Upstream source | Old site |
|---|---|---|---|---|
| Write and index | Create and append; overwrite modes; choose field types and tokenizers; JSON and nested data; Variant columns on Spark 4; partitioning; write tuning | D | `spark/write`, `core/field-model`, `core/split-build`, `core/partition-encoding` | core-concepts/field-types, partitioning, advanced/json-fields, optimize-write, configuration/index-writer |
| Query | Filter pushdown; IndexQuery cookbook; search across all fields; aggregates and what is pushed down; bucket aggregations; read modes and limits; acceleration policy; IP address fields | D | `spark/read`, `core/query`, `core/search`, `core/aggregation` | query-guide/* |
| Streaming | Read a table as a stream; offsets, restarts and change commits | D | `spark/streaming` | new |
| Catalogs | Register and use tables by name; CTAS and replace; Hive Metastore and Glue; Unity Catalog credential vending | D | `spark/catalog`, `core/catalog-entry`, `spark/config-auth` CRED | new |
| Maintain | Merge splits; checkpoints; purge; drop partitions; time-travel truncation; repair; merge-on-write and purge-on-write | D | `spark/maintenance`, `core/table-log` | sql-commands/*, advanced/merge-on-write, purge-on-write |
| Companions | What a companion is; build over a Parquet directory; reconcile; read predecessor Delta companions; table roots; source lifetime rules; Delta and Iceberg sync (planned) | D | `spark/companion-sync`, `core/companion-format`, `core/source-readers` | core-concepts/companion-mode |
| Cache and memory | Cache tiers; disk cache setup; prewarm; memory sizing | D | `core/cache`, `spark/memory`, `spark/operations` PRE | configuration/cache-settings, memory-management, advanced/l2-disk-cache, sql-commands/prewarm-cache |
| Storage and credentials | S3 and S3-compatible; Azure; GCS; credential providers and refresh | D | `core/storage`, `spark/config-auth` | configuration/s3-configuration, azure-configuration |
| Observe and troubleshoot | DESCRIBE commands; the profiler; query traces; CPU profiles; OTLP export; observability without the plugin; troubleshooting by symptom | D | `core/observability`, `spark/operations` | sql-commands/describe-commands, profiler |
| Deploy | Databricks; AWS EMR; Kubernetes and open-source Spark; Spark Connect; sizing checklist | D + A | `spark/config-auth`, `core/storage`, README | cloud/databricks, aws-emr |
| DataFusion | Register a table (`CREATE EXTERNAL TABLE … STORED AS INDEXTABLES`, table provider); IndexQuery through `indexquery()` and `indexqueryall()`; filter and aggregate pushdown; partitions; the catalog provider; memory and metrics; errors; what differs from Spark; Comet status | D | `datafusion/adapter` | new |

**Concepts**

| Page | Class | Upstream source | Old site |
|---|---|---|---|
| Architecture: core, bindings, native boundary | D | HLD System Design | new |
| Splits | D | `core/split-format`, `core/split-build` | core-concepts/split-architecture |
| The transaction log, snapshots and concurrency | D | `core/table-log`, `core/table-format` | core-concepts/transaction-log |
| The field model | D | `core/field-model` | core-concepts/field-types |
| How a query runs: planning, pruning, pushdown, verdicts | D | `spark/read`, `core/query`, `core/search` | query-guide/filter-pushdown |
| Correctness model: exact, bounded, never approximate | D | HLD Tenets, Goals; `spark/read` MODE | new |
| Companions in depth | D | `core/companion-format` | core-concepts/companion-mode |
| Caching model | D | `core/cache` | advanced/l2-disk-cache |
| Compatibility with 0.5.x tables | D | HLD wire compatibility; `docs/conformance-corpus.md` | new |

**Reference**

| Page | Class | Upstream source | Old site |
|---|---|---|---|
| Configuration keys (searchable, filterable by area and scope) | G | `spark/config-auth` key registry | reference/configuration-reference, configuration/essential-settings |
| SQL commands (one page per command: syntax, options, output schema, examples) | D, syntax blocks checked | `spark/operations`, `spark/maintenance`, `spark/companion-sync` CMD | sql-commands/* |
| IndexQuery syntax | D | `core/query` IQ, IQV | query-guide/indexquery-syntax |
| Field types and options | D | `core/field-model` | reference/schema-types |
| Read and write options | G + D | `spark/config-auth`, `spark/read`, `spark/write` | new |
| Errors and what they mean | G | failure-condition specs | new |
| Metrics and DESCRIBE output schemas | D | `core/observability`, `spark/operations` | new |
| Compatibility matrix | G | `pom.xml`, README | new |
| Feature status | G | spec markers, roadmap | new |
| Release notes | A + G | upstream releases | blog release posts |

**Project**

| Page | Class | Upstream source |
|---|---|---|
| Status and roadmap | G | roadmap, `arrows/index.yaml` |
| How IndexTables is built: Linked-Intent Development | A | upstream `AGENTS.md`, LID |
| Specification browser (HLD, design docs, every requirement by ID) | G | whole arrow |
| Table format specification | D | `core/table-format`, `split-format`, `partition-encoding`, `companion-format` |
| Contributing; Community; Security | A | upstream repo files |

Total for the first complete release: about 110 pages, of which roughly 10 are generated (several fan out into many URLs), 75 derived and 25 authored.

### 5.4 Blog migration

All six posts move with their dates, authors, tags and images.

| Post | New URL | Handling |
|---|---|---|
| Your Fast Search Data Should Be Yours (2026-01-02) | `/blog/welcome` | Kept as written |
| Announcing IndexTables 0.4.5 (2026-02-02) | `/blog/announcing-0.4.5` | Banner: describes the 0.x line |
| Search Is an Index, Not a Copy: Companion Mode in 0.5.0 (2026-02-16) | `/blog/companion-mode-0.5.0` | Banner; link to the current companion guide |
| IndexTables 0.5.4 (2026-03-15) | `/blog/release-0.5.4` | Banner |
| The Data Layer Problem No One Is Talking About (2026-04-04) | `/blog/data-layer-problem` | Kept as written |
| IndexTables 0.5.5 (2026-04-05) | `/blog/release-0.5.5` | Banner |

Slugs are unchanged, so existing links and feed subscribers keep working. Posts are historical records and are not rewritten; the banner says which product line a post describes and points to the current page. Internal links in posts that point at old doc URLs are covered by the redirects below. Two new posts are suggested for launch: "Why we rebuilt IndexTables" and "Documentation you can check".

### 5.5 Conference talk

"1000× Faster Retrieval: Indexed and Full-Text Search in the Lakehouse" by Scott Schenkein ([YouTube](https://www.youtube.com/watch?v=PqLCqE4zOY0), published by Databricks Events on 2026-06-26, 36 minutes) is the best single introduction for a visitor who would rather watch than read. It appears in three places:

| Where | How |
|---|---|
| Home page | A "Watch the talk" section after "How it works": the video and five chapter links |
| Why / Talks and videos | The video with its full chapter list. Each chapter links to the video at that timestamp and to the page that covers the same topic (for example "Index Query Operator" to the IndexQuery guide, "Companion Mode" to the companion concept page, "Pre-Warming NVMe Cache" to the caching guide) |
| Learn / IndexTables in plain English, and What is IndexTables | A one-line "Prefer to watch?" link |

Rules for the embed:

- The player loads only when the visitor clicks. Until then the page shows a still image and a play button, so no YouTube script or cookie is loaded on page view, and the click uses the `youtube-nocookie.com` player. This keeps the home page inside its performance budget.
- A plain link to YouTube sits beside the player for visitors who block embeds.
- The talk describes the 0.5.x line, including its benchmark figures. Like the migrated blog posts, it carries a note saying so and pointing to the current availability matrix. The site does not restate the talk's performance numbers as claims about the cleanroom until they are re-measured.
- The page is authored, cites no upstream specs and is outside drift detection. The chapter links to site pages are covered by the ordinary link check.

The Talks and videos page is a list, so later recordings are added as entries without a layout change.

### 5.6 Redirects from the old site

Every old URL gets a permanent redirect, generated from one reviewed map and checked in CI. Examples:

| Old | New |
|---|---|
| `/docs/getting-started/quickstart` | `/start/quickstart` |
| `/docs/core-concepts/companion-mode` | `/guides/companions/overview` |
| `/docs/reference/configuration-reference` | `/reference/configuration` |
| `/docs/sql-commands/merge-splits` | `/reference/sql/merge-splits` |
| `/why-indextables` | `/why` |

### 5.7 Engines: Spark and DataFusion

The product is one engine-neutral core with two bindings, and the site presents it that way. Spark leads, because it carries ten of the eleven binding segments and every write path. DataFusion is the second engine throughout, not an appendix.

| Area | Treatment |
|---|---|
| Home page | Engine-neutral headline; a DataFusion tab in the hero example; a "Rust developer" path card; an engine column in the availability matrix |
| Learn and Concepts | Written once, engine-neutral. They describe the core: splits, the transaction log, IndexQuery, exactness, companions |
| Get started | One quickstart per engine, behind a "With Spark / With DataFusion" switch. The choice is remembered across pages, like the language tabs |
| Guides | Every guide carries an engine badge. A guide whose behaviour both engines share (IndexQuery syntax, filter pushdown, exact aggregates) shows both forms in tabs. Spark-only topics (writes, maintenance SQL, streaming, fast mode, companion builds) say so and state what a DataFusion user does instead |
| Reference | Spark configuration and SQL stay as they are. DataFusion gets its own reference pages: SQL functions and DDL, the Rust API link, and its failure conditions |
| Availability matrix | Generated per engine from the `SPARK-*`, `DF-AD-*` and `CORE-*` spec markers, so a capability that exists in one engine only is shown as such |

The engine badge is generated, not typed: a page that cites only `SPARK-*` specs is badged Spark, one that cites only `DF-AD-*` is badged DataFusion, and one that cites only `CORE-*` or both is badged for both.

The navigation is built so that a third binding is one more entry in the switch, the matrix and the Guides list, with no change to Learn or Concepts.

## 6. Usability rules

These become site EARS specs, so they are checked and not merely intended.

1. **Three clicks to any page, one keystroke to search.** `/` opens search from anywhere. Search covers pages, configuration keys, SQL commands, error text and spec IDs.
2. **Every page says who it is for and what you will have at the end**, in its first two lines.
3. **One page, one job.** A guide does not explain theory; it links to the concept. A reference page does not teach; it links to the guide.
4. **Code first.** Guides show the working example before the explanation. Every block has a copy button. The language choice (Spark SQL, PySpark, Scala, DataFusion) and the engine choice are remembered across the site.
5. **Status is always visible.** Available, Planned, Deferred, engine (Spark, DataFusion) and "Spark 4 only" badges come from spec markers and are never hand-typed.
6. **Statements are checkable.** Reference claims carry spec chips. Each page footer shows the upstream commit it was verified against.
7. **Next step on every page.** No dead ends.
8. **Plain words first.** A term's first use on a page is plain English, with the formal name after it and a hover definition from the glossary.
9. **Works for machines too.** `llms.txt`, and a Markdown rendition of every page, for people who read documentation through an assistant.
10. **Accessible and fast.** WCAG 2.2 AA contrast and keyboard operation; a per-page weight budget enforced in CI; no layout shift from late-loading fonts.

## 7. Visual design

### 7.1 Direction: "the highlighted page"

The current site is cool blue on white with a magnifier-over-grid icon. Iceberg, Spark and DataFusion are also blue or blue-orange. The proposal moves away from all of them.

The idea comes from what the product does: it finds the words you asked for. The site's signature is the **search-hit highlight**: a marker-pen stroke behind the key words of a headline, the same treatment a search result gives a matched term. It is used sparingly: one highlight per headline, and in code samples on the matching term of a query result.

| Element | Choice | Why |
|---|---|---|
| Ground | Warm paper `#FAF7F0` (light), ink `#12161C` (dark) | Reads as a document, not a dashboard; easy on the eyes for long reference sessions |
| Text | Ink `#161B22` on paper; `#E8E4DA` on ink | High contrast without pure black on pure white |
| Highlight | Marker yellow `#FFD84D` behind dark text | The signature. Never used as text colour |
| Accent | Vermilion `#C23A1E` (5.0:1 on paper) for links, primary buttons, active navigation | One accent only; distinct from the blues of neighbouring projects |
| Structure | Hairline rules and a faint table grid `#E4DED0` | Echoes "tables"; replaces cards-with-shadows |
| Status colours | Green `#2F7D4F` available, amber `#8A5800` planned, slate `#5B6573` deferred | Always paired with a text label |
| Headlines | A serif with character (Fraunces, or Source Serif 4 as the conservative choice) | Sets the site apart from the all-sans look of most developer sites |
| Body and UI | Inter | Legible at small sizes |
| Code | JetBrains Mono | Clear distinction of `0O` and `1lI` |

Fonts are self-hosted and subset. Dark mode is a first-class theme, not an inversion: the highlight becomes a muted amber underline so it does not glare.

Shapes are square-cornered or nearly so (2 px radius), borders are hairlines, and there are no gradients, glows or stock illustrations. Diagrams are drawn in one style: ink line work on the paper ground, with the highlight marking the element being discussed.

### 7.2 Logo

The logo is a 3×3 table grid with one cell filled in highlight yellow (a hit in a table), beside the wordmark set in the headline serif. It replaces the table-and-magnifier mark of the 0.x site.

- **Why this mark.** It shows what the product does, it uses the same highlight as the headlines and code output, and it is a few lines and one square, so it stays sharp at favicon size, in one colour and in dark mode.
- **What the first build stage delivers.** The mark in the mockup is a sketch. The production set is an SVG mark with final proportions, a favicon, a one-colour variant, a dark-mode variant, a wordmark lockup and a social card.
- **Where it changes.** The site uses the new mark from its first build. The GitHub organisation avatar and social cards change at domain cut-over. Images inside migrated blog posts and the conference talk keep the old mark.

### 7.3 Alternatives considered

| Direction | Description | Why not recommended |
|---|---|---|
| "Console" | Dark-first, teal on charcoal, monospace headlines | Fits observability tooling, but is the default look of that category and tiring for long reading |
| "Lakehouse blue, refreshed" | Keep the blue, modernize type and spacing | Lowest risk, but does not meet the "feel different" goal |

### 7.4 Page templates

| Template | Layout |
|---|---|
| Home | Full-width sections on the paper ground; hero with example; role cards; three-step diagram; status table |
| Learn | Single wide text column, large type, illustrations in the margin; no sidebar |
| Guide and Concept | Left: section navigation. Centre: content, about 72 characters wide. Right: "on this page" and the citations panel |
| Reference | Wider content column, dense tables, sticky filter bar, every row linkable |
| Blog | Single column; post list with tags; pre-cleanroom banner where it applies |

### 7.5 Components

Spec chip; availability badge; synced language tabs; "who this is for" header; step list for tutorials with expected output; callouts (note, caution, planned); configuration key card; SQL syntax block; error entry; citations panel; version switcher; next-step footer.

## 8. Technical layout of the repository

```
indextables-site/
  AGENTS.md                      LID directives, link to upstream arrow
  upstream.lock.yaml             pinned upstream commit
  docs/
    high-level-design.md         site HLD
    intent/<segment>/            site LLDs and EARS specs
    arrows/                      overlay, upstream-map.yaml
    lid/                         vendored workflow doc, sync-workflow.md
    proposals/                   these documents
  site/
    src/content/                 pages (MDX) by area: why, learn, start, guides, concepts, reference, blog
    src/components/              spec chip, badges, tabs, …
    src/pages/                   home and other custom pages
    src/styles/                  design tokens
  tools/
    upstream/                    snapshot, drift
    generators/                  one per generated page family
    checks/                      the PR checks
  examples/                      runnable tutorial code
  upstream/snapshot.json         parsed upstream arrow at the pin
  .github/workflows/             pr-checks, upstream-sync, deploy
```

Hosting: GitHub Pages from this repository, on `indextables.io` (with `www` redirecting), deployed by a workflow on merge to `main`. Pull requests get a preview build. Search is Pagefind, built at deploy time, with no external service. Analytics, if wanted, should be a cookie-free service; none is assumed.

## 9. Delivery sequence

**The site is generated after the product's intent is fully implemented.** Generation starts when upstream `scripts/spec-check.py` reports no active-gap (`[ ]`) spec in any segment. The site pins that commit. Specs marked deferred (`[D]`) remain and are shown as Deferred.

What the gate buys:

- Derived pages are drafted once, against settled specs, instead of being redrafted as slices land.
- Executable tutorials can run against a real build from the first page.
- The first published availability matrix has no "Planned" rows. The Planned badge stays in the design for requirements upstream adds after launch.

| Stage | Contents | Depends on |
|---|---|---|
| 0 | Your decisions on these proposals | — |
| Gate | Upstream reports zero active-gap specs; that commit becomes the pin | Upstream |
| 1 | Site LID: `AGENTS.md`, HLD, LLDs and EARS written from the approved proposals | Gate |
| 2 | Repository bootstrap: framework, design tokens, logo set, home page, blog and talk migration, redirects | Stage 1 |
| 3 | Upstream link and generators (configuration, per-engine availability, specification browser) | Stage 1 |
| 4 | Get started for Spark and for DataFusion, and Learn, with executable tutorials | Stages 2–3 |
| 5 | Guides and Concepts, area by area, DataFusion guides included | Stage 3 |
| 6 | Remaining Reference and the failure catalog | Stage 3 |
| 7 | Sync job, then the agent step | Stage 3 |
| 8 | Cut-over of indextables.io, timed with the cleanroom release | All |

Stages 4 to 6 are the bulk of the work and parallelize well by documentation area.

## 10. Decisions needed from you

1. Framework: accept Astro with Starlight, or prefer Docusaurus.
2. Visual direction: "the highlighted page", or one of the alternatives.
3. Navigation labels and the page inventory: anything missing, or anything that should not be public.
4. Upstream visibility: whether the specification browser and outbound spec links wait until `indextables/indextables` is public.
5. Domain: replace indextables.io at cut-over, or run the new site on a preview address first.
