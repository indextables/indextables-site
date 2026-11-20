# IndexTables Site: High-Level Design

## Problem

IndexTables is specified by several thousand written requirements in `indextables/indextables`, and its behavior changes only through them. Documentation written by hand beside such a product goes stale without anyone noticing: a default changes, a statement is refused where it was accepted, a feature moves from planned to available. Readers cannot tell which statements still hold, and neither can agents that read the documentation to act on it.

The site also has to serve people who will never read a requirement: someone deciding whether the product fits, someone trying it for the first time, and someone explaining it to a manager.

## Approach

The site is a static site whose content is downstream of the product's arrow of intent.

1. **One pin.** `upstream/lock.yaml` names one upstream commit. Everything the site says about the product is checked against that commit.
2. **Every product page cites.** A page's frontmatter lists the upstream requirement IDs, or ID prefixes, that its statements rest on. A fingerprint of the cited requirements is stored with the page.
3. **Three page classes.** *Generated* pages are written by scripts from upstream files and are never edited by hand. *Derived* pages are prose that restates cited requirements for a reader. *Authored* pages (marketing, blog, plain-language explanations) cite only where they make a product claim.
4. **Drift is computed, not noticed.** Moving the pin compares the old and new snapshot and lists the pages whose cited requirements changed. Generated pages are regenerated; derived pages are handed to an agent to redraft; a person reviews the result as one pull request.
5. **One source, two outputs.** Each page is published as HTML for people and as Markdown for agents, from the same source in the same build.

## Target users

| Reader | Needs | Served by |
|---|---|---|
| Evaluator | What it is, whether it fits, what works today | Home, Why, Availability |
| Newcomer, non-specialist | The idea in plain language | Learn |
| Spark or DataFusion developer | A working first query, then task guides | Get started, Guides |
| Operator | Maintenance, caches, credentials, configuration | Guides, Reference |
| 0.5.x user | What changed and how to move | Migrate from 0.5.x |
| Agent | Complete, citable text without running scripts | Markdown output, `llms.txt` |
| Site maintainer (human or agent) | Which pages a product change affects | Upstream link |

## Goals

- A statement about the product on any page can be traced to a requirement ID at a known commit.
- Volatile facts (configuration keys and defaults, availability) are generated, so refreshing them is a command.
- A first-time reader reaches a working query, in their engine, from the home page in two clicks.
- Spark and DataFusion are both first-class; standalone and companion tables get equal weight; full-text search, exact match, range lookups and aggregates are all presented as things the index answers.
- The site looks and reads unlike the 0.5.x site: warm paper, serif headlines, one highlight colour.

## Non-goals

- Maintaining documentation for IndexTables 0.5.x. Its blog posts and documentation are archived unchanged and labelled (the documentation under `/0.5/`); a migration guide covers the move.
- Publishing performance numbers before upstream has measured them.
- Versioned documentation, until the product has a second release.
- Choosing the agent that redrafts derived pages. The sync produces a report any agent or person can act on.

## Publication

The site is published at `www.indextables.io` from `main` only. It launches once the product repository is public under Apache-2.0 and initial performance testing shows no regression against 0.5.x. Every address in the 0.5.x site's sitemap keeps working, as a page or a redirect, and the blog feeds stay at their addresses. The site's code is Apache-2.0.

## System design

```
indextables/indextables @ pinned commit
        │  scripts/upstream-snapshot.mjs
        ▼
upstream/snapshot/specs.json ──► scripts/generate.mjs ──► generated pages
        │                                                    │
        ├──► scripts/site-check.mjs (citations, fingerprints) │
        ▼                                                    ▼
src/content/docs/**  (frontmatter: lid, engine, status) ──► Astro + Starlight build
                                                             ├──► HTML
                                                             └──► .md, llms.txt, llms-full.txt
```

| Segment | Owns | Prefix |
|---|---|---|
| upstream-link | The lock, the snapshot, citation resolution, fingerprints, drift | `SITE-LINK` |
| generators | Configuration reference, availability matrix, specification browser | `SITE-GEN` |
| content | Page classes, frontmatter, volatile-area rules, legacy content, redirects | `SITE-CONT` |
| agent-markdown | Per-page Markdown, `llms.txt`, `llms-full.txt`, parity | `SITE-MD` |
| site-ui | Theme, logo, page header, spec chips, the "verified against" footer | `SITE-UI` |

## Key design decisions

| Decision | Chosen | Why | Rejected |
|---|---|---|---|
| Where site intent lives | This repository, with its own arrow citing upstream IDs | Site changes do not need product pull requests; the link is explicit and checked | Site design docs inside the product repository |
| How upstream is read | A committed snapshot of ID, marker and text hash per requirement | Builds and checks need no access to the product repository; the diff of a re-pin is reviewable | Reading upstream at build time; a git submodule |
| Citation grain | IDs or ID prefixes | A guide depends on a group of requirements; prefixes pick up added requirements as drift | Only full IDs (hundreds per page) |
| Volatile facts | Generated, and stated nowhere else | Keys and defaults are still moving upstream | Hand-written tables |
| Framework | Astro with Starlight | Content collections with typed frontmatter, static endpoints for Markdown output, built-in search, full control of the look | Docusaurus (the 0.5.x site), MkDocs Material, Sphinx |
| Redrafting agent | Not chosen; the drift report is the interface | Keeps the site independent of any vendor | Binding CI to one agent |
