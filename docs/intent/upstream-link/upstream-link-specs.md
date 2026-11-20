# Upstream Link Specs

- [x] **SITE-LINK-LOCK-001**: The site shall record the pinned upstream repository, full commit hash, commit date and LID version in `upstream/lock.yaml`.
- [x] **SITE-LINK-LOCK-002**: If the upstream checkout given to the snapshot script is not at the pinned commit and `--repin` is not given, then the script shall exit non-zero naming both commits and write nothing.
- [x] **SITE-LINK-LOCK-003**: When the snapshot script runs with `--repin`, it shall set the lock's commit and date to the checkout's HEAD and write the snapshot for that commit.
- [x] **SITE-LINK-SNAP-001**: The snapshot script shall record, for every requirement line in `docs/intent/**/*-specs.md` of the upstream checkout, its ID, its marker as `implemented`, `gap` or `deferred`, a 12-hex-digit SHA-256 prefix of its trimmed text, and the path of its file.
- [x] **SITE-LINK-SNAP-002**: If two upstream requirement lines carry the same ID, then the snapshot script shall fail naming the ID.
- [x] **SITE-LINK-SNAP-003**: The snapshot script shall record a hash of each section of second level or deeper in every upstream `*-design.md` and in `docs/high-level-design.md`, keyed by path and heading text.
- [x] **SITE-LINK-CITE-001**: When a citation equals an upstream requirement ID, it shall resolve to that ID only.
- [x] **SITE-LINK-CITE-002**: When a citation equals no upstream requirement ID, it shall resolve to every ID that begins with the citation followed by a hyphen.
- [x] **SITE-LINK-CITE-003**: If a citation in a page's `lid.cites` resolves to no ID, or a key in `lid.docs` names no recorded section, then the site check shall fail naming the page and the citation.
- [x] **SITE-LINK-FP-001**: A page's fingerprint shall be a hash of the sorted resolved IDs of its citations with each ID's marker and text hash, followed by its sorted cited design sections with each section's hash.
- [x] **SITE-LINK-FP-002**: If a page with a non-empty `lid.cites` or `lid.docs` has no stored fingerprint or one that differs from the fingerprint computed from the snapshot, then the site check shall fail naming the page.
- [x] **SITE-LINK-FP-003**: When the site check runs with `--stamp`, it shall write the computed fingerprint and the pinned short commit as `lid.reviewed` into each derived or authored page whose fingerprint differs, and change nothing else in the file.
- [x] **SITE-LINK-DRIFT-001**: The drift report shall count upstream requirements whose text hash or marker changed, that were added, and that were removed between the committed snapshot and the checkout's HEAD.
- [x] **SITE-LINK-DRIFT-002**: The drift report shall list each page that cites a changed or removed requirement, a prefix that gained a requirement, or a design section whose hash changed, with the page's class and the reasons.
- [x] **SITE-LINK-DRIFT-003**: The drift report shall not modify the lock, the snapshot or any page.
- [x] **SITE-LINK-CHECK-001**: If a `@spec` annotation in `scripts/`, `src/` or `tests/` names an ID absent from this repository's `docs/intent/**/*-specs.md`, then the site check shall fail naming the file and the ID.
- [x] **SITE-LINK-CHECK-002**: If the snapshot's commit differs from the lock's commit, then the site check shall fail.
- [ ] **SITE-LINK-CI-001**: On a schedule, CI shall check out upstream `main`, run the drift report and publish it as the body of one rolling issue on this repository.
