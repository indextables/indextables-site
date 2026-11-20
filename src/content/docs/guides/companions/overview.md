---
title: Index a table you already have
description: What a companion table is, how to build one over Delta, Iceberg or Parquet, and how to query it.
sidebar: { order: 1 }
lid:
  reviewed: a865437
  fingerprint: 135255a2fcb3
  class: derived
  cites: [SPARK-SYNC-CMD, SPARK-SYNC-OUT, SPARK-SYNC-META, CORE-CF-MAN, CORE-CF-FAST, CORE-SRCH-CMP]
  docs: [spark/companion-sync/companion-sync-design.md#Grammar]
engine: [spark, datafusion]
---

A **companion** is an index over an existing table. Your rows stay in the Delta, Iceberg or Parquet files they are in. The companion holds a search index that points into those files, in its own location with its own transaction log.

Use a companion when the table already exists and other tools depend on it. Use a [standalone table](/guides/tables/write/) when IndexTables can own the data.

## Build one

One command builds a companion, and running it again brings the companion up to date.

```sql
BUILD INDEXTABLES COMPANION FOR DELTA 's3://my-bucket/events'
  AT LOCATION 's3://my-bucket/indexes/events';
```

| Source | Guide |
|---|---|
| Delta table, by path or by name | [Delta companions](/guides/companions/delta/) |
| Iceberg table in a REST, Glue or Hive Metastore catalog | [Iceberg companions](/guides/companions/iceberg/) |
| Directory of Parquet files | [Parquet companions](/guides/companions/parquet/) |

## Query it

Read the companion's location like any IndexTables table. Search, filters and aggregates work as they do on a standalone table.

```python
events = spark.read.format("indextables").load("s3://my-bucket/indexes/events")
events.where("message indexquery 'timeout' AND day = '2026-11-01'").show()
```

To query a companion under its source table's name, see the [companion lookup catalog](/guides/catalogs/companion-lookup/).

A query uses the index to find matching rows, then reads those rows from the source files. So:

- **The reader needs credentials for both** the companion's location and the source table's storage. See [credentials for sources](/guides/storage/s3/).
- **Columns left out of the index are still returned** and can still be filtered; the filter is applied while reading the source.

## Common clauses

```sql
BUILD INDEXTABLES COMPANION FOR DELTA 's3://my-bucket/events'
  INCLUDE COLUMNS ('ts', 'service', 'user_id', 'message')
  INDEXING MODES ('message':'text')
  FASTFIELDS MODE HYBRID
  WHERE day >= '2026-10-01'
  AT LOCATION 's3://my-bucket/indexes/events'
  DRY RUN;
```

| Clause | Effect |
|---|---|
| `INCLUDE COLUMNS` / `EXCLUDE COLUMNS` | Which columns are indexed. The rest stay readable from the source |
| `INDEXING MODES` | How each column is indexed, as for [standalone tables](/guides/tables/field-types/), plus compact modes for long strings |
| `FASTFIELDS MODE` | Where fast data for filters and aggregates comes from; see below |
| `HASHED FASTFIELDS INCLUDE` / `EXCLUDE` | Which string columns get a compact hash for grouping |
| `WHERE` | Index only the partitions matching a partition predicate. `WHERE ALL` clears a stored predicate |
| `TARGET INPUT SIZE`, `WRITER HEAP SIZE` | How much source data goes into one index file, and the memory to build it |
| `FULL` | Reconcile against the whole source instead of syncing incrementally |
| `DRY RUN` | Report what would be done and change nothing |
| `WITH STREAMING POLL INTERVAL` | Keep running and sync on an interval. See [keep a companion in sync](/guides/companions/sync/) |

Clauses must appear in the order of the [SQL reference](/reference/sql-commands/).

### Fast-field modes

| Mode | Fast data in the index | Trade-off |
|---|---|---|
| `HYBRID` | Numbers, booleans, dates and IP addresses. Strings are served from the source Parquet | Smaller index; string aggregates read the source |
| `DISABLED` | Everything, strings included | Largest index; aggregates never touch the source |
| `PARQUET_ONLY` | Nothing; all served from the source Parquet | Smallest index |

### Compact modes for long strings

Companions accept indexing modes that keep the index small when a column holds long or highly unique strings:

| Mode | Keeps |
|---|---|
| `exact_only` | A hash of the whole value. Answers `=` and `IN`, nothing else |
| `text_uuid_exactonly` | Tokenized text with UUIDs removed, plus one hash per UUID so they can still be found exactly |
| `text_uuid_strip` | Tokenized text with UUIDs removed |
| `text_custom_exactonly:<regex>`, `text_custom_strip:<regex>` | The same, for a pattern you supply |
| `text_and_string` | Both words and the whole value |

## What the command returns

One row: the companion and source locations, a `status` of `success`, `no_action` or `dry_run`, the source version now covered, counts of index files created and invalidated, source files indexed, bytes read and written, and the duration.

## The source must not change underneath

A companion's index points at specific source files. Those files must stay byte-identical for as long as an index that references them can be queried.

- Normal Delta and Iceberg writes are fine: they add and remove files, and the next sync follows.
- **Do not rewrite or delete referenced files outside the table format**, and do not vacuum files that a not-yet-synced companion still references. Sync first, then clean up.
- A file replaced by another of the same size cannot be detected. That needs a rebuild.

## Limits

- Variant columns must be excluded with `EXCLUDE COLUMNS`.
- `CHAR`, `VARCHAR` and collated string columns are indexed as plain strings, so comparisons can differ from Spark's for padded or non-binary-collated values.
- Companions cannot be read as a stream.
- Building and syncing run in Spark. DataFusion reads companions.
