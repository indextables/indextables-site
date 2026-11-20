# Generators

## Context and Design Philosophy

Some product facts are still moving upstream: configuration keys and defaults, and which features are complete. Writing them by hand guarantees they go stale. `scripts/generate.mjs <upstream-dir>` writes three pages from upstream files at the pinned commit. Their frontmatter carries `lid.class: generated`, and they are committed so that a re-pin shows their changes as a reviewable diff.

## Configuration reference

Source: `spark/src/main/scala/io/indextables/spark/config/KeyRegistry.scala`. The generator reads each `k(...)` and `fam(...)` call inside the registry's key groups and extracts the name, type, default, aliases, range and process scope. Names built by string interpolation are shown with `<name>` in place of the variable part. Keys of the no-op group are listed separately as accepted and ignored.

The registry is Scala source, not data, so the parse is by pattern. The generator fails when it finds fewer than 100 keys, which catches a change of shape upstream without pretending to understand it.

No other page states a default. Guides name a key and link here.

## Availability matrix

Source: `data/availability.yaml`, a list of features with engines, cited upstream prefixes, a link and an optional limit note. The status of a row comes from the markers of its cited requirements: Available when at least one is implemented, Planned when none is and at least one is an open gap, Deferred when all are deferred. Open requirements of an available feature are counted in the Limits column. A row may set `force: planned` where upstream gates a feature outside its specs (Azure and GCS writes); the note then says why.

## Specification browser

One page listing every upstream segment with counts of implemented, open and deferred requirements, its requirement groups, and a link to the specs file at the pinned commit.

## Decisions & Alternatives

| Decision | Chosen | Rejected and why |
|---|---|---|
| Commit generated pages | Yes | Generating only at build time needs upstream access in every build and hides the diff from review |
| Availability rule | Available when any cited requirement is implemented, with open ones counted | "Planned when any is open" marks finished features as planned because of internal refinements |
| Error catalogue | Not generated yet | Upstream error texts are spread across specs without a common form; a pattern parse would be unreliable |
