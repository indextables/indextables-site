# Generators Specs

- [x] **SITE-GEN-RUN-001**: If the upstream checkout given to the generator is not at the pinned commit, then the generator shall exit non-zero and write nothing.
- [x] **SITE-GEN-RUN-002**: The generator shall write each generated page with `lid.class: generated`, the pinned short commit as `lid.reviewed`, the page's citations and their fingerprint, and a first-line comment naming the generator and the commit.
- [x] **SITE-GEN-RUN-003**: When the generator runs twice on the same upstream commit and inputs, it shall write byte-identical pages.
- [x] **SITE-GEN-CLEAN-001**: The generator shall record a hash of each page it writes in `upstream/snapshot/generated.json`; if a generated page differs from its recorded hash, then the site check shall fail naming the page.
- [x] **SITE-GEN-CFG-001**: The generator shall write `reference/configuration` with one row per key of the upstream key registry's groups, showing the key relative to `spark.indextables.`, its type, default, range, process scope and aliases.
- [x] **SITE-GEN-CFG-002**: If the generator parses fewer than 100 keys from the registry, then it shall fail stating that the registry's shape changed.
- [x] **SITE-GEN-CFG-003**: The generator shall list the registry's no-op keys in a separate section stating that they are accepted and have no effect.
- [x] **SITE-GEN-AVAIL-001**: The generator shall write `reference/availability` with one row per feature of `data/availability.yaml`, showing engines, a status, limits and the cited upstream prefixes.
- [x] **SITE-GEN-AVAIL-002**: The generator shall set a row's status to Available when at least one resolved cited requirement is implemented, to Planned when none is implemented and at least one is an open gap, and to Deferred when all are deferred, unless the row sets `force`; and shall state the count of open requirements of an Available row in its limits.
- [x] **SITE-GEN-AVAIL-003**: If a citation in `data/availability.yaml` resolves to no upstream requirement, then the generator shall fail naming it.
- [x] **SITE-GEN-SPEC-001**: The generator shall write `reference/specifications` with one row per upstream specs file, showing counts of implemented, open and deferred requirements and the file's requirement groups.
- [x] **SITE-GEN-SPEC-002**: Each row of the specification browser shall link to the specs file at the pinned commit.
- [D] **SITE-GEN-ERR-001**: The generator shall write a catalogue of refused statements and their error texts from the upstream failure-condition requirements.
