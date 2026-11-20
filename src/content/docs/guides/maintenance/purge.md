---
title: Purge files and truncate history
description: PURGE INDEXTABLE deletes unreferenced files after a retention period. TRUNCATE TIME TRAVEL discards old versions.
sidebar: { order: 3 }
lid:
  reviewed: a865437
  fingerprint: 338478e8177a
  class: derived
  cites: [SPARK-MNT-PRG, SPARK-MNT-TT, SPARK-WR-POW, CORE-LOG-RET]
  docs: [spark/maintenance/maintenance-design.md#PURGE INDEXTABLE, spark/maintenance/maintenance-design.md#TRUNCATE TIME TRAVEL]
engine: [spark]
---

Overwrites, merges and partition drops remove files from the table without deleting them from storage. Failed writes can leave files that were never part of the table. `PURGE` deletes both kinds, once they are old enough.

## Purge

```sql
PURGE INDEXTABLE logs.events DRY RUN;      -- see what would be deleted

PURGE INDEXTABLE logs.events;

PURGE INDEXTABLE logs.events
  OLDER THAN 14 DAYS
  TRANSACTION LOG RETENTION 60 DAYS;
```

```text
PURGE INDEXTABLE <table>
  [OLDER THAN <n> (DAYS | HOURS)]
  [TRANSACTION LOG RETENTION <n> (DAYS | HOURS)]
  [DRY RUN]
```

Note the singular `INDEXTABLE`.

| Clause | Meaning |
|---|---|
| `OLDER THAN` | Delete unreferenced index files last modified longer ago than this |
| `TRANSACTION LOG RETENTION` | Delete log versions older than this that a checkpoint has made unnecessary |
| `DRY RUN` | Report counts, sizes and sample paths; delete nothing |

### What is safe

- **Only unreferenced files are deleted.** A file any retained version of the table still lists is kept.
- **Recent files are kept.** A very short retention is rejected unless you disable the check with `purge.retentionCheckEnabled`. Even then, unreferenced files younger than one hour are never deleted, so the uploads of a write that is about to commit are safe.
- **Only IndexTables' own files are candidates.** Other files under the location are left alone, as are other tables nested below it.
- **The table stays reconstructible.** Log versions are deleted only where a checkpoint covers them.

Until a file is purged, the earlier versions of the table that referenced it remain readable. The retention period is therefore also how far back earlier versions stay complete.

### Purge automatically after writes

```python
spark.conf.set("spark.indextables.purgeOnWrite.enabled", "true")
```

Settings are under `purgeOnWrite.*` in the [configuration reference](/reference/configuration/).

## Truncate time travel

```sql
TRUNCATE INDEXTABLES TIME TRAVEL logs.events DRY RUN;
TRUNCATE INDEXTABLES TIME TRAVEL logs.events;
```

Discards every version of the log below a checkpoint of the latest version, writing that checkpoint first if needed. Afterwards the table has its current contents and no history: time travel to earlier versions stops working. That is the command's purpose.

Unlike `PURGE`, it applies no retention period. It does not delete index files; run `PURGE` afterwards to remove the files that only the discarded versions referenced.

It returns the checkpoint version, the number of versions and checkpoints deleted, and the number of live index files kept.

Both commands are safe to run while the table is being written. A writer that planned against a version that has since been discarded fails without writing, and can retry.
