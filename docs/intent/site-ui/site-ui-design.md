# Site UI

## Context and Design Philosophy

The look is "the highlighted page": a printed page with a marker pen. It is meant to be calm, readable and unlike both the 0.5.x site and the usual developer-tool dark gradient.

## Theme

| Token | Light | Use |
|---|---|---|
| Paper | `#FAF7F0` | Background |
| Ink | `#12161C` | Text, logo lines |
| Vermilion | `#C23A1E` | Links, primary action |
| Marker | `#FFD84D` | Behind matched terms and the key word of a headline; the logo's cell |
| Green / Amber / Slate | `#2F7D4F` / `#8A5800` / `#5B6573` | Available / Planned or changing / Deferred |

Headlines are set in Fraunces, body in Inter, code in JetBrains Mono. Borders are hairlines, corners are square, and there are no gradients, glows or shadows. A dark theme inverts paper and ink and keeps the marker.

## Logo

A 3×3 table grid with the centre cell filled in marker yellow: a hit found in a table. It is an SVG that stays legible at 16 px.

## Site navigation

On wide screens (72rem and up) the header carries links to the seven sections on every page, so the home page, which has no sidebar, still leads into the documentation; documentation pages also show the full sidebar. Below that width the header links are hidden, because they would no longer fit beside the site name, search and theme controls. Documentation pages keep the sidebar down to 50rem and use the menu button below it. The home page has no sidebar, so it shows the menu button at every width below 72rem, and the menu opens the full sidebar. The home page also ends with cards for the sections.

## Page header

Below the title: an engine badge per engine the page applies to, a status badge when the status is not `available`, and the "View as Markdown" link. Legacy and still-changing pages show a notice.

## Spec chips and the "verified against" footer

`<Spec id="…"/>` renders an upstream ID or prefix as a small chip linking to the specs file at the pinned commit, with its status in the tooltip and a visible suffix when it is planned or deferred. Every page with citations ends with a "Verified against" block listing them and the commit the page was reviewed at.

## Home page

A splash page with the headline, a combined example in tabs per language and engine, "what the index answers", how it works with both table kinds, paths by reader, the talk, and availability.

## Talk embed

The presentation video is shown as a poster that loads the player from `youtube-nocookie.com` only on click, with chapter links and a plain link to YouTube. It is labelled as describing 0.5.x.

## Decisions & Alternatives

| Decision | Chosen | Rejected and why |
|---|---|---|
| Fonts | Served from this site, as variable fonts from the `@fontsource-variable` packages, with system fallbacks | A font service sends every reader's address to a third party and adds a connection before text renders |
| Video | Click to load | An eager embed loads third-party scripts and cookies on the home page |
