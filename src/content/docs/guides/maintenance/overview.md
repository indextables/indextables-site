---
title: Maintenance overview
description: The routine commands that keep a table fast and tidy, what each is for, and when to run it.
sidebar: { order: 1 }
lid:
  reviewed: a865437
  fingerprint: 7d0002188b59
  class: derived
  cites: [SPARK-MNT-GEN, SPARK-MNT-MRG, SPARK-MNT-PRG, SPARK-MNT-TT, SPARK-MNT-DROP, SPARK-MNT-CKPT, SPARK-MNT-REP]
  docs: [spark/maintenance/maintenance-design.md#DROP PARTITIONS, spark/maintenance/maintenance-design.md#CHECKPOINT / COMPACT, spark/maintenance/maintenance-design.md#REPAIR INDEXFILES TRANSACTION LOG]
engine: [spark]
---

Tables are made of immutable files, so writing and deleting leave things behind: many small index files, files no longer referenced, and a growing log. Maintenance commands deal with each. They run as Spark SQL with the session extension enabled.

| Command | Purpose | Run it |
|---|---|---|
| [`MERGE SPLITS`](/guides/maintenance/merge-splits/) | Combine small index files into larger ones | Regularly on tables with frequent small writes |
| [`PURGE INDEXTABLE`](/guides/maintenance/purge/) | Delete files no longer referenced, past a retention period | Regularly |
| [`TRUNCATE INDEXTABLES TIME TRAVEL`](/guides/maintenance/purge/#truncate-time-travel) | Discard old versions of the log | When history is not needed |
| `DROP INDEXTABLES PARTITIONS` | Remove whole partitions | To expire old data |
| `CHECKPOINT INDEXTABLES` | Write a compact snapshot of the log | Rarely; it happens automatically |
| `REPAIR INDEXFILES TRANSACTION LOG` | Rebuild a log that lists only files that exist | After files were lost |

## Naming the table

Every command takes either a quoted location or an unquoted name:

```sql
MERGE SPLITS 's3://my-bucket/events';      -- a location: absolute path or URI
MERGE SPLITS logs.events;                  -- a catalog name
```

A quoted string is always a location and must be absolute. A name is always looked up in the catalog; it is never guessed to be a path.

`WHERE` clauses take predicates on **partition columns only**. A predicate that names no column, such as `WHERE true`, is rejected, so a mistake cannot select the whole table.

## Drop partitions

```sql
DROP INDEXTABLES PARTITIONS FROM logs.events WHERE day < '2026-08-01';
```

`WHERE` is required. A partition is removed when the predicate is true for it, following SQL rules for `NULL`: `region <> 'eu'` does not remove partitions whose `region` is null.

The drop is one commit. The files stay on storage until `PURGE` removes them after its retention period; until then, earlier versions of the table that include them remain readable.

It returns the number of partitions and index files removed and their total size, or `no_action` when nothing matched.

On a companion, dropping partitions clears the sync watermark, so the next sync reconciles fully. See [keep a companion in sync](/guides/companions/sync/).

## Checkpoint

```sql
CHECKPOINT INDEXTABLES logs.events;
```

Writes a compact state of the table at its latest version, so readers need not replay the whole log. Checkpoints are written automatically as the log grows; run this by hand before a burst of readers, or after a large import. `COMPACT INDEXTABLES` is a synonym. It is unrelated to `MERGE SPLITS`, which compacts index files.

## Repair

```sql
REPAIR INDEXFILES TRANSACTION LOG 's3://my-bucket/events/_transaction_log'
  AT LOCATION 's3://my-bucket/events-repaired/_transaction_log';
```

If index files were deleted from storage outside IndexTables, reads fail on the missing files. `REPAIR` reads the table's latest state, checks which files still exist, and writes a new log at another location that lists only those. It reports how many files were found and how many are missing.

The target must be empty. If the command is interrupted, delete the target and run it again.

## A routine

For a table with continuous small writes:

1. Enable merge-on-write, or run `MERGE SPLITS` on recent partitions on a schedule.
2. Run `PURGE INDEXTABLE` daily.
3. Run `DROP INDEXTABLES PARTITIONS` for data past its lifetime.

Maintenance commits are checked for conflicts like any write. A maintenance command that loses to a concurrent write fails without harm and can be run again.

## 0.5.x spellings

`TANTIVY4SPARK` is still accepted in place of `INDEXTABLES`, with a deprecation warning. `PURGE INDEXTABLE` is singular, and `REPAIR INDEXFILES` keeps its older keyword.
