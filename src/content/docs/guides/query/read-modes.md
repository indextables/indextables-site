---
title: Fast and exact read modes
description: Fast mode limits how many rows a query hands back to you. Exact mode never does. What each guarantees.
sidebar: { order: 4 }
lid:
  reviewed: a865437
  fingerprint: 0946b36c8ac8
  class: derived
  cites: [SPARK-RD-MODE, SPARK-RD-LIM, CORE-SRCH-MODE]
  docs: [spark/read/read-design.md#Read Modes and the Fast-Mode Cap]
engine: [spark]
---

IndexTables is often used interactively: search, look at some rows, refine. For that, returning a bounded number of rows quickly is better than returning millions slowly. Spark reads therefore have two modes.

| | Fast (default) | Exact |
|---|---|---|
| Rows returned to you | At most a limit, `read.defaultLimit` | All of them |
| Tells you when it stopped early | Yes | Not applicable |
| Input to writes, caches, joins, aggregates | Complete | Complete |
| Filters and aggregates | Correct | Correct |

## What fast mode limits, and what it never limits

The limit applies only to rows a query **returns to a client**: `show()`, `collect()`, `toPandas()`, a result fetched over Spark Connect, and similar.

It never applies where another computation consumes the rows, because there a partial input would give a wrong answer:

- aggregates, joins, `DISTINCT`, window functions and sorts;
- `df.cache()`, `persist()` and `checkpoint()`;
- writes: `df.write`, `CREATE TABLE … AS SELECT`, `INSERT … SELECT`;
- subqueries;
- `df.rdd`, `foreach` and `foreachPartition`.

So `spark.table("events").where(…).count()` is always the true count, and copying a table always copies every row, in either mode.

Results that are computed, such as the output of a sort, join or aggregate, are complete by default. Set `read.capComputedResults` if you want the limit applied to those outputs too.

The limit is per query, not per file or task, so the same query returns the same number of rows on any cluster. A query over a union of tables returns at most the limit in total.

## Choosing a mode

```python
# One read
df = spark.read.format("indextables").option("spark.indextables.read.mode", "exact").load(root)

# The session
spark.conf.set("spark.indextables.read.mode", "exact")
```

Use exact mode for jobs whose output is the rows themselves, such as exports that collect to the driver. Use fast mode for interactive search.

A `LIMIT` in your query is honoured in both modes and pushed to the index.

## DataFusion

The DataFusion adapter has no fast mode. It always returns complete results; use `LIMIT`.

The value of the default limit is in the [configuration reference](/reference/configuration/).
