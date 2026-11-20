---
title: Clustering
description: Clustering companion indexes by column values. This area is still changing upstream.
sidebar: { order: 7 }
status: changing
lid:
  class: authored
engine: [spark]
---

Upstream is adding clustering for companions: a `CLUSTERED BY` clause on `BUILD INDEXTABLES COMPANION`, with sync and `MERGE SPLITS` that keep the clustering.

The syntax and behavior are not final, and they are not part of the product commit this site is checked against. This page will be written when the work lands.

Until then, the supported ways to reduce what a query reads are:

- [Partitioning](/guides/tables/partitioning/), inherited from the source table.
- File statistics, which work best when the source is written in time order.
- [Merging small index files](/guides/maintenance/merge-splits/).
