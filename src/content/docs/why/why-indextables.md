---
title: Why IndexTables
description: The problem it solves, how it differs from scanning a lakehouse table or running a search cluster, and when not to use it.
sidebar: { order: 1 }
lid:
  reviewed: a865437
  fingerprint: 1f3355b5823e
  class: authored
  cites: [SPARK-RD-IQ, SPARK-RD-FLT, SPARK-RD-AGG, SPARK-SYNC-CMD, CORE-STO-OP]
engine: [spark, datafusion]
---

## The problem: retrieval on a table built for scans

Lakehouse tables in Delta, Iceberg or Parquet are built for analytics: read many rows, a few columns, and aggregate. They are much less suited to retrieval: find the few rows that mention a phrase, belong to one user, or fall in one hour.

For those questions the engine has only coarse tools. Partition pruning and file statistics rule out some files; the rest are read and filtered row by row. Text is the worst case, because a `LIKE '%timeout%'` predicate has no statistic to prune with, so every file is read.

The usual answers each cost something:

| Approach | What you pay |
|---|---|
| Scan and filter | Time and compute that grow with the table, not with the answer |
| Sort, Z-order or Bloom-filter the table | Helps a few chosen columns for exact match and ranges; nothing for text; rewrites data |
| Copy the data to a search cluster | A second system to run, a pipeline to keep it in sync, a second copy of the data, and a second query language |

## What IndexTables does instead

IndexTables keeps a search index in object storage, beside a transaction log, and lets your query engine read it directly.

- **The index finds the rows.** Text search, exact match and range filters are answered by index lookup. Counts, sums, minimums and maximums are computed from the index without materialising rows.
- **It runs inside the engine you have.** Spark executors and DataFusion partitions open index files themselves. There is no server, no cluster and no separate query language: you write SQL or DataFrame code.
- **It lives where your data lives.** Index files are immutable objects on S3-compatible storage, Azure, GCS or local disk, committed through a transaction log with snapshot reads.
- **It fits what you already have, or stands alone.** A *standalone* table stores rows and index together. A *companion* table indexes an existing Delta, Iceberg or Parquet table and leaves the rows where they are.

## How it compares

| | Lakehouse table alone | Search cluster | IndexTables |
|---|---|---|---|
| Full-text search | Scan | Yes | Yes |
| Exact match and range | File statistics; scan of the remaining files | Yes | Index lookup, plus partition and file pruning |
| Aggregates over matches | Scan | Yes | Computed in the index for supported functions |
| Infrastructure | None beyond the engine | A cluster and an ingest pipeline | None beyond the engine |
| Where data lives | Object storage | The cluster's disks | Object storage |
| Query interface | SQL, DataFrames | Its own API | SQL, DataFrames |
| Joins with other tables | Yes | No | Yes, in the engine |

The first column describes Delta, Iceberg and Parquet in general terms. Each has features, such as Bloom filters and data-skipping statistics, that help particular exact-match and range queries.

## When it is a good fit

- Logs, events, traces, audit records and documents that people or programs search.
- Investigations that start with a needle (an ID, an address, a phrase) and then pivot.
- Agents and services that need a small, exact answer from a very large table.
- Teams that want search without operating a search system.

## When it is not

- **Pure analytics over most of a table.** A columnar scan is the right tool; an index does not help a query that reads everything.
- **Relevance-ranked search as a product feature**, with scoring and tuning. IndexTables is built for filtering and retrieval inside a query engine.
- **Low-latency serving to many concurrent end users.** Queries run as Spark or DataFusion queries, with the start-up and scheduling costs of those engines.
- **Writes to Azure or GCS today.** Reads work on both; writes there are planned. See [availability](/reference/availability/).

## About speed

This site describes *why* retrieval is fast, an index lookup instead of a scan, and does not yet quote figures for the current version. The rebuilt engine's benchmarks have not been published. The [conference talk](/why/talks/) reports measurements for IndexTables 0.5.x.
