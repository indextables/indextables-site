---
title: Splits and the transaction log
description: The files a table is made of, how commits and snapshots work, and what checkpoints are for.
sidebar: { order: 3 }
lid:
  reviewed: a865437
  fingerprint: fb719d2e3732
  class: derived
  cites: [CORE-SF-BUN, CORE-SF-FOOT, CORE-SF-HOT, CORE-TF-LAYOUT, CORE-TF-CMT, CORE-TF-STATE, CORE-LOG-SNAP, CORE-LOG-CKPT, CORE-LOG-PRUNE]
engine: [spark, datafusion]
---

## What is at a table's location

```text
s3://my-bucket/events/
├── _transaction_log/
│   ├── 00000000000000000000.json      version 0: protocol and metadata
│   ├── 00000000000000000001.json      version 1: files added and removed
│   ├── …
│   ├── state-v…/                      a checkpoint of the table's state
│   └── _last_checkpoint               points at the newest checkpoint
├── day=2026-11-01/
│   ├── part-….split
│   └── part-….split
└── day=2026-11-02/
    └── part-….split
```

File names are illustrative.

## Splits

A **split** is one immutable index file. It is a self-contained bundle holding:

- a search index over a batch of rows: term dictionaries, postings, fast data and, for standalone tables, stored rows;
- a **footer** describing where each part is, so a reader can fetch only the byte ranges it needs;
- a **hotcache**: the small pieces every query needs, kept together so that opening a split takes few requests.

Splits are never modified. Changing a table means adding splits and marking others removed.

A companion split additionally records which source files and rows it covers, and how each column is served.

## The transaction log

The log is the table's source of truth: the list of splits that make it up, its schema, its partition columns and its properties.

Each **commit** writes one new version file listing actions: splits added, splits removed, metadata changed. A version file is written with put-if-absent, so two writers cannot both create version *N*. The loser re-reads the log, checks whether the other commit conflicts with its own, and either retries at *N+1* or fails.

For each split the log records its partition values, row count, size, and the minimum and maximum of its columns. Pruning uses these without opening the split.

## Snapshots

A **snapshot** is the set of live splits at one version. A query takes one snapshot and uses it throughout, so it sees a consistent table even while writes land. Earlier versions remain readable until they are truncated or their files purged.

## Checkpoints

Replaying thousands of version files to learn the table's state would be slow. A **checkpoint** stores the full state at one version in a compact form; a reader loads the newest checkpoint and replays only the versions after it.

Checkpoints are written automatically. They also allow old version files to be deleted without losing the table.

## What removes files

| Action | Removes from the table | Deletes from storage |
|---|---|---|
| Overwrite, merge, drop partitions | Yes, in a commit | No |
| `PURGE INDEXTABLE` | — | Yes, for unreferenced files past retention |
| `TRUNCATE INDEXTABLES TIME TRAVEL` | — | Old log versions |

## Compatibility

The on-disk format is that of IndexTables 0.5.5. Tables written by 0.5.5 can be read and extended, and the reverse holds within documented limits. See [Migrate from 0.5.x](/guides/migrate/from-0-5/).
