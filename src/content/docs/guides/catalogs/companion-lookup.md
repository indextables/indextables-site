---
title: Companion lookup catalog
description: A read-only catalog that lets you query a companion under its source table's name, with per-region index roots.
sidebar: { order: 7 }
lid:
  reviewed: a865437
  fingerprint: 2447f2368dca
  class: derived
  cites: [SPARK-OPS-CAT, SPARK-CAT-CMP]
  docs: [spark/operations/operations-design.md#IndexTables catalog]
engine: [spark]
---

People know their tables by name: `prod.logs.events`. The companion lookup catalog lets them search the companion of that table without knowing where the index is stored.

```sql
-- The source table
SELECT count(*) FROM prod.logs.events;

-- Its companion: the same name, under the lookup catalog
SELECT ts, message FROM idx.prod.logs.events
WHERE message indexquery 'timeout';
```

## Set it up

**1. Configure the catalog** under any name; `idx` here.

```text
spark.sql.catalog.idx=io.indextables.catalog.IndexTablesCatalog
```

**2. Tell the source table where its index is**, with table properties on the source.

```sql
ALTER TABLE prod.logs.events SET TBLPROPERTIES (
  'indextables.companion.indexroot' = 's3://my-bucket/indexes'
);
```

**3. Build the companion** at that root plus the relative path, which is `_indextables` unless you say otherwise.

```sql
BUILD INDEXTABLES COMPANION FOR ICEBERG 'logs.events'
  CATALOG 'prod' TYPE 'rest'
  AT LOCATION 's3://my-bucket/indexes/_indextables';
```

## How a name resolves

`idx.<sourceCatalog>.<namespace>.<table>` names the source table `<namespace>.<table>` in `<sourceCatalog>`. The lookup catalog reads that table's properties and joins a root with a relative path:

| Property on the source table | Meaning |
|---|---|
| `indextables.companion.indexroot.<region>` | The index root for one region. Used when it matches the region the session runs in |
| `indextables.companion.indexroot` | The index root otherwise |
| `indextables.companion.tableroot.relativepath` | The path of the index under the root. Defaults to `_indextables`; `.` means the root itself |

## Per-region roots

One source table, shared through a global metastore, can name a replica of its index in each region. Each cluster reads the replica near it.

```sql
ALTER TABLE prod.logs.events SET TBLPROPERTIES (
  'indextables.companion.indexroot'            = 's3://indexes-us-east-1/logs',
  'indextables.companion.indexroot.eu-west-1'  = 's3://indexes-eu-west-1/logs',
  'indextables.companion.indexroot.ap-south-1' = 's3://indexes-ap-south-1/logs'
);
```

The region is taken from `spark.indextables.aws.region`, then the Hadoop setting `fs.s3a.endpoint.region`, then the `aws.region` system property, then the `AWS_DEFAULT_REGION` and `AWS_REGION` environment variables.

## What it is and is not

- **Read-only.** It creates, alters, renames and drops nothing.
- **It holds no entries.** Everything is derived from the source table's properties on each lookup, and cached per session for a time set by `catalog.cache.ttl.minutes`.
- **It does not grant access.** The index is opened by its location with the credentials for that location, exactly as a read by path. Permission on the source table is needed to look the name up, and does not by itself allow reading the index.
- **Commands accept its names.** `PREWARM INDEXTABLES CACHE idx.prod.logs.events` works like any other name.

## Or register the companion directly

A companion can also be registered as an ordinary entry in the session catalog:

```sql
CREATE TABLE logs.events_idx USING indextables
LOCATION 's3://my-bucket/indexes/_indextables';
```

When a companion is reachable both ways, the two must agree: resolving the entry checks that its location is one of the roots the source table's properties name, and fails with both lists if it is not.
