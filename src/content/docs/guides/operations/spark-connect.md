---
title: Spark Connect
description: What works over Spark Connect, and what a server operator has to configure.
sidebar: { order: 4 }
lid:
  reviewed: a865437
  fingerprint: 84d623b057e8
  class: derived
  cites: [SPARK-RD-MODE, SPARK-CAT-DDL-336, SPARK-OPS-CPU-012, CORE-OBS-XPT]
engine: [spark]
---

With Spark Connect the application is a thin client and Spark runs on a server. IndexTables runs entirely on the server, so a client needs no IndexTables jar.

## Server set-up

Install the IndexTables jar on the server and enable the extension in the server's configuration, as for any Spark application:

```text
spark.sql.extensions=io.indextables.extensions.IndexTablesSparkExtensions
```

Settings that are read once per process, such as cache locations and the observability plugin, must be in the server's start-up configuration. A client cannot change them.

## From a client

```python
from pyspark.sql import SparkSession
spark = SparkSession.builder.remote("sc://connect.internal:15002").getOrCreate()

events = spark.read.format("indextables").load("s3://my-bucket/events")
events.where("message indexquery 'timeout'").show()

spark.sql("MERGE SPLITS 's3://my-bucket/events'").show()
```

Reads, writes, `indexquery`, tables by name and the SQL commands behave as they do in a classic session.

## Things that differ

- **Fast mode applies to results sent to the client**, as it does to `collect()` in a classic session. See [read modes](/guides/query/read-modes/).
- **Cancelling a statement** from the client cancels a running `PROFILE INDEXTABLES CPU`.
- **Query traces need server-side configuration.** If the server does not load the IndexTables Spark plugin, the operator can enable the flush-task transport instead. Trace commands tell the two situations apart, so a client is never told to change a setting it cannot change. See [profiling and traces](/guides/operations/profiling/).
- **`insertInto` protection** against redirected writes applies to Connect clients as well. See [use tables by name](/guides/catalogs/tables-by-name/).
