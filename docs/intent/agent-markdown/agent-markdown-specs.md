# Agent Markdown Specs

- [x] **SITE-MD-PAGE-001**: The build shall publish, for every page, a Markdown file at the page's path with `.md` in place of the trailing slash, and at `/index.md` for the home page.
- [x] **SITE-MD-PAGE-002**: A page's Markdown shall begin with frontmatter giving its title, URL, status, page class, upstream repository and commit, and, where present, its description, engines and cited upstream IDs.
- [x] **SITE-MD-PAGE-003**: A page's Markdown shall contain the content of every tab of the page, each preceded by its label, and shall contain no import line and no component tag.
- [x] **SITE-MD-PAGE-004**: A page's Markdown shall copy fenced code blocks unchanged.
- [x] **SITE-MD-PAGE-005**: Where a page is legacy, its Markdown frontmatter shall state that it applies to IndexTables 0.5.x.
- [x] **SITE-MD-INDEX-001**: The build shall publish `/llms.txt` with a summary of the product and one link per page to its Markdown, with the page's description.
- [x] **SITE-MD-INDEX-002**: `/llms.txt` shall group links as the navigation does and label the blog group as written for 0.5.x.
- [x] **SITE-MD-INDEX-003**: The build shall publish `/llms-full.txt` holding the Markdown of every page except blog posts and the home page.
- [x] **SITE-MD-LINK-001**: Every page except splash pages shall show a "View as Markdown" link to its Markdown output in the page header.
- [x] **SITE-MD-PAR-001**: If, after a build, a page has no Markdown output, then the site check shall fail naming the page.
- [x] **SITE-MD-PAR-002**: If, after a build, an ID in a page's `lid.cites` is absent from its Markdown output, then the site check shall fail naming the page and the ID.
