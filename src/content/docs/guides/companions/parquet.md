---
title: Parquet companions
description: Build and refresh a companion over a directory of Parquet files.
sidebar: { order: 2 }
lid:
  reviewed: a865437
  fingerprint: aab2bdde6b24
  class: derived
  cites: [SPARK-SYNC-PQ, SPARK-SYNC-CMD, SPARK-SYNC-PART, CORE-SRD-PQ]
engine: [spark]
---

```sql
BUILD INDEXTABLES COMPANION FOR PARQUET 's3://my-bucket/raw/events'
  INDEXING MODES ('message':'text')
  FASTFIELDS MODE HYBRID
  AT LOCATION 's3://my-bucket/indexes/events';
```

The source is a directory of Parquet files. Hive-style subdirectories such as `day=2026-11-01/` become partition columns, in nesting order.

## Schema

The schema is read from the Parquet files. To take it from one specific file, name it:

```sql
BUILD INDEXTABLES COMPANION FOR PARQUET 's3://my-bucket/raw/events'
  SCHEMA SOURCE 's3://my-bucket/raw/events/day=2026-11-01/part-0000.parquet'
  AT LOCATION 's3://my-bucket/indexes/events';
```

## Refreshing

A Parquet directory has no version history, so every run compares the directory with the companion: new files are indexed, and index files whose source files are gone are removed. Run the same command again to refresh, or keep it running:

```sql
BUILD INDEXTABLES COMPANION FOR PARQUET 's3://my-bucket/raw/events'
  AT LOCATION 's3://my-bucket/indexes/events'
  WITH STREAMING POLL INTERVAL 5 MINUTES;
```

## Limits

- Files must not be modified in place. Replace a file by writing a new one under a new name.
- A Variant column must be excluded with `EXCLUDE COLUMNS`.
- There are no row-level deletes for a plain Parquet directory; removing rows means removing or replacing files.
