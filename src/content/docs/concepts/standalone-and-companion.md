---
title: Standalone and companion tables
description: The two kinds of table, what each stores, and how to choose.
sidebar: { order: 2 }
lid:
  reviewed: a865437
  fingerprint: 52a8685b478c
  class: derived
  cites: [CORE-TF-LAYOUT, CORE-CF-MAN, CORE-CF-FAST, CORE-SRCH-CMP, SPARK-SYNC-CMD, SPARK-WR-MODE]
  docs: [high-level-design.md#Companion source lifetime]
engine: [spark, datafusion]
---

IndexTables has two kinds of table. They are queried the same way and differ in where the rows live.

| | Standalone | Companion |
|---|---|---|
| Rows are stored | In the IndexTables table | In your Delta, Iceberg or Parquet files |
| The table contains | Index and data | Index only, pointing at source files |
| You write with | `df.write.format("indextables")` | Your existing pipeline; then `BUILD INDEXTABLES COMPANION` |
| Updated by | Appends and overwrites | Syncing from the source |
| Other tools read the data | Through IndexTables | Directly from the source table, as before |
| Credentials needed to read | The table's location | The companion's location and the source's |
| Search, filters, aggregates | Yes | Yes |
| Streaming source | Yes | No |

Upstream documents call a standalone table a *standard table*.

## Standalone: the index is the table

Each index file holds the index and the stored rows for a batch of data. One location contains everything.

Choose standalone when:

- the data is mainly searched and retrieved, such as logs, events, traces or documents;
- nothing else needs to read it as Delta, Iceberg or Parquet;
- you want one copy and one thing to operate.

## Companion: an index over a table you already have

Each index file holds an index over particular source files, and a record of which files and rows it covers. When a query matches, the rows are read from the source Parquet files at the positions the index gives.

Choose a companion when:

- the table already exists and other engines and jobs depend on it;
- the data is governed where it is, for example in Unity Catalog;
- you want search without a second copy of the data.

### What a companion adds to think about

- **Freshness.** A companion reflects its source as of the last sync. See [keep a companion in sync](/guides/companions/sync/).
- **Two sets of credentials.** Readers need the companion's and the source's.
- **Source files must stay put.** A companion points at specific files. They must remain byte-identical while an index that references them can be queried. Normal Delta and Iceberg writes are fine; sync before cleaning up old files.
- **Deletes.** Rows deleted in the source are never returned. See [row-level deletes](/guides/companions/deletes/).

### What a companion can leave out

A companion does not need to hold everything:

- **Columns** can be excluded from the index. They are still returned, and still filterable while reading the source.
- **Fast data** for filters and aggregates can be kept in the index, or served from the source Parquet, per the fast-field mode.
- **Partitions** can be limited with a `WHERE` clause.

## Both at once

Nothing stops you using both: companions over governed lakehouse tables, and standalone tables for data that exists only to be searched. They can be joined in one query.
