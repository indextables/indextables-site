# Upstream Link

## Context and Design Philosophy

The site states product behavior that is defined in another repository. This segment makes that dependency explicit and checkable: one pinned commit, a committed snapshot of every upstream requirement, citations from pages, a fingerprint per page, and a drift report when the pin moves.

The snapshot is committed so that building and checking the site needs no access to the product repository, which may be private. Only re-pinning needs a checkout.

## Lock

`upstream/lock.yaml` holds the repository name, the full commit hash, the commit date, the upstream LID version and a channel label. It is the only place the pinned commit is written by hand or by `--repin`; the snapshot repeats it so a mismatch can be detected.

## Snapshot

`scripts/upstream-snapshot.mjs <upstream-dir>` reads every `docs/intent/**/*-specs.md` and records, per requirement ID: its marker (`implemented`, `gap`, `deferred`), a 12-hex-digit SHA-256 prefix of its text, and the file it is in. It also records a hash of every `##`-or-deeper section of each `*-design.md` and of `docs/high-level-design.md`, keyed `<path under docs, without intent/>#<heading>`. Without `--repin` it refuses to run on a checkout that is not at the pinned commit.

## Citations

A page cites upstream through `lid.cites` (requirement IDs or prefixes) and `lid.docs` (design-section keys). A citation resolves to the ID itself when it exists, otherwise to every ID that starts with the citation followed by a hyphen. `SPARK-RD-IQ` therefore resolves to `SPARK-RD-IQ-001…` and never to `SPARK-RD-IQV-…`.

## Fingerprints

A page's fingerprint is a hash over the sorted list of `<id> <marker> <text hash>` for every resolved ID, followed by `<section key> <section hash>` for every cited design section. It changes when a cited requirement's text or marker changes, when one is added to or removed from a cited prefix, and when a cited section changes. `npm run check -- --stamp` writes fingerprints; `npm run check` compares them.

A fingerprint mismatch at an unchanged pin means the page's citations were edited without re-stamping. After a re-pin it means the page needs review.

## Drift

`upstream-snapshot.mjs <upstream-dir> --drift` builds a snapshot of the checkout's HEAD in memory, compares it with the committed one and prints a Markdown report: counts of changed, added and removed requirements, and each affected page with its class and reasons. It writes nothing. CI runs it on a schedule against upstream `main` and publishes the report; an agent or a person then re-pins, regenerates, redrafts the listed derived pages and opens one pull request.

## Decisions & Alternatives

| Decision | Chosen | Rejected and why |
|---|---|---|
| Hash length | 12 hex digits | Full hashes triple the snapshot size for no practical gain in collision safety at this scale |
| Section fingerprints | Opt-in per page through `lid.docs` | Fingerprinting whole design files flags every page on any edit |
| Drift output | A Markdown report on stdout | Opening pull requests from the script binds the site to one forge and one agent |
