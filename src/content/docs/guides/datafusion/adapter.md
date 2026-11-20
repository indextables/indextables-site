---
title: The DataFusion adapter
description: What is pushed down, how scans are partitioned, listing modes, memory and metrics, and what is not there yet.
sidebar: { order: 1 }
lid:
  reviewed: a865437
  fingerprint: ec89318b64d3
  class: derived
  cites: [DF-AD-PROV, DF-AD-PUSH, DF-AD-IQ, DF-AD-AGG, DF-AD-PART, DF-AD-UNIT, DF-AD-MEM, DF-AD-MET, DF-AD-RT, DF-AD-CDC, DF-AD-LIM, DF-AD-ERR]
engine: [datafusion]
---

`indextables-datafusion` is a Rust crate that makes an IndexTables table a DataFusion `TableProvider`. It shares its engine with the Spark binding: the same core reads the same tables with the same results. It does not depend on Spark or a JVM.

For a first query, see [Get started with DataFusion](/start/datafusion/).

## What is pushed into the index

| | Pushed |
|---|---|
| Projection | Yes: only requested columns are read |
| Filters: `=`, `IN`, ranges, null tests, `AND`/`OR`/`NOT` | Yes, each reported to DataFusion as exact or inexact |
| `indexquery(col, 'q')`, `indexqueryall('q')` | Yes |
| `LIMIT` | Yes |
| `count`, `sum`, `min`, `max`, with `GROUP BY` columns | Yes, through a physical optimizer rule |
| `avg`, bucket functions, aggregates over expressions | No: DataFusion computes them |
| Sort and top-N | No |

Filters the index cannot answer exactly stay in DataFusion's plan, so results are always correct.

Aggregate pushdown is a physical optimizer rule that you install on the session:

```rust
let ctx = SessionContext::new_with_state(install_aggregate_pushdown(builder).build());
```

Without it, queries still work, and aggregates are computed by DataFusion from scanned rows.

## Partitions

A scan is split into DataFusion partitions so that it runs in parallel, and it supports DataFusion's repartitioning to the session's target partition count.

## Listing modes

Before scanning, the adapter needs the list of index files that survive pruning. It can obtain it in two ways, chosen when the provider is built:

| Mode | The file list is produced | Suits |
|---|---|---|
| Collected (default) | While planning, in the planning process | Most tables |
| `ListingMode::Unit` | While executing: each partition lists its own share of the table | Very large tables, and distributed execution where planning should stay light |

```rust
let factory = IndexTablesTableFactory::new(resolver).with_listing_mode(ListingMode::Unit);
```

## The process host

Caches, the table-log cache and memory accounting are shared by every session in a process. You register a Tokio runtime and a memory pool once:

```rust
let _host = register_process_host(tokio::runtime::Handle::current(), pool, None)?;
```

Scans reserve memory from the DataFusion memory pool of the task they run in; long-lived caches reserve from the pool given here. If a reservation is denied, the query fails with a resource error instead of exceeding the limit.

## Metrics

Scan nodes report DataFusion metrics, visible with `EXPLAIN ANALYZE`.

## Companions

The adapter reads companion tables, fetching rows from the source Parquet files. The key-map resolver is asked for settings for the source location as well as for the index location.

## Distributed execution

Behind the crate feature `distributed`, an `IndexTablesCodec` for `datafusion-proto` serialises scan nodes so that a plan can be sent to another process. Credentials are not serialised; the receiving process resolves its own. This has been tested between two processes, not with Ballista.

## Apache DataFusion Comet

Behind the feature `comet-contrib`, the crate provides the native half of a Comet contributed scan, built against a pinned Comet version. The JVM half is not available yet, so Spark does not plan IndexTables scans through Comet today.

## Not there yet

- Writes and maintenance. Use Spark.
- Fast mode. The adapter always returns complete results.
- `avg`, bucket and expression aggregates; sort and top-N pushdown.
- Ready-made catalog entry sources for Glue, Hive Metastore and Polaris.
