# Agent Markdown

## Context and Design Philosophy

Agents read documentation to act on it. HTML with navigation, tabs and scripts is a poor input; the page's own Markdown is a good one. Every page is therefore also published as Markdown, built from the same source in the same build, so the two cannot differ in substance.

## Outputs

| Output | Content |
|---|---|
| `<page path>.md` | Frontmatter (title, description, URL, engines, status, page class, cited upstream IDs, upstream repository and commit), the title, then the page body |
| `/llms.txt` | A summary of the product and a link to every page's Markdown with its description, grouped as the navigation is |
| `/llms-full.txt` | Every documentation page's Markdown concatenated; blog posts and the home page are left out |

## Transformation

The body is the page source with MDX removed: import lines dropped, each tab's label written as a bold line above its content so all tabs are present, spec chips written as `[spec <ID>: <status>]`, links kept, and layout components unwrapped. Fenced code is copied unchanged.

## Parity

After a build, the site check fails when a page has no `.md` output, or when an ID in the page's `lid.cites` is missing from the Markdown output's frontmatter. Each HTML page links to its Markdown from the page header.

## Decisions & Alternatives

| Decision | Chosen | Rejected and why |
|---|---|---|
| Source of the Markdown | The page source, transformed | Converting rendered HTML back to Markdown loses tabs and adds navigation noise |
| Legacy posts in `llms-full.txt` | Left out | They describe 0.5.x and would mislead an agent reading one file |
