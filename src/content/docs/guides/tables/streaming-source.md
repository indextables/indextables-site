---
title: Read a table as a stream
description: Use a standalone table as a Structured Streaming source, by path or by name.
sidebar: { order: 5 }
lid:
  reviewed: a865437
  fingerprint: 5d6114bf99f7
  class: derived
  cites: [SPARK-STR-IF, SPARK-STR-OPT, SPARK-STR-OFF, SPARK-STR-ADM, SPARK-STR-CHG, SPARK-STR-CMP, SPARK-CAT-STR]
engine: [spark]
---

A standalone table can be read with Structured Streaming. The stream delivers the table's current contents, then each new commit as it lands.

```python
stream = (spark.readStream.format("indextables")
  .option("maxFilesPerTrigger", 500)
  .load("s3://my-bucket/events"))

# or by name
stream = spark.readStream.table("logs.events")

(stream.where("message indexquery 'error'")
  .writeStream.format("console")
  .option("checkpointLocation", "/tmp/chk")
  .start())
```

With the session extension enabled, `indexquery` is pushed into each micro-batch.

## Options

Options are given without a prefix.

| Option | Effect |
|---|---|
| `maxFilesPerTrigger` | Upper bound on files admitted to one micro-batch |
| `maxBytesPerTrigger` | Upper bound on bytes admitted to one micro-batch |
| `startingVersion` | Start from this table version instead of the current contents |
| `startingTimestamp` | Start from the version current at this time |
| `skipChangeCommits` | Skip commits that remove data instead of failing on them |

## How commits are treated

| Commit | Effect on the stream |
|---|---|
| Append | Its rows are delivered |
| Merge of small files | Nothing is re-delivered; the rows were already seen |
| Overwrite, or a partition drop | The stream fails, unless `skipChangeCommits` is set |

The `ignoreChanges` and `ignoreDeletes` options of other formats are rejected; use `skipChangeCommits`.

## Limits

- Companion tables cannot be read as a stream.
- There is no streaming sink. To write a stream into IndexTables, use `foreachBatch` with a batch write.
