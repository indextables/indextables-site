---
title: Migrate from 0.5.x
description: What stays the same, what changed, and the steps to move a deployment from IndexTables 0.5.x to the rebuilt version.
sidebar: { order: 1 }
lid:
  reviewed: a865437
  fingerprint: 52aeecd581ba
  class: derived
  cites: [SPARK-OPS-LEG, SPARK-CFG-KEY, SPARK-CFG-SRC, SPARK-CFG-ACC, SPARK-RD-MODE, SPARK-RD-IQ, SPARK-SYNC-DEL, CORE-TF-PROT, SPARK-CAT-COMPAT]
  docs: [high-level-design.md#Wire compatibility at the latest format]
engine: [spark]
---

IndexTables has been rebuilt from the ground up: one repository, an engine-neutral core in Rust, a Spark binding and a DataFusion adapter. It replaces `indextables_spark` and `tantivy4java`.

The short version: **your tables carry over; your jar, a few settings and some habits change.**

## What stays the same

- **Your tables.** The on-disk format is that of 0.5.5. Tables written by 0.5.5 are read and extended in place. No conversion step.
- **`format("indextables")`**, `indexquery`, `TEXTSEARCH`, `FIELDMATCH` and `indexqueryall`.
- **The SQL commands**: `MERGE SPLITS`, `PURGE INDEXTABLE`, `BUILD INDEXTABLES COMPANION`, `PREWARM INDEXTABLES CACHE` and the rest.
- **Most configuration keys**, under the same `spark.indextables.` prefix. Renamed keys keep their old names as aliases.
- **Old spellings**: the `TANTIVY4SPARK` keyword, the `tantivy4spark_*` functions and the old extension class names still work, with deprecation warnings.

## What you must change

| | 0.5.x | Now |
|---|---|---|
| Artifact | `indextables_spark` | `io.indextables:indextables-spark-3.5_2.12` or `indextables-spark-4.2_2.13` |
| Session extension | `io.indextables.spark.extensions.IndexTables4SparkExtensions` | `io.indextables.extensions.IndexTablesSparkExtensions` (old name is a deprecated alias) |
| Spark versions | 3.5; 4.0 and 4.1 builds | 3.5.9 and 4.2.0 |
| Java API (`tantivy4java`) | `SplitSearcher`, `SplitCacheManager` and others | No replacement. Use Spark or the DataFusion adapter |

Applications that called the `tantivy4java` Java API directly must be ported. Changing Maven coordinates does not replace it.

## Behavior that changed on purpose

These are deliberate. Most turn a silent wrong or slow answer into a correct answer or a clear error.

| Area | 0.5.x | Now |
|---|---|---|
| **Fast mode** | Limited every partition reader, including the input to writes, caches and aggregates | Limits only rows returned to a client. Inputs to other computations are always complete |
| **Aggregates the index cannot compute** | Controlled by `read.requireAggregatePushdown` | Refused by default with an error naming the fix; allow with `acceleration.policy.aggregation` |
| **`indexquery` that cannot reach the index** | Could evaluate to true and return every row | Fails with an error |
| **All-columns search over a join** | Returned every row | Fails at analysis and suggests a subquery |
| **Malformed settings** | Warned and used the default | Fail before the operation runs |
| **Bucket-function arguments** | Non-literal bounds read as unbounded; extra arguments ignored | Fail at analysis |
| **Iceberg row-level deletes in companions** | Not applied | Honoured; no deleted row is returned |
| **`NULL` in filters** | Two-valued shortcuts in places | SQL three-valued logic throughout |
| **Transaction-log caching** | Cached for a period by default | A read sees new commits immediately unless staleness is configured |
| **Table names in commands** | A quoted string could be guessed to be a name | A quoted string is always a location; a name is always unquoted |
| **Entry properties as settings** | Read as settings on some paths | Never read; refused at `CREATE` and `ALTER` |

## Settings

Keys are resolved once per operation, in one order everywhere: operation options, then table properties in the log, then the session, then the Hadoop configuration. Keys are case-insensitive.

| 0.5.x key | Now |
|---|---|
| `read.mode=complete` | `exact`; `complete` still accepted |
| `s3.multipartThreshold`, `s3.partSize`, `s3.maxConcurrency` | Aliases of `storage.multipart.*` |
| `cloud.maxRetries` | Alias of `storage.retry.maxRetries` |
| `aws.endpoint`, `s3.serviceUrl` | Aliases of `s3.endpoint` |
| `aws.pathStyleAccess`, `aws.forcePathStyle` | Aliases of `s3.pathStyleAccess` |
| `companion.aws.*` | Aliases of `companion.parquet.aws.*` |
| `cache.prewarm.enabled` | Alias of `prewarm.enabled` |
| `read.requireAggregatePushdown` | Maps onto `acceleration.policy.aggregation`; prefer the policy |
| Per-tier `transaction.cache.*.ttl.ms` and `.capacity` | Accepted and ignored. Use `transaction.cache.ttl.ms` and the memory and spill settings |
| `companion.parquetTableRoot` | Refused on reads. Register a table root and select it with `companion.tableRootDesignator` |
| `native.memory.enabled` | Accepted and ignored: memory accounting is always on |
| `gcp.serviceAccountKey` | Refused. Use `gcp.credentialsFile` |

Booleans written as `yes`/`no`, `on`/`off` or `1`/`0` are still accepted, with a deprecation warning.

The [configuration reference](/reference/configuration/) lists every key, its aliases, and the keys that are accepted and ignored.

## Running both versions against the same tables

During a migration, some clusters may still run 0.5.5.

**Works:** 0.5.5 and the new version reading and appending to the same standalone tables.

**Does not work, or needs care:**

- **Concurrent writers using the 0.5.4 commit scheme** are unsupported. Upgrade those writers to 0.5.5 first.
- **`MERGE SPLITS` or `DROP PARTITIONS` from 0.5.5 while the new version writes** is unsupported. Run maintenance from one version.
- **Companions that record row-level deletes** raise the table's protocol version. 0.5.5 then refuses unfiltered `COUNT(*)`, `MERGE SPLITS`, `CHECKPOINT` and writes on them, as intended. 0.5.5's *filtered* count on such a table can still count deleted rows; do not run those queries from 0.5.5.
- **Iceberg companions built by 0.5.x** are refused on read until a sync by the new version records the source's deletes, because 0.5.x applied none.
- **Delta companions built by 0.5.x** over a source with deletion vectors are refused on read until a sync records them.
- **Variant columns** written by the new version on Spark 4.2 cannot be read by 0.5.5.
- **Tables by name**: 0.5.5 on Spark 3.5 cannot read catalog entries by name. Keep reading by path there.

## A migration path

1. **Upgrade every 0.5.x cluster to 0.5.5** if it is not already there.
2. **Try the new version read-only** against production tables from a separate cluster. Compare results for your important queries. Expect differences only where the table above says behavior changed.
3. **Fix what the new version refuses.** Typical cases: an aggregate that used to fall back silently, a malformed setting, an `indexquery` applied after `cache()`.
4. **Move writers**, one table at a time. From then on, run maintenance for that table from the new version only.
5. **Sync companions** from the new version, so that row-level deletes are recorded.
6. **Move readers.** When no 0.5.5 process reads a table, you can use features 0.5.5 cannot read, such as Variant columns and tables by name.

## New since 0.5.x

- A [DataFusion adapter](/guides/datafusion/adapter/) for Rust.
- [Tables by name](/guides/catalogs/tables-by-name/) in Spark's session catalog, with `CREATE TABLE … AS SELECT`, `saveAsTable` and `writeTo`.
- [Iceberg and Delta row-level deletes](/guides/companions/deletes/) and incremental sync for both.
- A [Structured Streaming source](/guides/tables/streaming-source/).
- [Variant columns](/guides/tables/variant/) on Spark 4.2.
- Per-query traces and CPU profiles, and [Spark Connect](/guides/operations/spark-connect/) support.

## Not carried over

- The general-purpose Java API of `tantivy4java`.
- A Structured Streaming sink.
- HDFS.
- Table protocols and checkpoint formats older than 0.5.5's.

## Old blog posts and the talk

[Blog posts](/blog/) from before the rebuild and the [conference talk](/why/talks/) describe 0.5.x. Their ideas hold; check commands and settings against this site.
