# Content Specs

- [x] **SITE-CONT-FM-001**: Every page shall declare `lid.class` as `generated`, `derived` or `authored`; a page without it shall fail the build.
- [x] **SITE-CONT-FM-002**: A page's `status` shall be one of `available`, `planned`, `deferred` or `changing`, defaulting to `available`, and its `engine` shall be a list drawn from `spark` and `datafusion`.
- [x] **SITE-CONT-CLASS-001**: If a `derived` page has an empty `lid.cites`, then the site check shall fail naming the page.
- [x] **SITE-CONT-CLASS-002**: If a `generated` page lacks the generator's first-line comment, then the site check shall fail naming the page.
- [x] **SITE-CONT-VOL-001**: If a page that is neither generated nor legacy contains a multiplier claim (a number followed by `×` or `x faster`), then the site check shall fail naming the page and the text.
- [x] **SITE-CONT-VOL-002**: Where a page's status is `changing`, the page header shall state that the area is still changing upstream and that the page states only what is settled.
- [x] **SITE-CONT-LEGACY-001**: Where a page sets `legacy: true`, the page header shall state that it was written for IndexTables 0.5.x and link to the migration guide.
- [x] **SITE-CONT-LEGACY-002**: The site shall publish each blog post of the 0.5.x site under `/blog/<slug>/` with `legacy: true` and its original date.
- [x] **SITE-CONT-REDIR-001**: The site shall redirect the 0.5.x site's introduction, quickstart and configuration paths to their counterparts.
- [x] **SITE-CONT-LINK-001**: If an internal link in a page's source points to no page, then the site check shall fail naming the page and the link.
