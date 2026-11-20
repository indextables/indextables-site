---
title: Profiling and traces
description: The aggregate profiler, per-query traces and CPU profiles. Output columns and span names are still changing upstream.
sidebar: { order: 3 }
status: changing
lid:
  reviewed: a865437
  fingerprint: 054702f544e0
  class: derived
  cites: [SPARK-OPS-PROF, SPARK-OPS-TRACE, SPARK-OPS-CPU, CORE-OBS-AGG, CORE-OBS-XPT]
engine: [spark]
---

IndexTables can report where time goes: across the cluster in aggregate, for one query, and by CPU stack. The commands below are settled. The rows, columns and span names they report are being extended upstream, so they are not documented here yet.

## Aggregate profiler

Always available and enabled by default. It accumulates timings for storage, search, index building and the Spark binding, plus cache counters, per process.

```sql
DESCRIBE INDEXTABLES PROFILER;
DESCRIBE INDEXTABLES PROFILER CACHE;
RESET INDEXTABLES PROFILER;
DISABLE INDEXTABLES PROFILER;
ENABLE INDEXTABLES PROFILER;
```

## Per-query traces

Collection is off by default. Turn it on at application start:

```text
spark.plugins=io.indextables.spark.IndexTablesPlugin
spark.indextables.observability.collect=true
```

```sql
SHOW INDEXTABLES TRACES;
DESCRIBE INDEXTABLES PROFILE FOR LAST QUERY;
DESCRIBE INDEXTABLES PROFILE FOR QUERY 12 BY EXECUTOR;
EXPORT INDEXTABLES TRACE FOR QUERY 12 TO 's3://my-bucket/traces/q12.json';
```

A trace covers the driver and every executor in one file, in Chrome Trace Event format, which opens in Perfetto and similar viewers.

Query text and literal values are left out of traces unless the session sets `observability.collect.literals`.

## CPU profiles

```sql
PROFILE INDEXTABLES CPU FOR 30 SECONDS;
PROFILE INDEXTABLES CPU FOR 30 SECONDS ON EXECUTORS (1, 2);
```

Samples native stacks on the driver and executors and writes folded stacks and flame graphs.

## OpenTelemetry

Spans can be exported over OTLP. Configure `observability.otlp.endpoint` and `observability.otlp.sampleRatio` at application start. Export sampling is independent of per-query collection.

## Where the plugin cannot be loaded

On a Spark Connect server or a managed platform that does not let you set `spark.plugins`, the operator can enable an alternative transport at application start:

```text
spark.indextables.observability.transport.flushTasks.enabled=true
```

It collects the same traces with short extra Spark tasks after a query ends. The plugin is preferred where it can be loaded. See [Spark Connect](/guides/operations/spark-connect/).

## Error backtraces

`observability.errorBacktraces.enabled` adds native stack frames to error cause chains. Set it in the Spark configuration at start-up.
