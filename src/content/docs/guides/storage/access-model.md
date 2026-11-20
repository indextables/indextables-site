---
title: The access model
description: How IndexTables decides whether a session may read cached data. This area is still changing upstream.
sidebar: { order: 3 }
status: changing
lid:
  class: authored
engine: [spark, datafusion]
---

IndexTables keeps index data in local caches that several queries, and several users of one cluster, can share. Before serving cached data it must establish that the session asking could have read that data from storage itself.

How that check is made is being redesigned upstream, moving from a check per object towards grants established when a table's log is read. This page will describe the model once it has settled.

What does not change:

- **Access is decided by storage credentials for the table's location.** A catalog name, or permission on a companion's source table, does not by itself allow reading an index.
- **Reading by name and reading by path use the same credentials.**
- **A companion reader needs credentials for both** the companion and its source.
- **Credentials are never stored in a table or a catalog entry.**

See [S3](/guides/storage/s3/), [Azure and GCS](/guides/storage/azure-gcs/) and [Unity Catalog](/guides/catalogs/unity-catalog/) for configuring credentials.
