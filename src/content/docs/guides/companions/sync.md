---
title: Keep a companion in sync
description: Incremental sync, the watermark, scheduled and streaming runs, and what happens when a sync is interrupted.
sidebar: { order: 5 }
lid:
  reviewed: a865437
  fingerprint: bc8e41c620b3
  class: derived
  cites: [SPARK-SYNC-INC, SPARK-SYNC-WM, SPARK-SYNC-DIFF, SPARK-SYNC-STRM, SPARK-SYNC-CMT, SPARK-SYNC-PLAN]
  docs: [spark/companion-sync/companion-sync-design.md#Watermark, spark/companion-sync/companion-sync-design.md#Streaming]
engine: [spark]
---

A companion reflects its source as of its last sync. Rows added to the source since then are not found through the companion until the next sync; rows deleted since then may be handled at read time, see [row-level deletes](/guides/companions/deletes/).

Syncing is the same command as building. It is safe to run as often as you like: when nothing changed it reports `no_action`.

## Incremental and full

| | Incremental | Full reconciliation |
|---|---|---|
| Reads | Source changes since the watermark | The source's whole file list |
| Used when | A Delta or Iceberg companion has a watermark | First build; Parquet sources; the watermark's version is gone; the gap is too large; you pass `FULL` |
| Result | Identical | Identical |

Both index new files and invalidate index files whose source files were removed. Neither re-indexes files that are already covered.

## The watermark

The watermark is the Delta version or Iceberg snapshot the companion covers. It is stored in the companion's own transaction log.

- It advances only in a sync's **last** commit, after every earlier commit succeeded.
- A sync that fails leaves it where it was.

## Interrupted syncs

A large sync makes several commits. If it stops part-way, run it again. It resumes from the watermark; files already committed by the interrupted run are not indexed again. No row is duplicated and none is skipped.

## Run it on a schedule

Run the command from any scheduler. Use `DRY RUN` to see what a sync would do:

```sql
BUILD INDEXTABLES COMPANION FOR DELTA 's3://my-bucket/events'
  AT LOCATION 's3://my-bucket/events/_indextables'
  DRY RUN;
```

## Run it continuously

```sql
BUILD INDEXTABLES COMPANION FOR ICEBERG 'analytics.events'
  CATALOG 'prod' TYPE 'rest'
  AT LOCATION 's3://my-bucket/indexes/events'
  WITH STREAMING POLL INTERVAL 30 SECONDS;
```

The command stays running on the calling thread. On each poll it checks the source's version or snapshot and syncs when it has moved. A Parquet directory has no version, so every poll syncs it.

- Each cycle is a complete sync with fresh catalog connections and credentials, so the loop survives credential rotation and source rewrites.
- Driver memory does not grow over time; only counters are kept between cycles.
- Failed cycles back off. After `companion.stream.maxConsecutiveErrors` failures in a row the loop ends with an error.
- The loop ends without error when its thread is interrupted or the Spark context stops.
- A streaming run returns no rows. It reports through metrics and logs.

## Limiting what is indexed

```sql
BUILD INDEXTABLES COMPANION FOR DELTA 's3://my-bucket/events'
  WHERE day >= '2026-10-01'
  AT LOCATION 's3://my-bucket/events/_indextables';
```

`WHERE` takes a predicate on the source's partition columns. The predicate is remembered by the companion; `WHERE ALL` clears it.

With a `WHERE`, index files of partitions outside the predicate are left as they are. Add `INVALIDATE ALL PARTITIONS` to compare every index file of the companion with the scoped source, so that index files outside the predicate are invalidated too. It forces a full reconciliation.

## Tuning

| Key (`spark.indextables.companion.`) | Controls |
|---|---|
| `sync.batchSize` | Indexing groups per Spark job |
| `sync.maxConcurrentBatches` | Jobs running at once |
| `writerHeapSize` | Memory for building one index file |
| `schedulerPool` | The Spark fair-scheduler pool sync jobs run in |

Defaults are in the [configuration reference](/reference/configuration/).

## After dropping partitions

`DROP INDEXTABLES PARTITIONS` on a companion clears its watermark, so the next sync reconciles fully and re-indexes the dropped partitions if they still exist in the source. To keep them out, use a `WHERE` clause on the build.
