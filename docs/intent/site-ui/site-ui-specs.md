# Site UI Specs

- [x] **SITE-UI-THEME-001**: The site shall use a paper background of `#FAF7F0`, ink `#12161C`, accent `#C23A1E` and marker `#FFD84D` in its light theme, with a dark theme that keeps the marker colour.
- [x] **SITE-UI-THEME-002**: The site shall set headings in Fraunces, body text in Inter and code in JetBrains Mono, each with a system fallback.
- [x] **SITE-UI-LOGO-001**: The site's logo and favicon shall be an SVG 3×3 grid with its centre cell filled in the marker colour.
- [x] **SITE-UI-META-001**: Every page except splash pages shall show, below its title, one badge per engine in its `engine` list.
- [x] **SITE-UI-META-002**: Where a page's status is not `available`, the page shall show a status badge below its title.
- [x] **SITE-UI-CHIP-001**: The spec chip shall show the cited upstream ID or prefix and link to its specs file at the pinned commit.
- [x] **SITE-UI-CHIP-002**: Where a cited ID or prefix is an open gap or deferred, the spec chip shall show that status as text.
- [x] **SITE-UI-VERIFIED-001**: Every page with a non-empty `lid.cites` shall end with a block listing each citation as a spec chip, the upstream commit it was reviewed at and its page class.
- [x] **SITE-UI-TALK-001**: The talk embed shall load no resource from YouTube until the reader activates it, and shall then load the player from `youtube-nocookie.com`.
- [x] **SITE-UI-TALK-002**: The talk embed shall show a link to the video on YouTube, chapter links with timestamps, and a statement that the talk describes IndexTables 0.5.x.
- [x] **SITE-UI-HOME-001**: The home page shall show one example in Spark SQL, PySpark, Scala and DataFusion that combines a text match, an exact match and a range, and shall present standalone and companion tables side by side.
- [x] **SITE-UI-NAV-001**: On screens at least 72rem wide, every page, including the home page, shall show in its header links to the Why, Learn, Get started, Guides, Concepts, Reference and Blog sections, with the current section marked.
- [x] **SITE-UI-NAV-002**: On screens narrower than 50rem, every page shall show in its header the logo, the site name, search and a menu button that opens the full site navigation; on screens narrower than 72rem the home page shall show that menu button as well; and at no width shall the header clip the site name or scroll sideways.
- [x] **SITE-UI-FONT-001**: The site shall serve its fonts from its own origin and shall request no font or stylesheet from another host.
