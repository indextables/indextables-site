---
title: Row-level deletes
description: How Delta deletion vectors and Iceberg position deletes, equality deletes and deletion vectors are honoured, at read time or at build time.
sidebar: { order: 6 }
lid:
  reviewed: a865437
  fingerprint: 1e2f74d3e511
  class: derived
  cites: [SPARK-SYNC-DEL, CORE-SRD-DEL, CORE-CF-DEL]
  docs: [spark/companion-sync/companion-sync-design.md#Source deletes]
engine: [spark]
---

Delta and Iceberg can delete rows without rewriting a data file, by recording which rows of the file are deleted. A companion honours those records. **No row the source has deleted is returned**, in either mode below.

## Two modes

Set by `spark.indextables.companion.deletes.readTime`. A companion keeps the mode it was first built with.

| | Read-time | Build-time |
|---|---|---|
| Deleted rows in the index | Present, filtered out when reading | Never indexed |
| A new delete in the source | Recorded at the next sync, usually without re-indexing | The affected file is re-indexed at the next sync |
| Best for | Sources with frequent deletes | Sources with rare deletes, or where the smallest index matters |

**Read-time.** Each index file records the delete information of the source files it covers, and reads apply it. When a later sync finds more rows deleted, it records the new information without rebuilding the index. If a delete is undone, so a previously deleted row is live again, the affected files are re-indexed.

**Build-time.** Deleted rows are left out when indexing, and the count is recorded. When a file's deletes change, the file is re-indexed. A file whose rows are all deleted is not indexed at all.

## By source

| Source delete | Handling |
|---|---|
| Delta deletion vectors | Either mode |
| Iceberg position-delete files (Parquet) | Either mode |
| Iceberg deletion vectors (format v3, Puffin) | Either mode |
| Iceberg equality-delete files (Parquet) | Always applied at build time |
| Iceberg delete files in Avro or ORC | Not supported: the sync fails, naming the file |

Because equality deletes are applied when indexing, a source whose equality deletes change often causes its older files to be re-indexed on most syncs.

## Between syncs

A delete made in the source after the last sync is not yet known to the companion. Sync to pick it up. Deletes are never applied "live" from the source at query time; read-time mode applies the delete information recorded at the last sync.

## Compatibility with 0.5.5

Recording deletes raises the companion's protocol version, so that IndexTables 0.5.5, which does not understand them, refuses operations that would be wrong instead of returning deleted rows. A companion with read-time deletes off whose source has no deletes keeps the older protocol and remains fully readable by 0.5.5. Details are in [Migrate from 0.5.x](/guides/migrate/from-0-5/).
