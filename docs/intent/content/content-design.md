# Content

## Context and Design Philosophy

Pages are Markdown or MDX files under `src/content/docs/`. Their frontmatter is typed by the content collection schema, so a page with missing or malformed link data fails the build.

## Page classes

| Class | Written by | Cites | On drift |
|---|---|---|---|
| generated | `scripts/generate.mjs` | Always | Regenerated |
| derived | A person or agent, from cited requirements | Always, at least one | Redrafted and re-stamped |
| authored | A person | Only where it claims product behavior | Reviewed if it cites |

## Frontmatter

`lid` (class, cites, docs, reviewed, fingerprint), `engine` (which engines the page applies to; empty means engine-neutral), `status` (`available`, `planned`, `deferred`, `changing`), `legacy` (written for 0.5.x) and, for blog posts, `date`.

## Volatile areas

Upstream is still changing some areas. The site handles them by rule, not by judgement page by page:

- **Defaults** appear only on the generated configuration reference. Other pages name the key and link to it.
- **Performance**: no latency, request count, throughput or speed-up for the current version on any page. Speed is described by mechanism (an index lookup instead of a scan). Figures from 0.5.x appear only on legacy pages and in the talk, labelled as such.
- **Areas still changing** (clustering, profiling output and span names, the credential access-check model) get a page with `status: changing` that states what is settled and nothing else.

## Legacy content

The six blog posts of the 0.5.x site are kept under `/blog/` with `legacy: true`, which shows a notice that the post predates the rebuild and links to the migration guide. Their text is not edited to match the current version.

## Redirects

Paths of the 0.5.x site that have a counterpart redirect to it. Blog posts keep their slugs under `/blog/`.

## Positioning rules

- Both engines are first-class. Examples that work in both show both.
- Standalone and companion tables get equal weight. No general statement says the index sits "next to your data"; that is true only of companions.
- "Search" does not mean only text search. Exact match, range lookups and aggregates are presented as things the index answers.

## Decisions & Alternatives

| Decision | Chosen | Rejected and why |
|---|---|---|
| Still-changing areas | A short page marked `changing` | Omitting the page hides that the feature exists; writing it fully means rewriting it |
| Old blog text | Kept verbatim with a notice | Rewriting history; dropping posts breaks inbound links |
