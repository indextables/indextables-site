---
title: Merge small index files
description: MERGE SPLITS combines small splits into larger ones so queries open fewer files.
sidebar: { order: 2 }
lid:
  reviewed: a865437
  fingerprint: aae215937114
  class: derived
  cites: [SPARK-MNT-MRG, SPARK-WR-MOW, CORE-BLD-MRG]
  docs: [spark/maintenance/maintenance-design.md#Grammar and options]
engine: [spark]
---

Each write adds at least one index file, a *split*, per partition and task. Many small writes leave many small splits, and a query has to open each one that might match. Merging combines them.

```sql
MERGE SPLITS logs.events;

MERGE SPLITS logs.events
  WHERE day >= '2026-11-01'
  TARGET SIZE 2G
  MAX DEST SPLITS 50;
```

## Syntax

```text
MERGE SPLITS <table>
  [WHERE <partition predicate>]
  [TARGET SIZE <size>]
  [MAX DEST SPLITS <n>]
  [MAX SOURCE SPLITS PER MERGE <n>]
```

| Clause | Meaning |
|---|---|
| `WHERE` | Merge only the partitions matching a partition predicate |
| `TARGET SIZE` | The size merged splits aim for: bytes, or a number followed by `M` or `G` |
| `MAX DEST SPLITS` | Stop after producing this many merged splits. Use it to bound one run |
| `MAX SOURCE SPLITS PER MERGE` | The most splits combined into one |

Clauses must appear in this order.

## What it does

- Splits are merged **within a partition**, never across partitions.
- A merge is a commit that replaces the source splits with the merged one. Readers see either the old set or the new set, never a mixture.
- A merge changes no rows, and nothing is re-delivered to streaming readers.
- The replaced files stay on storage until [`PURGE`](/guides/maintenance/purge/) removes them.
- A merge that conflicts with a concurrent change to the same splits fails its conflict check and can be run again.

Merging works on standalone tables and on companions.

## Merge automatically after writes

Instead of scheduling `MERGE SPLITS`, let writes trigger it:

```python
spark.conf.set("spark.indextables.mergeOnWrite.enabled", "true")
```

After a successful write, small splits are merged in the background. A failed merge never fails the write. Settings are under `mergeOnWrite.*` in the [configuration reference](/reference/configuration/).

## Watching merges

```sql
DESCRIBE INDEXTABLES MERGE JOBS;
```

lists background merges and their state.

## How often

Merge the partitions that are still being written to, on a schedule that matches how often they are written. Partitions that no longer change need merging once.
