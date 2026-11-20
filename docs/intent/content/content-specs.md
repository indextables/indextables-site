# Content Specs

- [x] **SITE-CONT-FM-001**: Every page shall declare `lid.class` as `generated`, `derived` or `authored`; a page without it shall fail the build.
- [x] **SITE-CONT-FM-002**: A page's `status` shall be one of `available`, `planned`, `deferred` or `changing`, defaulting to `available`, and its `engine` shall be a list drawn from `spark` and `datafusion`.
- [x] **SITE-CONT-CLASS-001**: If a `derived` page has an empty `lid.cites`, then the site check shall fail naming the page.
- [x] **SITE-CONT-CLASS-002**: If a `generated` page lacks the generator's first-line comment, then the site check shall fail naming the page.
- [x] **SITE-CONT-VOL-001**: If a page that is neither generated nor legacy contains a multiplier claim (a number followed by `×` or `x faster`), then the site check shall fail naming the page and the text.
- [x] **SITE-CONT-VOL-002**: Where a page's status is `changing`, the page header shall state that the area is still changing upstream and that the page states only what is settled.
- [x] **SITE-CONT-LEGACY-001**: Where a page sets `legacy: true`, the page header shall state that it was written for IndexTables 0.5.x and link to the migration guide.
- [x] **SITE-CONT-LEGACY-002**: The site shall publish each blog post of the 0.5.x site under `/blog/<slug>/` with `legacy: true`, and shall show its original date, authors and tags under its title.
- [x] **SITE-CONT-LEGACY-003**: The site shall publish each documentation page of the 0.5.x site under `/0.5/docs/<path>/` with `legacy: true`, excluded from site search and from `llms-full.txt`, with an index of them at `/0.5/`.
- [x] **SITE-CONT-FEED-001**: The site shall publish an RSS feed at `/blog/rss.xml` and an Atom feed at `/blog/atom.xml` listing every dated blog post, newest first, with each entry's identifier equal to the post's address on the 0.5.x site.
- [x] **SITE-CONT-REDIR-001**: The site shall redirect each path listed in `data/redirects.yaml` to the address given for it.
- [x] **SITE-CONT-REDIR-002**: If a path in `data/legacy-sitemap.txt` is neither a page nor a redirect, or a redirect points to no page, then the site check shall fail naming the path.
- [x] **SITE-CONT-HONEST-001**: If a page that is not generated has status `available` and cites requirements none of which is implemented, then the site check shall fail naming the page.
- [ ] **SITE-CONT-EX-001**: CI shall run the examples of the Spark and DataFusion quickstarts against a product build at the pinned commit, and shall fail when one does not run.
- [x] **SITE-CONT-LINK-001**: If an internal link in a page's source points to no page, then the site check shall fail naming the page and the link.
- [x] **SITE-CONT-LAUNCH-001**: While `data/launch.yaml` sets `launched` to false, the site shall serve a `/robots.txt` that disallows every path and shall mark every page `noindex, nofollow`; when it is true, `/robots.txt` shall allow every path and name the sitemap.
