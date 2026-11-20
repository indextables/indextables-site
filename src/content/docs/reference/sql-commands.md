---
title: SQL commands
description: Every IndexTables SQL command with its syntax, grouped by purpose.
sidebar: { order: 1 }
lid:
  reviewed: a865437
  fingerprint: 97cb8e72a347
  class: derived
  cites: [SPARK-OPS-GRAM, SPARK-OPS-LEG, SPARK-OPS-RES, SPARK-MNT-GEN, SPARK-MNT-MRG, SPARK-MNT-PRG, SPARK-MNT-TT, SPARK-MNT-DROP, SPARK-MNT-CKPT, SPARK-MNT-REP, SPARK-SYNC-CMD, SPARK-OPS-PRE, SPARK-OPS-PJOB, SPARK-OPS-FLUSH, SPARK-OPS-INV, SPARK-OPS-ROOT, SPARK-OPS-PROF, SPARK-OPS-TRACE, SPARK-OPS-CPU, SPARK-RD-IQ, SPARK-RD-BKT]
engine: [spark]
---

These commands are added to Spark SQL by the session extension `io.indextables.extensions.IndexTablesSparkExtensions`.

## Conventions

- Keywords are case-insensitive. Trailing semicolons are allowed.
- `<table>` is a quoted location (`'s3://bucket/path'`, an absolute path or URI) or an unquoted catalog name (`db.table`). A quoted string is never treated as a name.
- `<size>` is a number of bytes, or a number followed by `M` or `G`.
- `WHERE` takes a predicate on partition columns. A predicate naming no column is rejected.
- Optional clauses must appear in the order shown.
- `TANTIVY4SPARK` is accepted in place of `INDEXTABLES`, with a deprecation warning.
- A statement that starts like an IndexTables command but does not match its syntax is a parse error. It is never run as something else.

## Search operators and functions

```text
<column> indexquery '<query>'
<column> TEXTSEARCH '<query>'
<column> FIELDMATCH '<query>'
indexqueryall('<query>')        * indexquery '<query>'

indextables_indexquery(<column>, '<query>')      indextables_indexqueryall('<query>')
indextables_textsearch(<column>, '<query>')      indextables_textsearchall('<query>')
indextables_fieldmatch(<column>, '<query>')      indextables_fieldmatchall('<query>')

indextables_date_histogram(<column>, '<interval>'[, '<offset>'[, <min_doc_count>]])
indextables_histogram(<column>, <interval>[, <offset>[, <min_doc_count>]])
indextables_range(<column>, '<name>', <from>, <to>[, …])
```

See [IndexQuery](/guides/query/indexquery/) and [aggregates](/guides/query/aggregates/).

## Maintenance

```text
MERGE SPLITS <table>
  [WHERE <predicate>] [TARGET SIZE <size>]
  [MAX DEST SPLITS <n>] [MAX SOURCE SPLITS PER MERGE <n>]

PURGE INDEXTABLE <table>
  [OLDER THAN <n> (DAYS | HOURS)]
  [TRANSACTION LOG RETENTION <n> (DAYS | HOURS)]
  [DRY RUN]

TRUNCATE INDEXTABLES TIME TRAVEL <table> [DRY RUN]

DROP INDEXTABLES PARTITIONS FROM <table> WHERE <predicate>

(CHECKPOINT | COMPACT) INDEXTABLES <table>

REPAIR INDEXFILES TRANSACTION LOG '<source root>/_transaction_log'
  AT LOCATION '<target root>/_transaction_log'
```

See [maintenance](/guides/maintenance/overview/).

## Companions

