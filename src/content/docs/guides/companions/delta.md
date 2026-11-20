---
title: Delta companions
description: Build a companion over a Delta table by path or by name, with incremental sync, deletion vectors and column mapping.
sidebar: { order: 3 }
lid:
  reviewed: a865437
  fingerprint: 73375e6946f1
  class: derived
  cites: [SPARK-SYNC-DLT, SPARK-SYNC-INC, SPARK-SYNC-WM, SPARK-SYNC-DEL, CORE-SRD-DLT, CORE-SRD-DEL]
engine: [spark]
---

## By path

```sql
BUILD INDEXTABLES COMPANION FOR DELTA 's3://my-bucket/events'
  AT LOCATION 's3://my-bucket/events/_indextables';
```

A companion may live inside the Delta table's directory, as here, or anywhere else.

## By name

```sql
BUILD INDEXTABLES COMPANION FOR DELTA 'main.logs.events'
  CATALOG 'unity'
  AT LOCATION 's3://my-bucket/indexes/events';
```

A name is resolved to a location, and to credentials for it, through the configured table credential provider. With Unity Catalog this is how a companion is built over a governed table without static keys. See [Unity Catalog](/guides/catalogs/unity-catalog/).

## Keeping it current

Run the same command again. The companion remembers the Delta version it last covered, its *watermark*, and applies only the commits since then: files added are indexed, and index files whose source files were removed are invalidated.

It reconciles against the whole table instead when the gap is larger than `companion.sync.maxIncrementalCommits`, or when Delta's log cleanup has removed a commit it needs. To start from a specific version and apply only later changes:

```sql
BUILD INDEXTABLES COMPANION FOR DELTA 's3://my-bucket/events'
  FROM VERSION 1200
  AT LOCATION 's3://my-bucket/events/_indextables';
```

See [keep a companion in sync](/guides/companions/sync/) for scheduling, streaming and failure behavior.

## Deletes and updates

Rows deleted through Delta deletion vectors are never returned. See [row-level deletes](/guides/companions/deletes/) for the two ways this is done.

## Column mapping

Tables with column mapping in `name` or `id` mode are supported. Columns are indexed and queried under their logical names, so renames in Delta behave as you expect.

## Scale

The Delta log is planned with a listing on the driver, and its checkpoints and commit files are read in executor tasks. The driver does not hold the log's contents or the list of live files, so very large tables do not need a large driver.

## What is refused

A sync fails with `IndexTablesUnsupportedException`, naming the cause, when the source:

- needs a Delta reader version above 3;
- uses a reader feature other than `columnMapping`, `timestampNtz`, `v2Checkpoint`, `vacuumProtocolCheck`, `deletionVectors` and the Variant features;
- uses a column-mapping mode other than `none`, `name` or `id`;
- has a `timestamp_ntz` partition column.

A sync also fails before committing anything if the source's table identity changed, or if its version is behind the companion's watermark. Both mean the path now holds a different table.

A `variant` column must be excluded with `EXCLUDE COLUMNS`.
