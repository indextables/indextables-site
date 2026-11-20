---
title: Filters and pushdown
description: Which SQL filters the index answers, which the engine re-checks, and how to control what happens when the index cannot answer one.
sidebar: { order: 2 }
lid:
  reviewed: a865437
  fingerprint: d7fbf24f3bb9
  class: derived
  cites: [SPARK-RD-FLT, SPARK-RD-ACC, CORE-QRY-CMP, CORE-QRY-NULL, CORE-QRY-TREE, SPARK-CFG-ACC, DF-AD-PUSH]
  docs: [spark/read/read-design.md#Acceleration Policy Decision Points]
engine: [spark, datafusion]
---

Ordinary SQL predicates are first-class in IndexTables. You do not need `indexquery` to benefit from the index: equality, `IN`, range and null tests are handed to it automatically.

```sql
SELECT * FROM events
WHERE trace_id = '7f3a9c'                       -- exact match
  AND status IN (500, 502, 503)                 -- set membership
  AND ts BETWEEN '2026-11-01' AND '2026-11-02'  -- range
  AND user_id IS NOT NULL;                      -- presence
```

## What happens to each filter

Every part of a `WHERE` clause ends up in one of three places:

| Outcome | Meaning | Engine re-checks? |
|---|---|---|
| **Answered by the index** | The index returns exactly the matching rows | No |
| **Narrowed by the index** | The index returns a superset; the engine filters it | Yes |
| **Evaluated by the engine** | The index is not used for this predicate | Yes |

The result is always correct. What changes is how much is read.

| Predicate | On | Outcome |
|---|---|---|
| `=`, `IN` | Whole-value string, number, boolean, date, timestamp | Answered by the index |
| `<`, `<=`, `>`, `>=`, `BETWEEN` | Columns with fast data | Answered by the index |
| `IS NULL`, `IS NOT NULL` | Columns with fast data | Answered by the index |
| Any of the above | Partition columns | Answered while planning, from the transaction log |
| `=` | Tokenized text column | Narrowed by the index, then re-checked |
| `LIKE`, functions, arithmetic, casts | Any | Evaluated by the engine |
| `AND`, `OR`, `NOT` | Combinations of the above | Pushed as a tree; each leaf decided on its own |

To search inside text, use [`indexquery`](/guides/query/indexquery/) instead of `LIKE`.

## Fast data

Range filters, null tests and aggregates read a column's *fast data*: a compact per-row form of its values. Standalone tables give every column fast data unless you say otherwise. If a column lacks it, a range filter on that column cannot be answered by the index.

Control it at write time with `indexing.fastfields` and `indexing.nonfastfields`. See [field types](/guides/tables/field-types/).

## When the index cannot answer

For some operations, falling back to the engine is slow enough that you may prefer to know. The *acceleration policy* sets what happens when the index cannot answer a range filter, a null test or an aggregate.

| Policy | Effect |
|---|---|
| `fallback` | The engine computes it. Nothing is logged |
| `warn` | The engine computes it, a warning is logged once per table, column and kind, and a metric is incremented |
| `refuse` | The query fails with an error naming the table, the column, the reason and the setting that would allow the fallback |

Set it globally, per kind of operation, or per column:

| Key | Scope |
|---|---|
| `acceleration.policy` | Everything |
| `acceleration.policy.rangeFilter`, `.nullFilter`, `.aggregation` | One kind of operation |
| `acceleration.column.<column>.policy` | One column |

The most specific setting wins. Aggregation has a stricter default than filters; see [aggregates](/guides/query/aggregates/). Defaults are in the [configuration reference](/reference/configuration/).

Predicates the index was never going to answer, such as `LIKE` or a function call, are evaluated by the engine without a warning.

## Companion tables

A companion can leave columns out of its index. Filters on those columns are still pushed down: the core evaluates comparisons, `IN`, null tests and ranges while it reads the source Parquet rows, and skips row groups using the Parquet footer statistics. This applies to integer, boolean, date and binary-collated string columns; other forms stay with the engine.

## In DataFusion

The adapter reports each filter to DataFusion as exact, inexact or unsupported, which is DataFusion's form of the three outcomes above. There is no acceleration policy: DataFusion always evaluates what the index does not answer.

## See what was pushed

`EXPLAIN` shows the pushed filters on the IndexTables scan. Predicates that remain in a `Filter` node above the scan are evaluated by Spark.
