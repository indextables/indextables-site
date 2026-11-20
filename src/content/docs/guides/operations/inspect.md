---
title: Inspect tables and the cluster
description: DESCRIBE commands for a table's log, state and index sizes, and for storage, environment and jobs across the cluster.
sidebar: { order: 2 }
lid:
  reviewed: a865437
  fingerprint: c3b993ba3fc2
  class: derived
  cites: [SPARK-OPS-DTL, SPARK-OPS-DST, SPARK-OPS-DCS, SPARK-OPS-DDC, SPARK-OPS-DSS, SPARK-OPS-DENV, SPARK-OPS-DMJ, SPARK-OPS-EXEC, SPARK-OPS-STATUS, SPARK-OPS-ROOT]
engine: [spark]
---

## A table

```sql
-- The actions recorded in the log; INCLUDE ALL shows more of its history
DESCRIBE INDEXTABLES TRANSACTION LOG logs.events;
DESCRIBE INDEXTABLES TRANSACTION LOG logs.events INCLUDE ALL;

-- The table's current state
DESCRIBE INDEXTABLES STATE logs.events;

-- What takes the space inside the index, by component and field
DESCRIBE INDEXTABLES COMPONENT SIZES logs.events WHERE day = '2026-11-01';
```

`COMPONENT SIZES` is the tool for index-size questions: it breaks the index down by component and field, so you can see which column to index differently.

## The cluster

```sql
DESCRIBE INDEXTABLES DISK CACHE;       -- the disk cache on each executor
DESCRIBE INDEXTABLES STORAGE STATS;    -- object-storage requests and bytes per process
DESCRIBE INDEXTABLES ENVIRONMENT;      -- versions and effective settings per process
DESCRIBE INDEXTABLES MERGE JOBS;       -- background merges
DESCRIBE INDEXTABLES PREWARM JOBS;     -- background prewarms
```

Cluster-wide commands report one row per process: the driver first, then executors by ID, each with its host. In local mode the driver and executor are one process and are counted once.

The driver confirms that each executor answered. An executor that did not answer within `operations.fanout.timeoutSeconds` appears as an explicit `unreachable` row; it is never silently left out.

## Reading results from a program

Commands return a `status` column with fixed lower-case values such as `success`, `no_action`, `dry_run` and `unreachable`, and a separate human-readable `message`. Automation should test `status`, not parse `message`.

## Alternate source locations for a companion

A companion records where its source table is. If the source is also available at another location, such as a replica in another region, register it under a name and select it when reading:

```sql
SET INDEXTABLES TABLE ROOT 'eu' = 's3://replica-eu/events' AT logs.events_idx;
DESCRIBE INDEXTABLES TABLE ROOTS AT logs.events_idx;
UNSET INDEXTABLES TABLE ROOT 'eu' AT logs.events_idx;
```

```python
spark.read.format("indextables") \
     .option("spark.indextables.companion.tableRootDesignator", "eu") \
     .load("s3://my-bucket/indexes/events")
```

Overriding the source location directly on a read is refused; use a registered root.

## Profiling

The aggregate profiler and per-query traces are described under [profiling and traces](/guides/operations/profiling/).
