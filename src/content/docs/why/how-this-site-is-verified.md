---
title: How this site is verified
description: Every statement about the product is tied to a tested requirement at a known commit of the product repository.
sidebar: { order: 3 }
lid:
  class: authored
---

IndexTables is built with [Linked-Intent Development](https://github.com/jszmajda/lid). The product's behavior is written down as several thousand one-line requirements. Each requirement has an ID, tests that cite it and code that cites it.

This site is built the same way and is linked to those requirements.

## What that means for a reader

- **Each page lists what it rests on.** At the foot of a documentation page, "Verified against" shows the requirement groups the page was written from and the product commit it was checked at.
- **Status is computed.** [Availability](/reference/availability/) is worked out from the requirements' own markers: implemented, open or deferred.
- **Moving facts are generated.** The [configuration reference](/reference/configuration/) is produced from the product's key registry. No other page states a default, so a default cannot be out of date somewhere else.
- **Changes upstream flag pages here.** When a requirement a page cites changes, the page is listed for review before the site moves to the newer product commit.

## What that means for an agent

Every page is also plain Markdown: add `.md` to its address. [`/llms.txt`](/llms.txt) lists all pages and [`/llms-full.txt`](/llms-full.txt) holds the documentation in one file. The Markdown carries the page's status, engines and cited requirement IDs, so a statement can be checked against its source.

## What is not claimed

- Performance figures for the current version. They will be added when the product's benchmarks are published.
- Areas the product team is still changing. Those pages are marked "Still changing" and state only what is settled.

The requirement groups and their counts are listed under [Specifications](/reference/specifications/).
