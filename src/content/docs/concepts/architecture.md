---
title: Architecture
description: One engine-neutral core, two engine bindings, and object storage. How a query and a write move through them.
sidebar: { order: 1 }
lid:
  reviewed: a865437
  fingerprint: f788231da163
  class: derived
  cites: [SPARK-NB-ENT, SPARK-NB-ARW, SPARK-NB-PROTO, DF-AD-PROV, CORE-SRCH-SCAN, CORE-TF-CMT, CORE-STO-OP]
  docs: [high-level-design.md#Key Design Decisions]
engine: [spark, datafusion]
---

IndexTables has three layers.

```text
   Spark (JVM)                      DataFusion (Rust)
   DataSource V2, SQL extension     TableProvider, optimizer rule
        │  Arrow + protobuf over JNI        │  direct calls
        └──────────────┬────────────────────┘
                       ▼
              Core (Rust, engine-neutral)
   table format · transaction log · query translation · search
   aggregation · index building · caches · storage
                       │
                       ▼
     Object storage: S3-compatible · Azure · GCS · local disk
```

## The core

The core owns everything that defines a table: the file formats, the transaction log, how a predicate becomes an index query, search, aggregation, building index files, caching and storage access. It is written in Rust on the tantivy search library and the quickwit split format.

Because the core owns these, both engines read the same tables and return the same answers. A differential test harness runs the same queries through both.

## The Spark binding

A Spark DataSource V2 implementation plus a session extension. It:

- plans scans, pushing filters, `indexquery`, limits and aggregates to the core;
- distributes work to executors, preferring executors that already have a file cached;
- writes tables, committing through the core;
- adds SQL commands for maintenance and operations;
- integrates with Spark's session catalog.

Spark talks to the core through JNI. Rows cross the boundary as Arrow batches and requests as protobuf messages. There is no row-by-row conversion, and native memory is reserved from Spark's own memory manager, so Spark's limits are respected.

## The DataFusion adapter

A Rust crate that exposes a table as a DataFusion `TableProvider`. It calls the core directly, with no JVM. Today it reads; it does not write.

## Storage

The core reads and writes object storage itself. It does not go through Hadoop file systems, though it honours their `fs.s3a.*`, `fs.azure.*` and `fs.gs.*` settings.

## Following a query

1. **Plan.** The engine asks the core for a snapshot of the table. The core reads the transaction log and prunes files by partition and by statistics.
2. **Translate.** The engine hands over the predicate. The core says, for each part, whether the index answers it exactly, narrows it, or cannot help. The engine keeps what it must re-check.
3. **Distribute.** Remaining files are grouped into tasks (Spark) or partitions (DataFusion).
4. **Search.** Each task opens its files through the cache, runs the index query, and reads matching rows, from the index for a standalone table and from the source Parquet for a companion.
5. **Return.** Rows come back as Arrow batches. Aggregates come back as partial results that the engine combines.

## Following a write

1. Spark tasks convert rows to Arrow and hand them to the core, which builds index files and uploads them.
2. The driver commits: one new version file in the transaction log listing the added files, written only if that version does not already exist.
3. Post-commit hooks may merge, purge or checkpoint.

## Design principles

- **Correct before fast.** A pushed filter or aggregate must be exact, or the engine re-checks it, or the query is refused. It is never approximately right.
- **Fail loudly.** A setting that is malformed, a statement that cannot be honoured, or an index that cannot answer a query produces an error naming the cause and the remedy.
- **Compatible on disk.** Tables written by IndexTables 0.5.5 are readable and writable.
- **Observable.** Every operation emits structured spans across the driver, executors and native code.
