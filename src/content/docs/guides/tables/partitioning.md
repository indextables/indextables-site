---
title: Partitioning and pruning
description: How partition columns work, what gets skipped at query time, and how to choose partition columns.
sidebar: { order: 3 }
lid:
  reviewed: a865437
  fingerprint: 2138894b584a
  class: derived
  cites: [CORE-PE-LAYOUT, CORE-PE-VAL, CORE-LOG-PRUNE, CORE-LOG-SKIP, SPARK-RD-PART, DF-AD-PART]
engine: [spark, datafusion]
---

A query skips work at three levels, from coarsest to finest:

| Level | What is skipped | Based on |
|---|---|---|
| Partition pruning | Every file of a partition that cannot match | Partition values recorded in the transaction log |
| Data skipping | Individual files that cannot match | Per-file minimum and maximum of each column |
| Index lookup | Rows that do not match, inside the remaining files | The index |

The first two happen while planning, without opening any index file.

## Declare partitions when you write

```python
df.write.format("indextables").partitionBy("day", "region").mode("append").save(root)
```

```sql
CREATE TABLE logs.events (ts TIMESTAMP, day DATE, region STRING, message STRING)
USING indextables
PARTITIONED BY (day, region)
LOCATION 's3://my-bucket/events';
```

Partition columns are fixed by the first write. Changing them needs a full overwrite with `overwriteSchema=true`.

## What partition columns are

Partition columns are not stored in the index. Each file belongs to exactly one combination of partition values, recorded in the transaction log and in the file's path. You can still select and filter on them like any column.

Because of that:

- A filter on a partition column costs nothing per row.
- A partition column cannot be the target of `indexquery`.
- Maintenance commands take `WHERE` predicates on partition columns only.

## Choosing partition columns

- **Partition by what almost every query filters on**, usually a date.
- **Keep the number of partitions modest.** Each partition holds its own files; thousands of tiny partitions mean many small files. Daily partitions are usually better than hourly.
- **Do not partition by a high-cardinality ID.** The index already makes lookups by ID fast.

## Data skipping

For each file the log records the minimum and maximum of its columns. A filter such as `ts >= '2026-11-01'` skips files whose maximum is earlier. Skipping works best when files hold narrow ranges, which appending in time order gives you naturally.

## In DataFusion

The adapter prunes the same way: partition and file statistics are applied before DataFusion partitions are planned.