```text
BUILD INDEXTABLES COMPANION FOR (DELTA | PARQUET | ICEBERG) '<source>'
  [SCHEMA SOURCE '<parquet file>']                 -- PARQUET
  [CATALOG '<name>' [TYPE '<type>']]               -- DELTA, ICEBERG
  [WAREHOUSE '<warehouse>']                        -- ICEBERG
  [INCLUDE COLUMNS ('<c>', …) | EXCLUDE COLUMNS ('<c>', …)]
  [INDEXING MODES ('<field>':'<mode>', …)]
  [FASTFIELDS MODE (HYBRID | DISABLED | PARQUET_ONLY)]
  [HASHED FASTFIELDS (INCLUDE | EXCLUDE) ('<c>', …)]
  [TARGET INPUT SIZE <size>]
  [WRITER HEAP SIZE <size>]
  [FROM VERSION <n>]                               -- DELTA
  [FROM SNAPSHOT <n>]                              -- ICEBERG
  [WHERE (<predicate> | ALL)]
  [INVALIDATE ALL PARTITIONS]
  [FULL]
  [TABLE ROOTS ('<name>' = '<uri>', …)]
  AT LOCATION '<companion root>'
  [DRY RUN]
  [WITH STREAMING POLL INTERVAL <n> (SECONDS | MINUTES)]

SET INDEXTABLES TABLE ROOT '<name>' = '<uri>' AT <table>
UNSET INDEXTABLES TABLE ROOT '<name>' AT <table>
DESCRIBE INDEXTABLES TABLE ROOTS AT <table>
```

`FULL` and `INVALIDATE ALL PARTITIONS` cannot be combined with `FROM`. See [companions](/guides/companions/overview/).

## Caches and prewarm

```text
PREWARM INDEXTABLES CACHE <table>
  [FOR SEGMENTS (<component>, …)] [ON FIELDS (<field>, …)]
  [WITH PERWORKER PARALLELISM OF <n>] [WHERE <predicate>] [ASYNC MODE]

WAIT FOR INDEXTABLES PREWARM JOBS [<table>] [JOB '<id>'] [TIMEOUT <seconds>]
DESCRIBE INDEXTABLES PREWARM JOBS

DESCRIBE INDEXTABLES DISK CACHE
FLUSH INDEXTABLES SEARCHER CACHE
FLUSH INDEXTABLES DISK CACHE
INVALIDATE INDEXTABLES TRANSACTION LOG CACHE [FOR <table>]
```

See [caches and prewarm](/guides/operations/caches-and-prewarm/).

## Inspection

```text
DESCRIBE INDEXTABLES TRANSACTION LOG <table> [INCLUDE ALL]
DESCRIBE INDEXTABLES STATE <table>
DESCRIBE INDEXTABLES COMPONENT SIZES <table> [WHERE <predicate>]
DESCRIBE INDEXTABLES STORAGE STATS
DESCRIBE INDEXTABLES ENVIRONMENT
DESCRIBE INDEXTABLES MERGE JOBS
```

See [inspect tables and the cluster](/guides/operations/inspect/).

## Profiling

```text
(ENABLE | DISABLE) INDEXTABLES PROFILER
(DESCRIBE | RESET) INDEXTABLES PROFILER [CACHE]

SHOW INDEXTABLES TRACES
DESCRIBE INDEXTABLES PROFILE FOR LAST QUERY
DESCRIBE INDEXTABLES PROFILE FOR QUERY <id> [BY EXECUTOR]
EXPORT INDEXTABLES TRACE FOR QUERY <id> [TO '<uri>']
PROFILE INDEXTABLES CPU [FOR <n> SECONDS] [ON EXECUTORS (<id>, …)]
```

The output of these commands is still changing. See [profiling and traces](/guides/operations/profiling/).

## Spark SQL on tables by name

Standard Spark statements that work on IndexTables entries, and those that are refused, are listed in [use tables by name](/guides/catalogs/tables-by-name/).

## DataFusion

```text
CREATE EXTERNAL TABLE <name> STORED AS INDEXTABLES LOCATION '<root>'

indexquery(<column>, '<query>')
indexqueryall('<query>')
```

See [catalogs in DataFusion](/guides/catalogs/datafusion/).
