---
title: Caches and prewarm
description: What is cached and where, how to give executors a local disk cache, and how to fill it before queries arrive.
sidebar: { order: 1 }
lid:
  reviewed: a865437
  fingerprint: cc71d04968b7
  class: derived
  cites: [CORE-CACHE-L1, CORE-CACHE-L2, CORE-CACHE-PRE, CORE-CACHE-PERS, SPARK-OPS-PRE, SPARK-OPS-PJOB, SPARK-OPS-FLUSH, SPARK-RD-PRE, CORE-LOG-CACHE]
  docs: [core/cache/cache-design.md#L2 disk cache, core/cache/cache-design.md#Prewarm]
engine: [spark]
---

Index files live in object storage, which is slow to reach compared with local disk. Caches make the second query against a table much cheaper than the first.

## What is cached

| Cache | Holds | Where | Survives restart |
|---|---|---|---|
| Searchers | Opened index files, ready to query | Executor memory | No |
| Footers and metadata | The small parts needed to open an index file | Executor memory | No |
| Byte cache (L1) | Recently read ranges of index files | Executor memory | No |
| Disk cache (L2) | Ranges of index files | Executor local disk | Yes |
| Log state | The table's file list at a version | Driver and executor memory, spilling to disk | No |

Cache sizing is being reworked upstream, so sizes and defaults are not stated here. They are in the [configuration reference](/reference/configuration/) under `cache.*` and `transaction.cache.*`.

## Give executors a disk cache

The disk cache is what makes repeated queries fast, so point it at fast local storage such as NVMe instance disks.

```text
spark.indextables.cache.disk.path=/local_disk0/indextables-cache
```

- When neither a path nor an enablement setting is given, a writable `/local_disk0` is used automatically. Otherwise the disk cache is off until configured.
- Executors on one machine that share a directory share one cache.
- Cluster drivers hold no disk cache.
- Set cache keys in the Spark configuration at start-up. They are read once per process and cannot be changed per query.

## Prewarm

Prewarming reads parts of a table's index files into the disk cache ahead of time, so the first queries do not pay for object storage.

```sql
-- Everything needed for term lookups on all fields
PREWARM INDEXTABLES CACHE logs.events;

-- Chosen components, fields and partitions
PREWARM INDEXTABLES CACHE logs.events
  FOR SEGMENTS (TERM, POSTINGS, FASTFIELD)
  ON FIELDS (message, service)
  WITH PERWORKER PARALLELISM OF 4
  WHERE day >= '2026-11-01';
```

```text
PREWARM INDEXTABLES CACHE <table>
  [FOR SEGMENTS (<component>, …)]
  [ON FIELDS (<field>, …)]
  [WITH PERWORKER PARALLELISM OF <n>]
  [WHERE <partition predicate>]
  [ASYNC MODE]
```

Clauses must appear in this order.

| Component | Warms | Needed for |
|---|---|---|
| `TERM` | The term dictionary | Any search or exact match |
| `POSTINGS` | Which rows contain each term | Any search or exact match |
| `FASTFIELD` | Fast data | Range filters and aggregates |
| `STORE` | Stored rows | Returning rows from a standalone table |

Without `FOR SEGMENTS`, `TERM` and `POSTINGS` are warmed.

On a companion, prewarm warms the index components and the matching ranges of the source Parquet files. `FASTFIELD` includes fast data that is served from Parquet.

When no disk cache applies, prewarm reports `not_applicable` instead of doing work that would be thrown away.

### In the background

```sql
PREWARM INDEXTABLES CACHE logs.events FOR SEGMENTS (TERM, STORE) ASYNC MODE;
-- returns a job_id

DESCRIBE INDEXTABLES PREWARM JOBS;

WAIT FOR INDEXTABLES PREWARM JOBS logs.events TIMEOUT 600;
WAIT FOR INDEXTABLES PREWARM JOBS JOB '<job_id>' TIMEOUT 600;
```

`WAIT` returns when the jobs finish or the timeout, in seconds, passes. A timeout leaves the job running.

### On first read

A read can start a prewarm of its table in the background:

```python
spark.conf.set("spark.indextables.prewarm.enabled", "true")
```

`prewarm.segments`, `prewarm.fields` and `prewarm.partitionFilter` choose what is warmed, and `prewarm.catchUpNewHosts` warms executors that join later.

## Inspect and clear

```sql
DESCRIBE INDEXTABLES DISK CACHE;                         -- the disk cache on each executor
FLUSH INDEXTABLES SEARCHER CACHE;                        -- drop opened searchers
FLUSH INDEXTABLES DISK CACHE;                            -- empty the disk cache
INVALIDATE INDEXTABLES TRANSACTION LOG CACHE FOR logs.events;
```

These commands reach the driver and every live executor, and report a row for each. An executor that could not be reached is reported as such; a command that changes state fails if any target was not reached.

You should rarely need to flush. Index files are immutable and cached by identity, so a cache never serves stale data for a table that changed.

## Log-state memory

The driver and executors keep the table's file list in memory, bounded by `transaction.cache.memory.maxSize`, and spill to local disk beyond that. The spill is private to each process and removed at shutdown. A spill failure never makes a query wrong; it is counted.
