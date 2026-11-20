---
title: Counts, sums and grouped results
description: Aggregates computed in the index, bucket functions for histograms, and what happens when an aggregate cannot be pushed.
sidebar: { order: 3 }
lid:
  reviewed: a865437
  fingerprint: 6f122fbab313
  class: derived
  cites: [SPARK-RD-AGG, SPARK-RD-BKT, CORE-AGG-EXEC, CORE-AGG-META, CORE-AGG-BKT, CORE-AGG-CAP, SPARK-CFG-ACC, DF-AD-AGG]
  docs: [spark/read/read-design.md#Aggregate Pushdown, spark/read/read-design.md#Bucket Functions]
engine: [spark, datafusion]
---

Aggregates are computed inside the index, from fast data, without materialising the matching rows.

```sql
SELECT service, count(*) AS errors, max(latency_ms) AS worst
FROM events
WHERE message indexquery 'timeout' AND day = DATE '2026-11-01'
GROUP BY service;
```

## What is pushed

| | Spark | DataFusion |
|---|---|---|
| `COUNT(*)`, `COUNT(col)` | Yes | Yes |
| `SUM`, `MIN`, `MAX` | Yes | Yes |
| `AVG` | Yes, as `SUM` and `COUNT` | No |
| `GROUP BY` columns | Yes | Yes |
| `GROUP BY` bucket functions | Yes | No |
| `COUNT(DISTINCT …)`, aggregates over expressions, `percentile` | No | No |

The engine always performs the final combine, so results are the same as if it had computed everything itself.

Some aggregates need no index at all. A count with no filter, or with a filter on partition columns only, is answered from row counts in the transaction log. An ungrouped `MIN` or `MAX` under the same conditions is answered from per-file bounds.

## Bucket functions

Three functions group rows into buckets. In Spark they are pushed when used as `GROUP BY` expressions.

| Function | Groups by |
|---|---|
| `indextables_date_histogram(col, interval[, offset[, min_doc_count]])` | Fixed time intervals. `interval` is a string such as `'5m'`, `'1h'` or `'1d'` (units `ms`, `s`, `m`, `h`, `d`) |
| `indextables_histogram(col, interval[, offset[, min_doc_count]])` | Fixed numeric intervals |
| `indextables_range(col, name1, from1, to1, …)` | Named ranges `[from, to)`. A `NULL` bound is open-ended |

```sql
SELECT indextables_date_histogram(ts, '1h') AS hour, count(*)
FROM events
WHERE message indexquery 'timeout'
GROUP BY indextables_date_histogram(ts, '1h')
ORDER BY hour;
```

A bucket is returned only when at least one row falls in it. Arguments must be literals; anything else fails at analysis with the parameter, the value and the accepted form.

## When an aggregate cannot be pushed

An aggregate that the engine computes itself has to read every matching row, which on a large table is far slower than the index. **In Spark, such an aggregate is refused by default**, so a slow query does not go unnoticed. The error names the table, the column, the reason and the setting to change.

Common reasons:

| Reason | Fix |
|---|---|
| The column has no fast data | Add it to `indexing.fastfields` when writing |
| `GROUP BY` on a tokenized text column | Group by a whole-value column instead |
| A filter the index cannot answer exactly sits under the aggregate | Change the filter, or allow the fallback |
| The function is not one of those above | Allow the fallback |

To let Spark compute it instead:

```python
spark.conf.set("spark.indextables.acceleration.policy.aggregation", "warn")   # or "fallback"
```

A Spark-computed aggregate is correct. Fast mode's row limit never applies to the input of an aggregate.

`SELECT DISTINCT` and `dropDuplicates` are not refused. Where the index can answer them exactly they are pushed; otherwise Spark computes them.

In DataFusion there is no policy: an aggregate that is not pushed is computed by DataFusion. Install the pushdown with `install_aggregate_pushdown` when you build the session; see [the adapter guide](/guides/datafusion/adapter/).
